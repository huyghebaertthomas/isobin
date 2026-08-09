/**
 * Which bins are open, as a value.
 *
 * The open set is an ordered list of ids, and every change is a pure function
 * of the old list. That keeps the two modes honest — `single` is not a flag
 * checked in four places, it is one branch in `openBins` that the others go
 * through — and it means the semantics can be tested without mounting
 * anything.
 *
 * A change that changes nothing returns the very list it was given, so a
 * component holding this in state can skip the render.
 */

/** one id or several, minus anything empty */
const list = (ids) => (Array.isArray(ids) ? ids : [ids]).filter((id) => id != null && id !== "");

/**
 * Open bins.
 *
 * In `single` mode the set never holds more than one, so opening is really
 * replacing — and if several are asked for at once, the last one wins, on the
 * grounds that it is the most recent thing the caller said.
 */
export function openBins(open, ids, mode = "multi") {
  const wanted = list(ids);
  if (!wanted.length) return open;

  if (mode === "single") {
    const only = wanted[wanted.length - 1];
    return open.length === 1 && open[0] === only ? open : [only];
  }

  const added = wanted.filter((id, i) => !open.includes(id) && wanted.indexOf(id) === i);
  return added.length ? [...open, ...added] : open;
}

export function closeBins(open, ids) {
  const unwanted = new Set(list(ids));
  if (!unwanted.size) return open;

  const next = open.filter((id) => !unwanted.has(id));
  return next.length === open.length ? open : next;
}

/** shut, if it is out; out, if it is shut — and in `single` mode, alone */
export function toggleBin(open, id, mode = "multi") {
  return open.includes(id) ? closeBins(open, id) : openBins(open, id, mode);
}

/**
 * Replace the whole set. `single` mode keeps the last of what it is handed
 * rather than refusing the call: the caller asked for a state, and this is the
 * nearest state to it that the mode allows.
 */
export function setBins(open, ids, mode = "multi") {
  const wanted = [...new Set(list(ids))];
  const next = mode === "single" ? wanted.slice(-1) : wanted;

  const same = next.length === open.length && next.every((id, i) => id === open[i]);
  return same ? open : next;
}

export const closeAllBins = (open) => (open.length ? [] : open);
