/** Lookup and validation for the bin-type registry in `config/binTypes.js`. */

export function getBinType(binTypes, name) {
  const type = binTypes[name];
  if (!type) {
    throw new Error(
      `Unknown bin type "${name}". Known types: ${Object.keys(binTypes).join(", ")}.`
    );
  }
  return type;
}

/**
 * The divider actually fitted to a bin, or null.
 *
 * A type whose divider is not `optional` always keeps it; otherwise the row may
 * ask for a bare bin with `divided: false`. A single-compartment result means
 * no divider at all.
 */
export function fittedDivider(type, requested) {
  const spec = type.divider;
  if (!spec) return null;

  const wanted = spec.optional ? (requested ?? spec.fittedByDefault) : true;
  if (!wanted || spec.compartments < 2) return null;

  return { axis: spec.axis, compartments: spec.compartments };
}

/** How far this bin travels when opened. */
export function pullDistance(type, binDepth, pullFraction) {
  return Math.min(binDepth * pullFraction, type.maxPull ?? Infinity);
}
