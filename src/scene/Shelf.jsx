import { cuboidFaces } from "../lib/cuboid.js";
import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";

/**
 * A shelf board — its top surface outlined in full, since that is what the
 * bins stand on, plus the front lip. Its two ends are not drawn: a shelf runs
 * wall to wall, so they are buried in the cabinet's inner walls.
 */
export function Shelf({ shelf, material }) {
  const faces = cuboidFaces(shelf.box);

  return (
    <g>
      <g stroke="none">
        <Face quad={faces.side} direction="side" material={material} />
        <Face quad={faces.top} direction="top" material={material} />
        <Face quad={faces.front} direction="front" material={material} />
      </g>

      <Edges edges={shelf.edges} material={material} />
    </g>
  );
}
