const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const importerUrl = pathToFileURL(
  path.join(__dirname, "..", "scripts", "catalog-import.mjs"),
).href;

async function loadImporter() {
  return import(`${importerUrl}?test=${Date.now()}-${Math.random()}`);
}

test("catalog importer normalizes course identity to one compact uppercase code", async () => {
  const importer = await loadImporter();
  assert.equal(importer.normalizeCourseCode(" cse 110 "), "CSE110");
  assert.equal(importer.normalizeCourseCode("ece 283l"), "ECE283L");
  assert.equal(importer.normalizeCourseCode("ant 401 (b)"), "ANT401(B)");
  assert.equal(importer.normalizeDepartmentId("MNS"), "MPS");
  assert.equal(importer.normalizeDepartmentId("MPS"), "MPS");
  assert.equal(importer.normalizeDepartmentId("GED"), "GENED");
  assert.equal(importer.normalizeDepartmentId("SGE"), "GENED");
});

test("catalog importer keeps one owning-unit row when the workbook repeats a course in SGE", async () => {
  const importer = await loadImporter();
  const rows = [
    {
      unit: "School of General Education",
      shortForm: "SGE",
      unitType: "School",
      category: "Math & Science",
      code: " mat 110 ",
      title: "Mathematics I: Differential Calculus and Co-ordinate Geometry",
      notes: "",
    },
    {
      unit: "Department of Mathematics & Physical Sciences",
      shortForm: "MPS",
      unitType: "Department",
      category: "Mathematics / Statistics",
      code: "MAT110",
      title: "Mathematics I: Differential Calculus & Coordinate Geometry",
      notes: "",
    },
  ];

  assert.deepEqual(importer.deduplicateCourseRows(rows), [
    {
      code: "MAT110",
      title: "Mathematics I: Differential Calculus & Coordinate Geometry",
      department: "MPS",
      sourceCategory: "Mathematics / Statistics",
      sourceUnits: ["MPS", "GENED"],
      notes: "",
    },
  ]);
});

