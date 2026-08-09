import { boundsOf } from "../lib/bounds.js";
import { box, boxCorners, cuboidEdges } from "../lib/cuboid.js";
import { convexHull } from "../lib/hull.js";
import { cabinetOrder } from "../lib/ordering.js";
import { createProjection } from "../lib/projection.js";
import { buildOrganizer } from "./organizer.js";

/**
 * Build the whole scene from config.
 *
 * Cabinets are laid out left to right from `layout.origin`, each one `gap`
 * clear of the last, so adding or resizing a cabinet shifts its neighbours
 * instead of needing new coordinates. The viewBox is measured from the result.
 */
export function buildScene(config) {
  const { layout, hardware, binTypes, view } = config;
  const projection = createProjection(view);

  let x = layout.origin;
  const organizers = layout.organizers.map((def) => {
    const organizer = buildOrganizer(def, {
      x,
      baseline: layout.baseline ?? 0,
      hardware,
      binTypes,
      innerWidth: layout.innerWidth,
      projection,
    });
    x += organizer.body.w + layout.gap;
    return { ...organizer, clip: mouthClip(organizer, projection) };
  });

  const bins = organizers.flatMap((organizer) => organizer.bins);
  const table = buildTable(layout.table, organizers);

  return {
    projection,
    organizers,
    bins,
    table,
    binsById: new Map(bins.map((bin) => [bin.id, bin])),
    /** farthest cabinet first */
    order: [...organizers].sort(cabinetOrder),
    bounds: sceneBounds(organizers, table, projection, view.padding),
  };
}

/**
 * The surface the cabinets stand on. It is measured from them rather than
 * authored, so it follows however many there are and however big they get.
 */
function buildTable(spec, organizers) {
  if (!spec?.enabled || !organizers.length) return null;

  const bodies = organizers.map((organizer) => organizer.body);
  const reach = (pick) => bodies.map(pick);
  const { overhang, thickness } = spec;

  const left = Math.min(...reach((b) => b.x)) - overhang;
  const right = Math.max(...reach((b) => b.x + b.w)) + overhang;
  const front = Math.min(...reach((b) => b.z)) - overhang;
  const back = Math.max(...reach((b) => b.z + b.d)) + overhang;
  const top = Math.min(...reach((b) => b.y));

  const body = box(left, top - thickness, front, right - left, thickness, back - front);
  return { body, edges: cuboidEdges(body) };
}

/**
 * The mouth, plus the volume it sweeps as bins slide out of it. Clipping the
 * interior to this hull means nothing can ever paint outside the cabinet.
 */
function mouthClip(organizer, projection) {
  const mouth = organizer.opening.map((p) => projection.project(...p));
  const [dx, dy] = projection.pullOffset(organizer.maxPull);
  return convexHull([...mouth, ...mouth.map(([px, py]) => [px + dx, py + dy])]);
}

/** Screen bounds of the table, every carcass, and every place a bin can slide to. */
function sceneBounds(organizers, table, projection, padding) {
  const points = organizers.flatMap((organizer) => [
    ...boxCorners(organizer.body).map((corner) => projection.project(...corner)),
    ...organizer.clip,
  ]);

  if (table) points.push(...boxCorners(table.body).map((corner) => projection.project(...corner)));

  return boundsOf(points, padding);
}
