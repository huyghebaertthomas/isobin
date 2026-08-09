import { cuboidEdges, cuboidFaces } from "../lib/cuboid.js";
import { useProjection } from "../render/ProjectionContext.jsx";
import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";

/**
 * One continuous carcass: back panel, a single picture-frame face with the
 * opening knocked out, the top panel and the side panel. No overlapping bands,
 * so the outer edge is one unbroken outline at every corner.
 *
 * The mouth is outlined here as well, and it takes some care. A stroke straddles
 * its own path, so half of this one falls inside the opening, where a shelf or a
 * bin spanning the interior exactly then paints over it — which left the frame's
 * inner edge looking broken and thin. So it is drawn at twice the width and
 * clipped to the frame itself: the half that would have been painted over is
 * never drawn, and the half that survives is the full width asked for. Being
 * part of the carcass it goes down before anything inside the cabinet, so a bin
 * sliding out still passes in front of it.
 */
export function Carcass({ organizer, bandId, material }) {
  const { points, outline } = useProjection();
  const faces = cuboidFaces(organizer.body);
  const mouth = organizer.opening;
  const frame = `${outline(faces.front)} ${outline(mouth)}`;

  return (
    <g>
      <defs>
        <clipPath id={bandId}>
          <path d={frame} clipRule="evenodd" />
        </clipPath>
      </defs>

      <g stroke="none">
        {/* the back panel, backing the whole opening — the inner right wall is
            laid over it inside the mouth clip, the floor by the deck */}
        <Face quad={mouth} direction="front" material={material} />
        <Face quad={faces.front} d={frame} direction="front" material={material} />
        <Face quad={faces.side} direction="side" material={material} />
        <Face quad={faces.top} direction="top" material={material} />
      </g>

      <Edges edges={cuboidEdges(organizer.body)} material={material} />

      <g fill="none" clipPath={`url(#${bandId})`} {...material.line} strokeWidth={material.width * 2}>
        <polyline points={points([...mouth, mouth[0]])} />
      </g>
    </g>
  );
}
