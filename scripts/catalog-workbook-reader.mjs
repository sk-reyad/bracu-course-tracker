import fs from "node:fs/promises";
import { SpreadsheetFile } from "@oai/artifact-tool";

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export async function readWorkbookCatalog(sourcePath) {
  const bytes = await fs.readFile(sourcePath);
  const arrayBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  const workbook = await SpreadsheetFile.importXlsx(arrayBuffer);
  const values = workbook.worksheets
    .getItem("All Courses")
    .getRange("A1:G993").values;
  const rows = values
    .slice(4)
    .filter((row) => row[4] && row[5])
    .map((row) => ({
      unit: cleanText(row[0]),
      shortForm: cleanText(row[1]),
      unitType: cleanText(row[2]),
      category: cleanText(row[3]),
      code: normalizeCode(row[4]),
      title: cleanText(row[5]),
      notes: cleanText(row[6]),
    }));
  const units = [];
  const seenUnits = new Set();
  for (const row of rows) {
    const id = normalizeCode(row.shortForm);
    if (!id || seenUnits.has(id)) continue;
    seenUnits.add(id);
    units.push({
      unit: row.unit,
      shortForm: id,
      unitType: row.unitType,
    });
  }
  return { units, rows };
}
