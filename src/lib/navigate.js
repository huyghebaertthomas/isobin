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

  const place = rows[here].binIds.indexOf(id);
  if (key in STEPS) return sideways(cabinets, at, rows, here, place, STEPS[key]);
  if (key in ROWS) return vertically(scene, rows, here, id, ROWS[key]);
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

/**
 * Up or down, keeping your place across the width of the row.
 *
 * Measured in slots rather than in bins, so a wide bin is aimed at over its
 * whole width and a gap is empty space you can pass over rather than a bin that
 * quietly counts. Landing picks whichever bin covers the same fraction of the
 * target row, or the nearest one to it when that fraction falls into a hole.
 */
function vertically(scene, rows, here, id, step) {
  const target = rows[here + step];
  if (!target) return null;

  const across = centre(scene, id);
  const bins = target.binIds.map((binId) => ({ id: binId, at: centre(scene, binId) }));

  let best = bins[0];
  for (const candidate of bins) {
    if (Math.abs(candidate.at - across) < Math.abs(best.at - across)) best = candidate;
  }
  return best?.id ?? null;
}

/** where a bin sits across its row, 0 to 1, by the middle of the space it takes */
function centre(scene, id) {
  const bin = scene.binsById.get(id);
  const row = scene.organizers
    .find((cabinet) => cabinet.id === bin.organizerId)
    ?.rows.find((r) => r.index === bin.row);

  if (!bin.slot || !row?.span) return (bin.index + 0.5) / (row?.binIds.length ?? 1);
  return (bin.slot.at + bin.slot.span / 2) / row.span;
}
