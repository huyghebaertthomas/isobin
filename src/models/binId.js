/**
 * What a bin is called.
 *
 * The default is positional — cabinet, row, place in the row — which is fine
 * for a drawing and wrong for a record. Insert a shelf at the top of a cabinet
 * and every id below it shifts by one, so anything stored against `"A-2-3"`
 * now points at the bin above. For a twin whose ids live in somebody's
 * database that is not a cosmetic problem.
 *
 * So a layout can say what its bins are called, and then they are called that
 * however the drawing is rearranged around them:
 *
 *   { bins: [{ id: "R-100" }, { id: "R-101" }] }          one bin at a time
 *   { type: "small", ids: ["R-100", "R-101", "R-102"] }   one per bin
 *   { type: "large", id: "BULK-A" }                       a row, numbered from it
 *   layout.idFor = ({ organizerId, row, index }) => …     everything at once
 *
 * Most specific wins: a bin's own id beats a row's `ids`, which beats a row
 * name, which beats `idFor`, which beats the positional default.
 */

/** the naming rules for one row, resolved once so the geometry pass can just ask */
export function binNamer(row, { organizerId, rowIndex, idFor }) {
  const { id, ids, repeat } = row.source ?? {};
  const named = row.slots.some((slot) => slot.bin?.id !== undefined);
  const what = row.typeName ? `Row "${row.typeName}"` : "Row";

  if (ids && !Array.isArray(ids)) {
    throw new Error(`${what} of ${organizerId}: \`ids\` must be an array.`);
  }

  if (ids && ids.length !== row.count) {
    throw new Error(
      `${what} of ${organizerId} holds ${row.count} bins but was given ` +
        `${ids.length} id${ids.length === 1 ? "" : "s"}. Name every bin in the row, or none.`
    );
  }

  // `repeat` makes several rows out of one entry, and they cannot all be called
  // the same thing — so naming and repeating are mutually exclusive
  if ((ids || id || named) && (repeat ?? 1) > 1) {
    throw new Error(
      `${what} of ${organizerId} cannot use \`repeat\` with named bins: ` +
        `every repeat would take the same name. Write the rows out, or drop the names.`
    );
  }

  return (bin) => {
    if (bin.id !== undefined) return String(bin.id);
    if (ids) return String(ids[bin.index]);
    // a row of one is the whole of what its name refers to; numbering it `-0`
    // would only ever be noise
    if (id) return row.count === 1 ? String(id) : `${id}-${bin.index}`;
    if (idFor) {
      return String(
        idFor({ organizerId, row: rowIndex, index: bin.index, type: bin.typeName ?? row.typeName })
      );
    }
    return `${organizerId}-${rowIndex}-${bin.index}`;
  };
}

/**
 * Every id has to be unique, because every id is an address: `binsById`, the
 * open set and everything a caller does are all keyed on it. Two bins sharing
 * a name is not a drawing that looks slightly wrong, it is one bin that cannot
 * be reached and another that answers for both.
 */
export function assertUniqueIds(bins) {
  const seen = new Map();

  for (const bin of bins) {
    const first = seen.get(bin.id);
    if (first !== undefined) {
      throw new Error(
        `Two bins are called ${JSON.stringify(bin.id)} — ${first} and ${bin.label}. ` +
          `Bin ids are addresses, so they have to be unique.`
      );
    }
    seen.set(bin.id, bin.label);
  }
}
