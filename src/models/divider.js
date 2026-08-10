/**
 * Whether a bin is divided, which way, and into how many compartments.
 *
 * A divider is a property of the bin, not a fact about its type. The type is
 * only where the default comes from, and any bin or row may say otherwise —
 * including saying no, always, whatever the type wanted. A physical divider is
 * a piece of plastic you can take out, and the model should not be stricter
 * than the shelf.
 *
 * Which way it runs is said in terms of what it splits rather than which axis
 * it lies on, because "the x divider" tells you nothing while looking at a bin:
 *
 *   { split: "width", into: 3 }   three compartments left to right
 *   { split: "depth", into: 2 }   two compartments front to back
 *
 * Shorthands, all of which mean one of the above:
 *
 *   3            three compartments, split whichever way the type splits
 *   "width"      two compartments, left and right
 *   false        no divider, whatever the type says
 *   true         the type's divider
 */

/** what each `split` means to the geometry pass, which thinks in axes */
const AXIS = { width: "x", depth: "z" };
/** and the way back, for reading a legacy `axis` */
const SPLIT = { x: "width", z: "depth" };

const DEFAULT_SPLIT = "depth";

/**
 * Fold a bin's divider over its row's over its type's, and answer what is
 * actually fitted. Returns null for an undivided bin.
 *
 * @param {unknown} binSpec  what the bin said, if anything
 * @param {unknown} rowSpec  what the row said, if anything
 * @param {unknown} typeSpec the bin type's default
 * @param {string} where     for the error message, if one is needed
 */
export function resolveDivider(binSpec, rowSpec, typeSpec, where) {
  const base = read(typeSpec, where);

  // most specific wins, and `false` at any level is an answer, not an absence
  for (const spec of [binSpec, rowSpec]) {
    if (spec === undefined) continue;
    if (spec === true) return fit(base);

    const asked = read(spec, where);
    // a bare count or a bare direction only says one thing; the type fills in
    // the rest, so `divider: 3` on a depth-split type stays depth-split
    return fit(asked && base ? { ...base, ...asked } : asked);
  }

  return fit(base);
}

/** a spec in any of its accepted forms, as `{ split, into }` or null */
function read(spec, where) {
  if (spec == null || spec === false) return null;
  if (spec === true) return { split: DEFAULT_SPLIT, into: 2 };

  if (typeof spec === "number") {
    if (!Number.isInteger(spec) || spec < 1) {
      throw new Error(`${where}: a divider count must be a whole number, got ${spec}.`);
    }
    return { into: spec };
  }

  if (typeof spec === "string") {
    if (!(spec in AXIS)) {
      throw new Error(`${where}: a divider splits "width" or "depth", not ${JSON.stringify(spec)}.`);
    }
    return { split: spec, into: 2 };
  }

  if (typeof spec !== "object") {
    throw new Error(`${where}: a divider is a count, a direction, an object, or false.`);
  }

  // the older vocabulary, still honoured: an axis, a compartment count, and a
  // `fittedByDefault` that could turn the type's own divider off
  const split = spec.split ?? SPLIT[spec.axis] ?? undefined;
  const into = spec.into ?? spec.compartments;

  if (split !== undefined && !(split in AXIS)) {
    throw new Error(`${where}: a divider splits "width" or "depth", not ${JSON.stringify(split)}.`);
  }
  if (into !== undefined && (!Number.isInteger(into) || into < 1)) {
    throw new Error(`${where}: a divider count must be a whole number, got ${into}.`);
  }
  if (spec.fittedByDefault === false) return null;

  // only the keys actually given, so folding this over a type's default does
  // not blank out the half it did not mention
  return { ...(split !== undefined && { split }), ...(into !== undefined && { into }) };
}

/** one compartment is an undivided bin, and there is nothing to draw */
function fit(spec) {
  if (!spec) return null;

  const into = spec.into ?? 2;
  if (into < 2) return null;

  const split = spec.split ?? DEFAULT_SPLIT;
  return { split, into, axis: AXIS[split], compartments: into };
}
