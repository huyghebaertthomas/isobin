/**
 * Reading and writing nested config by dotted path — `"view.padding.top"`, or
 * `"appearance.surfaces.1.fill"` to reach into an array.
 *
 * Writes are immutable and clone only the containers along the path, so every
 * branch the edit did not touch keeps its identity. That matters: the scene and
 * the idle animation are memoised on the objects they were handed, so nudging a
 * colour must not look like a change to the layout or the timings.
 */

const keys = (path) => (Array.isArray(path) ? path : String(path).split("."));

export const getAt = (target, path) =>
  keys(path).reduce((value, key) => (value == null ? undefined : value[key]), target);

export function setAt(target, path, value) {
  const [key, ...rest] = keys(path);
  if (key === undefined) return value;

  const clone = Array.isArray(target) ? [...target] : { ...target };
  clone[key] = rest.length ? setAt(target[key] ?? {}, rest, value) : value;
  return clone;
}
