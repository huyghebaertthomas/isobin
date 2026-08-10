/**
 * Shorthands for writing a layout out by hand.
 *
 * These are conveniences and nothing more: each returns the plain object you
 * would otherwise have typed, so a layout built with them is still data —
 * `JSON.stringify` survives it, a server can send it, a database can hold it.
 * Nothing in the library requires them, and a config written without them is
 * not a lesser config.
 *
 *   import { bin, gap, row } from "isobin/core";
 *
 *   row(bin(3, "L"), gap(), bin(3, "R"))
 *   // → { bins: [{ span: 3, id: "L" }, { gap: 1 }, { span: 3, id: "R" }] }
 *
 * The point of them is the reading: a row written this way has its shape on one
 * line, and the widths line up in the source the way they line up on the shelf.
 */

/**
 * One bin. Called as `bin(span, id)` for the common case, or with an object for
 * everything else — the two forms produce the same thing.
 *
 *   bin()                          one slot, named by position
 *   bin(3)                         three slots wide
 *   bin(3, "R-100")                three slots wide, and called R-100
 *   bin({ span: 3, id: "R-100", divider: { split: "width", into: 3 } })
 *
 * @param {number|import("../types.js").BinSpec} [span]
 * @param {string} [id]
 * @returns {import("../types.js").BinSpec}
 */
export function bin(span, id) {
  // `span` is always written out, even when it is the default 1. It is what
  // tells a bin apart from a row's settings in `row(…)`, and a bin that only
  // says `{ type: "small" }` would otherwise be indistinguishable from one.
  if (span !== undefined && typeof span === "object") return { span: 1, ...span };

  return { span: span ?? 1, ...(id !== undefined && { id }) };
}

/**
 * Space in a row with no bin in it — the shelf runs on underneath.
 *
 * @param {number} [span] how many slots to leave clear (default 1)
 * @returns {{ gap: number }}
 */
export function gap(span = 1) {
  return { gap: span };
}

/**
 * A row of whatever you pass it. Takes the entries as arguments or as one
 * array, and an optional object first for anything the row itself needs.
 *
 *   row(bin(3), gap(), bin(3))
 *   row({ height: 2 }, bin(3), bin(4))
 *
 * @returns {import("../types.js").RowSpec}
 */
export function row(...entries) {
  const head = entries[0];
  const settings = isRowSettings(head) ? entries.shift() : null;
  const bins = entries.length === 1 && Array.isArray(entries[0]) ? entries[0] : entries;

  return { ...settings, bins };
}

/**
 * Anything that is plainly not a bin or a gap is settings for the row. Told
 * apart by what it lacks rather than by a marker, so `row({ height: 2 }, …)`
 * works without the caller having to say which kind of object it is.
 */
const isRowSettings = (value) =>
  value != null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  value.gap === undefined &&
  value.span === undefined &&
  value.id === undefined;
