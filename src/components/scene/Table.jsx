import { cuboidFaces } from "../../lib/cuboid.js";
import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";

/** The surface the cabinets stand on. Painted first: everything is above it. */
export function Table({ table, material }) {
  const faces = cuboidFaces(table.body);

  return (
    <g>
      <g stroke="none">
        <Face quad={faces.side} direction="side" material={material} />
        <Face quad={faces.top} direction="top" material={material} />
        <Face quad={faces.front} direction="front" material={material} />
      </g>

      <Edges edges={table.edges} material={material} />
    </g>
  );
}
