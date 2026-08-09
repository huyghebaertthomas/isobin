import { useId, useMemo } from "react";
import { ProjectionProvider } from "../../render/ProjectionContext.jsx";
import { materialFor } from "../../render/materials.js";
import { Organizer } from "./Organizer.jsx";
import { Table } from "./Table.jsx";

/** every surface a scene component asks for, by key */
const SURFACES = ["table", "cabinet", "shelf", "bin", "binInterior", "divider"];

/**
 * The drawing surface. The viewBox comes from the built scene, so the framing
 * follows the layout instead of being tuned by hand.
 */
export function SceneView({ scene, materials, slide, isOpen, onToggle, label, className }) {
  // ids must be unique per mounted scene, or two scenes would share clip paths.
  // It also ends up as a CSS class, so it is reduced to a plain identifier.
  const uid = `scene${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const surfaces = useMemo(
    () => Object.fromEntries(SURFACES.map((key) => [key, materialFor(materials, key)])),
    [materials]
  );

  const { blur, opacity } = materials.glass;

  return (
    <ProjectionProvider projection={scene.projection}>
      <svg
        viewBox={scene.bounds.viewBox}
        className={`${uid} ${className ?? ""}`}
        style={{ background: materials.background }}
        role="img"
        aria-label={label}
      >
        {/* `vector-effect` is not inherited, so it has to reach the shapes
            themselves; a rule over this scene's descendants is the one way to
            say it once. */}
        {materials.hairline ? (
          <style>{`.${uid} * { vector-effect: non-scaling-stroke; }`}</style>
        ) : null}

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
            onToggle={onToggle}
            frost={
              blur > 0 && opacity > 0
                ? { uid, blur, opacity, backdropId: `back-${uid}-${organizer.id}` }
                : null
            }
          />
        ))}
      </svg>
    </ProjectionProvider>
  );
}
