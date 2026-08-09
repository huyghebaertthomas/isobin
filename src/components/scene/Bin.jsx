import { useProjection } from "../../render/ProjectionContext.jsx";
import { Cavity } from "./Cavity.jsx";
import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";
import { Frost } from "./Frost.jsx";

/**
 * A bin, drawn back to front: the inside surfaces and any dividers standing in
 * them, then the shell — whose top face has the mouth knocked out of it, so the
 * interior shows through. Frosting, if any, goes on last of the fills, over the
 * walls but never over the open mouth. Outlines come after all of it, so
 * nothing paints over half a line.
 *
 * Opening slides the whole group along the pull direction; the scene clips it
 * to the cabinet mouth, so a bin can never paint outside the carcass.
 */
export function Bin({ bin, open, onToggle, materials, slide, frost }) {
  const { outline, pullOffset } = useProjection();
  const [dx, dy] = open ? pullOffset(bin.pull) : [0, 0];
  const { shell, mouth, mouthEdges, edges } = bin.shape;

  const transition = `transform ${slide.duration}ms ${slide.easing}`;

  return (
    <g
      onClick={() => onToggle(bin)}
      style={{ transform: `translate(${dx}px, ${dy}px)`, transition, cursor: "pointer" }}
    >
      <Cavity bin={bin} materials={materials} />

      <g stroke="none">
        <Face
          quad={shell.top}
          d={`${outline(shell.top)} ${outline(mouth)}`}
          direction="top"
          material={materials.bin}
        />
        <Face quad={shell.front} direction="front" material={materials.bin} />
        <Face quad={shell.side} direction="side" material={materials.bin} />
      </g>

      {frost ? (
        <Frost
          bin={bin}
          frost={frost}
          materials={materials}
          undo={{ transform: `translate(${-dx}px, ${-dy}px)`, transition }}
        />
      ) : null}

      <Edges edges={edges} material={materials.bin} />
      <Edges edges={mouthEdges} material={materials.bin} />
    </g>
  );
}
