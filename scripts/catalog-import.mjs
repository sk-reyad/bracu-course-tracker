import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  ALTERNATIVE_COURSE_CODES,
  CURRICULUM_COURSES,
  DEPARTMENT_COLORS,
  PDF_ONLY_COURSES,
} from "./catalog-source-config.mjs";

const DEPARTMENT_ALIASES = Object.freeze({ MNS: "MPS", GED: "GENED", SGE: "GENED" });
const CANONICAL_DEPARTMENT_NAMES = Object.freeze({
  MPS: "Department of Mathematics & Physical Sciences",
  GENED: "School of General Education",
});

export function normalizeCourseCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function normalizeDepartmentId(value) {
  const id = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  return DEPARTMENT_ALIASES[id] || id;
}

export function slugifyCategoryLabel(value) {
  return (
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[’']/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/g, "") || "uncategorized"
  );
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function sourcePriority(row) {
  return normalizeDepartmentId(row.shortForm) === "GENED" ? 1 : 0;
}

export function deduplicateCourseRows(rows) {
  const grouped = new Map();
  for (const raw of Array.isArray(rows) ? rows : []) {
    const code = normalizeCourseCode(raw?.code);
    if (!code) continue;
    const row = {
      ...raw,
      code,
      shortForm: normalizeDepartmentId(raw.shortForm),
      title: cleanText(raw.title),
      category: cleanText(raw.category),
      notes: cleanText(raw.notes),
    };
    if (!grouped.has(code)) grouped.set(code, []);
    grouped.get(code).push(row);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right, undefined, { numeric: true }))
    .map(([code, matches]) => {
      const ranked = matches
        .map((row, index) => ({ row, index }))
        .sort(
          (left, right) =>
            sourcePriority(left.row) - sourcePriority(right.row) ||
            left.index - right.index,
        );
      const primary = ranked[0].row;
      const sourceUnits = [
        primary.shortForm,
        ...[...new Set(matches.map((row) => row.shortForm))]
          .filter((unit) => unit && unit !== primary.shortForm)
          .sort(),
      ];
      return {
        code,
        title: primary.title,
        department: primary.shortForm,
        sourceCategory: primary.category,
        sourceUnits,
        notes:
          primary.notes || matches.map((row) => row.notes).find(Boolean) || "",
        ...(Object.hasOwn(primary, "credits")
          ? { credits: primary.credits }
          : {}),
      };
    });
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNumber(value) {
  return Number.isFinite(Number(value)) && value !== null && value !== ""
    ? String(Number(value))
    : "null";
}

function normalizeUnits(units) {
  const byId = new Map();
  for (const unit of Array.isArray(units) ? units : []) {
    const id = normalizeDepartmentId(unit?.shortForm);
    if (!id || byId.has(id)) continue;
    byId.set(id, {
      id,
      name: CANONICAL_DEPARTMENT_NAMES[id] || cleanText(unit.unit || unit.name),
      color: DEPARTMENT_COLORS[id] || "gray",
    });
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export function buildCatalogSeed({
  units,
  rows,
  curriculum = {},
  supplementalCourses = [],
  alternativeCodes = [],
} = {}) {
  const normalizedUnits = normalizeUnits(units);
  const workbookRows = Array.isArray(rows) ? rows : [];
  const supplements = Array.isArray(supplementalCourses)
    ? supplementalCourses
    : [];
  const courses = deduplicateCourseRows([...workbookRows, ...supplements]);
  const curriculumByCode = Object.fromEntries(
    Object.entries(curriculum || {}).map(([code, value]) => [
      normalizeCourseCode(code),
      value,
    ]),
  );
  const alternativeCodeSet = new Set(
    (Array.isArray(alternativeCodes) ? alternativeCodes : [])
      .map(normalizeCourseCode)
      .filter(Boolean),
  );

  const departmentValues = normalizedUnits
    .map(
      (unit) =>
        `  (${sqlString(unit.id)}, ${sqlString(unit.name)}, ${sqlString(unit.color)})`,
    )
    .join(",\n");
  const courseValues = courses
    .map((course) => {
      const curriculumItem = curriculumByCode[course.code];
      const category = curriculumItem?.category
        ? slugifyCategoryLabel(curriculumItem.category)
        : slugifyCategoryLabel(course.sourceCategory);
      const visibility = alternativeCodeSet.has(course.code)
        ? "alternative"
        : curriculumItem
          ? "curriculum"
          : "search_only";
      const sourceNote =
        curriculumItem?.sourceNote || course.notes || "Workbook master catalog";
      return `  (${[
        sqlString(course.code),
        sqlString(course.title),
        sqlNumber(course.credits),
        sqlString(course.department),
        sqlString(category),
        sqlString(visibility),
        sqlString(sourceNote),
      ].join(", ")})`;
    })
    .join(",\n");

  const sql = `-- Generated by scripts/catalog-import.mjs. Do not edit source rows by hand.
-- Departments: ${normalizedUnits.length}; workbook rows: ${workbookRows.length}; PDF-only rows: ${supplements.length}; unique courses: ${courses.length}.
begin;

insert into public.catalog_departments (id, name, color)
values
${departmentValues}
on conflict (id) do nothing;

insert into public.catalog_courses (
  code, title, credits, department, category, visibility, source_note
)
values
${courseValues}
on conflict (code) do update
set visibility = excluded.visibility,
    category = case
      when excluded.visibility = 'curriculum' then excluded.category
      else public.catalog_courses.category
    end,
    updated_at = now()
where public.catalog_courses.visibility is distinct from excluded.visibility
   or (
     excluded.visibility = 'curriculum'
     and public.catalog_courses.category is distinct from excluded.category
   );

commit;
`;

  return Object.freeze({
    sql,
    departmentCount: normalizedUnits.length,
    courseCount: courses.length,
    workbookCourseCount: deduplicateCourseRows(workbookRows).length,
    supplementalCourseCount: supplements.length,
    duplicateSourceRowCount: workbookRows.length + supplements.length - courses.length,
    departments: normalizedUnits,
    courses,
  });
}

export async function readWorkbookCatalog(sourcePath) {
  const reader = await import("./catalog-workbook-reader.mjs");
  return reader.readWorkbookCatalog(sourcePath);
}

async function runCli() {
  const [, , sourcePath, outputPath] = process.argv;
  if (!sourcePath || !outputPath) {
    throw new Error(
      "Usage: node scripts/catalog-import.mjs <source.xlsx> <output.sql>",
    );
  }
  const source = await readWorkbookCatalog(sourcePath);
  const result = buildCatalogSeed({
    ...source,
    curriculum: CURRICULUM_COURSES,
    supplementalCourses: PDF_ONLY_COURSES,
    alternativeCodes: ALTERNATIVE_COURSE_CODES,
  });
  await fs.writeFile(outputPath, result.sql, "utf8");
  process.stdout.write(
    `${JSON.stringify({
      departments: result.departmentCount,
      workbookRows: source.rows.length,
      workbookUniqueCourses: result.workbookCourseCount,
      pdfOnlyCourses: result.supplementalCourseCount,
      uniqueCourses: result.courseCount,
      duplicateSourceRows: result.duplicateSourceRowCount,
      outputPath,
    })}\n`,
  );
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (entryUrl === import.meta.url) {
  runCli().catch((error) => {
    process.stderr.write(`${error?.stack || error}\n`);
    process.exitCode = 1;
  });
}
