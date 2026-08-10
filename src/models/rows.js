import { getBinType } from "./binType.js";
import { resolveDivider } from "./divider.js";

/**
 * Turn an authored row list into one entry per physical row, with every slot
 * across that row resolved.
 *
 * A row is a strip of the cabinet's width divided into slots. The simple case
 * names a bin type and a count, and the slots come out equal:
 *
 *   "small"                        five small bins, from the type's `perRow`
 *   { type: "large", repeat: 2 }   two identical rows
 *
 * The general case lists what is in the row. Each entry takes `span` slots, so
 * the row's width is however many slots its entries add up to — a 3 and a 4
 * make sevenths without the number seven appearing anywhere, and changing the 4
 * to a 5 re-proportions the row rather than overflowing it:
 *
 *   { bins: [{ span: 3, id: "L" }, { span: 4, id: "R" }] }
 *
 * An entry can also be a hole. A shelf with two slots kept clear for something
 * that is not a bin at all is a real arrangement, and the drawing should be
 * able to say so:
 *
 *   { bins: [{ id: "A" }, { gap: 2 }, { id: "B" }] }
 *
 * Everything the geometry pass needs is resolved here, so it never sees raw
 * config and never has to ask what a shorthand meant.
 */

/** what a bin with no type is: one row unit tall, undivided, free to slide */
const PLAIN = { rowUnits: 1, perRow: 1 };

export function expandRows(rows, binTypes, where) {
  const out = [];

  for (const entry of rows) {
    const row = typeof entry === "string" ? { type: entry } : entry;
    const repeat = row.repeat ?? 1;

    if (!Number.isInteger(repeat) || repeat < 1) {
      throw new Error(`${where}: \`repeat\` must be a whole number of 1 or more, got ${repeat}.`);
    }

    const built = buildRow(row, binTypes, where);
    for (let i = 0; i < repeat; i++) out.push(built);
  }

  return out;
}

function buildRow(row, binTypes, where) {
  const type = row.type === undefined ? null : getBinType(binTypes, row.type);
  const slots = row.bins ? listed(row, type, binTypes, where) : counted(row, type, where);

  const bins = slots.filter((slot) => slot.bin).map((slot) => slot.bin);
  if (!bins.length) {
    throw new Error(`${where}: a row has to hold at least one bin — this one is all gaps.`);
  }

  // a row is as tall as the tallest thing in it, unless it says otherwise
  const units =
    row.height ?? Math.max(...bins.map((bin) => bin.type?.rowUnits ?? PLAIN.rowUnits));

  if (!(units > 0)) {
    throw new Error(`${where}: a row's \`height\` must be greater than zero, got ${row.height}.`);
  }

  return {
    typeName: row.type ?? null,
    type,
    units,
    slots,
    /** total slots across the row, gaps included — what widths are fractions of */
    span: slots.reduce((sum, slot) => sum + slot.span, 0),
    count: bins.length,
    source: row,
  };
}

/** the simple row: one type, N equal slots */
function counted(row, type, where) {
  if (!type) {
    throw new Error(
      `${where}: a row needs either a \`type\` or a \`bins\` list — this one has neither.`
    );
  }

  const count = row.count ?? type.perRow;
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`${where}: a row of "${row.type}" needs a bin count of 1 or more, got ${count}.`);
  }

  return Array.from({ length: count }, (_, index) => ({
    span: 1,
    bin: resolveBin({}, row, type, index, where),
  }));
}

/** the general row: whatever is listed, at whatever width each asks for */
function listed(row, rowType, binTypes, where) {
  if (!Array.isArray(row.bins)) {
    throw new Error(`${where}: \`bins\` must be an array, got ${typeof row.bins}.`);
  }

  let index = 0;

  return row.bins.map((raw) => {
    const entry = typeof raw === "string" ? { type: raw } : (raw ?? { gap: 1 });

    if (typeof entry !== "object") {
      throw new Error(`${where}: a bin is an object, a type name, or a gap — got ${typeof entry}.`);
    }

    const gap = entry.gap;
    if (gap !== undefined && gap !== false) {
      return { span: spanOf(gap === true ? 1 : gap, where, "gap"), bin: null };
    }

    const type = entry.type === undefined ? rowType : getBinType(binTypes, entry.type);
    return {
      span: spanOf(entry.span ?? 1, where, "span"),
      bin: resolveBin(entry, row, type, index++, where),
    };
  });
}

/**
 * One bin, with everything about it settled: which type it borrows defaults
 * from, how far it can travel, and whether it is divided.
 */
function resolveBin(entry, row, type, index, where) {
  const named = entry.id ?? row.ids?.[index] ?? row.id;
  const at = `${where}, bin ${named ?? index + 1}`;

  return {
    typeName: entry.type ?? row.type ?? null,
    type: type ?? PLAIN,
    id: entry.id,
    index,
    label: entry.label,
    divider: resolveDivider(
      entry.divider,
      row.divider ?? legacyDivided(row),
      type?.divider,
      at
    ),
    /** anything else the author hung on the bin, handed back untouched */
    data: entry.data,
  };
}

/** `divided: false` was how a row turned its type's divider off */
const legacyDivided = (row) => (row.divided === undefined ? undefined : row.divided);

function spanOf(value, where, what) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${where}: \`${what}\` must be a whole number of 1 or more, got ${value}.`);
  }
  return value;
}
