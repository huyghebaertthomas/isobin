import { getBinType } from "./binType.js";

/**
 * Turn an authored row list into one entry per physical row.
 *
 * Accepts a bare type name (`"small"`) or an object; `repeat` fans a row out
 * into several identical ones. Everything the builder needs is resolved here so
 * the geometry pass never touches raw config.
 */
export function expandRows(rows, binTypes) {
  const out = [];

  for (const entry of rows) {
    const row = typeof entry === "string" ? { type: entry } : entry;
    const type = getBinType(binTypes, row.type);
    const count = row.count ?? type.perRow;

    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`Row of type "${row.type}" needs a bin count of 1 or more, got ${count}.`);
    }

    for (let i = 0; i < (row.repeat ?? 1); i++) {
      out.push({ typeName: row.type, type, count, divided: row.divided, source: row });
    }
  }

  return out;
}