test("catalog seed preserves unknown credits and applies curriculum visibility metadata", async () => {
  const importer = await loadImporter();
  const result = importer.buildCatalogSeed({
    units: [
      {
        shortForm: "CSE",
        unit: "Department of Computer Science and Engineering",
        unitType: "Department",
      },
      {
        shortForm: "ARC",
        unit: "Department of Architecture",
        unitType: "Department",
      },
    ],
    rows: [
      {
        shortForm: "ARC",
        category: "Architecture Core",
        code: "ARC201",
        title: "Design Studio III",
      },
      {
        shortForm: "CSE",
        category: "CSE Undergraduate Catalog",
        code: "CSE110",
        title: "Programming Language I",
      },
      {
        shortForm: "CSE",
        category: "CSE Undergraduate Catalog",
        code: "cse 110",
        title: "Duplicate title must not produce another row",
      },
    ],
    curriculum: {
      CSE110: {
        category: "program-core",
        sourceNote: "CS degree plan: Program Core",
      },
    },
    alternativeCodes: ["ARC201"],
  });

  assert.equal(result.departmentCount, 2);
  assert.equal(result.courseCount, 2);
  assert.equal(result.duplicateSourceRowCount, 1);
  assert.match(
    result.sql,
    /\('ARC201', 'Design Studio III', null, 'ARC', 'architecture-core', 'alternative'/,
  );
  assert.match(
    result.sql,
    /\('CSE110', 'Programming Language I', null, 'CSE', 'program-core', 'curriculum'/,
  );
  assert.doesNotMatch(result.sql, /Duplicate title must not produce another row/);
  assert.match(result.sql, /on conflict \(code\) do update[\s\S]*visibility = excluded\.visibility/);
  assert.doesNotMatch(result.sql, /title = excluded\.title/);
});

test("canonical importer merges legacy department aliases and deduplicates their units", async () => {
  const importer = await loadImporter();
  const result = importer.buildCatalogSeed({
    units: [
      { shortForm: "MNS", unit: "Mathematics and Natural Sciences" },
      { shortForm: "MPS", unit: "Department of Mathematics & Physical Sciences" },
      { shortForm: "GED", unit: "General Education" },
      { shortForm: "SGE", unit: "School of General Education" },
    ],
    rows: [
      { shortForm: "MNS", code: "MAT110", title: "Mathematics I", category: "Math" },
      { shortForm: "SGE", code: "SOC101", title: "Sociology", category: "Social Science" },
    ],
  });
  assert.deepEqual(result.departments.map(item => [item.id, item.name]), [
    ["GENED", "School of General Education"],
    ["MPS", "Department of Mathematics & Physical Sciences"],
  ]);
  assert.match(result.sql, /\('MAT110'[^\n]*'MPS'/);
  assert.match(result.sql, /\('SOC101'[^\n]*'GENED'/);
});

test("catalog importer generates deterministic SQL and safely escapes workbook text", async () => {
  const importer = await loadImporter();
  const input = {
    units: [
      {
        shortForm: "SoL",
        unit: "School of Law",
        unitType: "School",
      },
    ],
    rows: [
      {
        shortForm: "SoL",
        category: "Law electives",
        code: "LAW101",
        title: "People's Law",
        notes: "Owner's source",
      },
    ],
    curriculum: {},
  };

  const first = importer.buildCatalogSeed(input);
  const second = importer.buildCatalogSeed(input);
  assert.equal(first.sql, second.sql);
  assert.match(first.sql, /\('SOL', 'School of Law', 'violet'\)/);
  assert.match(first.sql, /'People''s Law'/);
  assert.match(first.sql, /'Owner''s source'/);
});

test("catalog visibility schema is forward-only, nullable-credit, validated, and service-role mutated", () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "202608280020_catalog_course_visibility.sql",
    ),
    "utf8",
  );

  assert.match(
    migration,
    /alter column credits drop not null/i,
    "unknown workbook credits must remain nullable",
  );
  assert.match(
    migration,
    /visibility text not null default 'curriculum'/i,
  );
  assert.match(
    migration,
    /visibility in \('curriculum', 'search_only'\)/i,
  );
  assert.match(
    migration,
    /\^\[A-Z\]\{2,6\}\[0-9\]\{2,4\}\(\[A-Z\]\|\\\(\[A-Z\]\\\)\)\?\$/,
    "catalog codes must accept the workbook's ANT401(B) variant without allowing arbitrary punctuation",
  );
  assert.match(
    migration,
    /nullif\(catalog_item->>'credits', ''\)::numeric/i,
  );
  assert.match(migration, /catalog_item->>'visibility'/i);
  assert.match(
    migration,
    /revoke all on function public\.mutate_global_catalog[\s\S]*from public, anon, authenticated/i,
  );
  assert.match(
    migration,
    /grant execute on function public\.mutate_global_catalog[\s\S]*to service_role/i,
  );
});

test("generated complete catalog seed has the verified counts and no duplicate course codes", () => {
  const migration = fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "supabase",
      "migrations",
      "202608280021_seed_complete_course_catalog.sql",
    ),
    "utf8",
  );
  const departmentsBlock = migration.match(
    /insert into public\.catalog_departments[\s\S]*?\nvalues\n([\s\S]*?)\non conflict \(id\)/i,
  )?.[1] || "";
  const coursesBlock = migration.match(
    /insert into public\.catalog_courses[\s\S]*?\nvalues\n([\s\S]*?)\non conflict \(code\)/i,
  )?.[1] || "";
  const departmentIds = [...departmentsBlock.matchAll(/^\s{2}\('([^']+)'/gm)]
    .map((match) => match[1]);
  const courseCodes = [...coursesBlock.matchAll(/^\s{2}\('([^']+)'/gm)]
    .map((match) => match[1]);

  assert.equal(departmentIds.length, 13);
  assert.equal(new Set(departmentIds).size, 13);
  assert.equal(courseCodes.length, 965);
  assert.equal(new Set(courseCodes).size, 965);
  assert.equal((coursesBlock.match(/, 'curriculum',/g) || []).length, 93);
  assert.equal((coursesBlock.match(/, 'search_only',/g) || []).length, 872);
  assert.match(migration, /on conflict \(code\) do update/i);
  assert.doesNotMatch(migration, /title\s*=\s*excluded\.title/i);
});
