import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";

/** A compartment divider — a box, or a bare plane once its thickness is zero. */
export function Divider({ divider, material }) {
  const { faces, plane } = divider;

  return (
    <g>
      <g stroke="none">
        {plane ? (
          <Face quad={plane} direction={divider.face} material={material} />
        ) : (
          <>
            <Face quad={faces.side} direction="side" material={material} />
            <Face quad={faces.front} direction="front" material={material} />
            <Face quad={faces.top} direction="top" material={material} />
          </>
        )}
      </g>

      <Edges edges={divider.edges} material={material} />
    </g>
  );
}
