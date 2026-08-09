import { useBin } from "../render/BinContext.jsx";
import { useProjection } from "../render/ProjectionContext.jsx";
import { BinLabel } from "./BinLabel.jsx";
import { Cavity } from "./Cavity.jsx";
import { Edges } from "./Edges.jsx";
import { Face } from "./Face.jsx";
import { Frost } from "./Frost.jsx";

/**
 * A bin, drawn back to front: the inside surfaces and any dividers standing in
 * them, then the shell — whose top face has the mouth knocked out of it, so the
 * interior shows through. Frosting, if any, goes on last of the fills, over the
 * walls but never over the open mouth. Outlines come after all of it, so
 * nothing paints over half a line. Lettering goes on last of all.
 *
 * Opening slides the whole group along the pull direction; the scene clips it
 * to the cabinet mouth, so a bin can never paint outside the carcass.
 *
 * Which of these a bin is — highlighted, lettered, clickable, focusable — comes
 * out of `useBin` rather than down the prop chain, because none of it is any
 * business of the cabinet it happens to sit in.
 */
export function Bin({ bin, open, materials, slide, frost }) {
  const { outline, pullOffset } = useProjection();
  const { materialFor, labelFor, labelStyle, handlers } = useBin();

  const [dx, dy] = open ? pullOffset(bin.pull) : [0, 0];
  const { shell, mouth, mouthEdges, edges } = bin.shape;

  const highlight = materialFor(bin.id);
  const skin = highlight ?? materials.bin;
  const label = labelFor(bin.id);

  const { onToggle, onEnter, onLeave, onKeyDown, focusable } = handlers;
  const transition = `transform ${slide.duration}ms ${slide.easing}`;

  return (
    <g
      /* how the arrow keys find the bin they are moving to. A data attribute
         rather than an id, because ids would have to be unique across the whole
         document and this only has to be unique within its own drawing — which
         a bin id already is. */
      data-bin-id={bin.id}
      onClick={onToggle ? () => onToggle(bin) : undefined}
      onPointerEnter={onEnter ? () => onEnter(bin) : undefined}
      onPointerLeave={onLeave ? () => onLeave(bin) : undefined}
      onKeyDown={onKeyDown ? (event) => onKeyDown(event, bin) : undefined}
      tabIndex={focusable ? 0 : undefined}
      role={focusable ? "button" : undefined}
      aria-label={focusable ? bin.label : undefined}
      aria-pressed={focusable ? open : undefined}
      className={highlight?.pulse ? "isobin-pulse" : undefined}
      style={{
        transform: `translate(${dx}px, ${dy}px)`,
        transition,
        cursor: onToggle ? "pointer" : undefined,
        outline: "none",
      }}
    >
      <Cavity bin={bin} materials={materials} />

      <g stroke="none">
        <Face
          quad={shell.top}
          d={`${outline(shell.top)} ${outline(mouth)}`}
          direction="top"
          material={skin}
        />
        <Face quad={shell.front} direction="front" material={skin} />
        <Face quad={shell.side} direction="side" material={skin} />
      </g>

      {frost ? (
        <Frost
          bin={bin}
          frost={frost}
          materials={materials}
          undo={{ transform: `translate(${-dx}px, ${-dy}px)`, transition }}
        />
      ) : null}

      <Edges edges={edges} material={skin} />
      <Edges edges={mouthEdges} material={skin} />

      {label && labelStyle ? <BinLabel bin={bin} text={label} label={labelStyle} /> : null}
    </g>
  );
}
