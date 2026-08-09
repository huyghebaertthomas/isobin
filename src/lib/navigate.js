/**
 * Where the arrow keys go.
 *
 * A wall is a grid only within a cabinet: rows can hold different numbers of
 * bins, and cabinets stand side by side with no rows in common. So moving is
 * done by position rather than by index — left and right walk the row, up and
 * down look for whatever sits nearest in the row above or below, and running
 * off the end of a row carries on into the next cabinet.
 *
 * "Nearest" is measured across the row as a fraction of its width, so a step
 * from a row of five into a row of two lands where it looks like it should
 * rather than at bin 0.
 */

const ROWS = { ArrowUp: -1, ArrowDown: 1 };
const STEPS = { ArrowLeft: -1, ArrowRight: 1 };

export function neighbour(scene, id, key) {
  const from = scene.binsById.get(id);
  if (!from) return null;

  const cabinets = scene.organizers;
  const at = cabinets.findIndex((cabinet) => cabinet.id === from.organizerId);
  const cabinet = cabinets[at];
  if (!cabinet) return null;

  const rows = cabinet.rows.filter((row) => row.binIds.length);
  const here = rows.findIndex((row) => row.index === from.row);
  if (here < 0) return null;

  if (key in STEPS) return sideways(cabinets, at, rows, here, from.index, STEPS[key]);
  if (key in ROWS) return vertically(rows, here, from.index, ROWS[key]);
  if (key === "Home") return rows[here].binIds[0];
  if (key === "End") return rows[here].binIds.at(-1);
  return null;
}

/** along the row, and off the end into the cabinet next door */
function sideways(cabinets, at, rows, here, index, step) {
  const row = rows[here];
  const next = index + step;
  if (next >= 0 && next < row.binIds.length) return row.binIds[next];

  const over = cabinets[at + step];
  if (!over) return null;

  // land on the same row of the neighbour if it has one, else its nearest
  const theirs = over.rows.filter((r) => r.binIds.length);
  if (!theirs.length) return null;

  const landing = theirs[Math.min(here, theirs.length - 1)].binIds;
  return step > 0 ? landing[0] : landing.at(-1);
}

/** up or down, keeping your place across the width of the row */
function vertically(rows, here, index, step) {
  const target = rows[here + step];
  if (!target) return null;

  const across = (index + 0.5) / rows[here].binIds.length;
  const landing = Math.floor(across * target.binIds.length);
  return target.binIds[Math.min(landing, target.binIds.length - 1)];
}
