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

/** How far this bin travels when opened. */
export function pullDistance(type, binDepth, pullFraction) {
  return Math.min(binDepth * pullFraction, type?.maxPull ?? Infinity);
}
