/**
 * Recursive merge used to fold user overrides into the default config.
 *
 * Plain objects merge key by key; everything else (arrays, functions,
 * primitives) is replaced wholesale, so an override that supplies a `rows`
 * array replaces the default rows rather than concatenating with them.
 */

const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !Array.isArray(v) && typeof v !== "function";

export function deepMerge(base, patch) {
  if (patch === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch;

  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = key in base ? deepMerge(base[key], value) : value;
  }
  return out;
}

/**
 * The inverse: the smallest patch that turns `base` into `next`, or `undefined`
 * when they already agree. Arrays are replaced wholesale, matching the merge
 * above, so a single changed surface emits the whole `surfaces` array.
 *
 * This is what the control panel copies to the clipboard — whatever you dial in
 * comes back out as an override object you can paste into code.
 */
export function diff(base, next) {
  if (!isPlainObject(base) || !isPlainObject(next)) {
    return equivalent(base, next) ? undefined : next;
  }

  const out = {};
  for (const [key, value] of Object.entries(next)) {
    const patch = diff(base[key], value);
    if (patch !== undefined) out[key] = patch;
  }
  return Object.keys(out).length ? out : undefined;
}

/** identity first, so functions and other unserialisable values still compare */
const equivalent = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);
