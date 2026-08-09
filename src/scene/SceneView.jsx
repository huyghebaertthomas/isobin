import { useMemo } from "react";
import { BinProvider } from "../render/BinContext.jsx";
import { ProjectionProvider } from "../render/ProjectionContext.jsx";
import { SceneIdProvider, useSceneName } from "../render/SceneIds.jsx";
import { materialFor } from "../render/materials.js";
import { Organizer } from "./Organizer.jsx";
import { Table } from "./Table.jsx";

/** every surface a scene component asks for, by key */
const SURFACES = ["table", "cabinet", "shelf", "bin", "binInterior", "divider"];

/**
 * The drawing surface: one `<svg>` and nothing around it.
 *
 * The viewBox comes from the built scene, so the framing follows the layout
 * instead of being tuned by hand, and the element carries no width or height of
 * its own — it fills whatever box the caller puts it in.
 *
 * This is the drawing half of `<Isobin>`, separated from it because it holds no
 * state at all. Given a built scene and resolved materials it renders the same
 * markup every time, on a server as readily as in a browser.
 */
export function SceneView({
  scene,
  materials,
  slide,
  isOpen,
  bin,
  label,
  /**
   * `img` for a drawing, `group` for one that can be worked.
   *
   * It matters more than it looks: `role="img"` tells a screen reader the whole
   * element is one picture, and everything inside it stops being announced. Get
   * this wrong on an interactive wall and the focusable bins are reachable by
   * tab and silent when they arrive.
   */
  role = "img",
  idPrefix,
  className,
  style,
  ...rest
}) {
  const uid = useSceneName(idPrefix);

  const surfaces = useMemo(
    () => Object.fromEntries(SURFACES.map((key) => [key, materialFor(materials, key)])),
    [materials]
  );

  const { blur, opacity } = materials.glass;

  return (
    <ProjectionProvider projection={scene.projection}>
      <SceneIdProvider id={uid}>
        <BinProvider value={bin ?? undefined}>
          <svg
            viewBox={scene.bounds.viewBox}
            className={className ? `${uid} ${className}` : uid}
            style={{ background: materials.background, ...style }}
            role={role}
            aria-label={label}
            {...rest}
          >
            {/* `vector-effect` is not inherited, so it has to reach the shapes
                themselves; a rule over this scene's descendants is the one way
                to say it once. The pulse is here for the same reason: one rule
                beats an inline animation on every flagged bin, and it honours
                a reduced-motion setting where an inline one could not. */}
            <style>{`
              ${materials.hairline ? `.${uid} * { vector-effect: non-scaling-stroke; }` : ""}
              .${uid} .isobin-pulse { animation: isobin-pulse 1.4s ease-in-out infinite; }
              @keyframes isobin-pulse { 50% { opacity: .45 } }
              @media (prefers-reduced-motion: reduce) {
                .${uid} .isobin-pulse { animation: none }
              }
            `}</style>

            {scene.table ? <Table table={scene.table} material={surfaces.table} /> : null}

            {scene.order.map((organizer) => (
              <Organizer
                key={organizer.id}
                organizer={organizer}
                ids={{
                  mouth: `mouth-${uid}-${organizer.id}`,
                  band: `band-${uid}-${organizer.id}`,
                  backdropBand: `backband-${uid}-${organizer.id}`,
                }}
                materials={surfaces}
                slide={slide}
                isOpen={isOpen}
                frost={
                  blur > 0 && opacity > 0
                    ? { uid, blur, opacity, backdropId: `back-${uid}-${organizer.id}` }
                    : null
                }
              />
            ))}
          </svg>
        </BinProvider>
      </SceneIdProvider>
    </ProjectionProvider>
  );
}
