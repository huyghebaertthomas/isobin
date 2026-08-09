import { useCallback, useMemo } from "react";
import { resolveConfig } from "./config/index.js";
import { useAmbientMotion } from "./hooks/useAmbientMotion.js";
import { useOpenBins } from "./hooks/useOpenBins.js";
import { buildScene } from "./models/scene.js";
import { resolveMaterials } from "./render/materials.js";
import { SceneView } from "./scene/SceneView.jsx";

/**
 * An isometric cabinet wall, drawn as one `<svg>`.
 *
 * Everything about it — how many cabinets, what rows are in them, the hardware
 * they are built from, the camera, the timings and the paint — comes out of one
 * `config` object folded over the defaults. Nothing is styled from outside: the
 * element has no size of its own and fills whatever box you put it in.
 *
 *   <Isobin config={{ style: "blueprint" }} />
 *
 * Keep `config` stable across renders — module scope, or `useMemo`. A fresh
 * object literal every render rebuilds every bin every render.
 *
 * Which bins are out can be left to the component or taken over:
 *
 *   uncontrolled   `defaultOpen`, plus the idle animation if config allows it
 *   controlled     pass `open`, and the component only ever asks via `onToggle`
 *
 * The idle animation stands down while you are controlling `open`, rather than
 * fighting you for it.
 *
 * @param {import("./types.js").IsobinProps} props
 */
export function Isobin({
  config,
  open,
  defaultOpen,
  onToggle,
  interactive = true,
  idPrefix,
  label,
  className,
  style,
  ...rest
}) {
  const settings = useMemo(() => resolveConfig(config), [config]);

  // the scene depends on these four branches and nothing else, and a merge
  // leaves the branches it did not touch identical — so recolouring a surface
  // does not rebuild ninety-six bins
  const { layout, hardware, binTypes, view } = settings;
  const scene = useMemo(
    () => buildScene({ layout, hardware, binTypes, view }),
    [layout, hardware, binTypes, view]
  );

  const materials = useMemo(() => resolveMaterials(settings.appearance), [settings.appearance]);

  const controlled = open !== undefined;
  const bins = useOpenBins(defaultOpen);

  // a controlled scene reads its open set from the prop and holds none of its own
  const openIds = useMemo(() => new Set(controlled ? open : null), [controlled, open]);
  const isOpen = useCallback(
    (id) => (controlled ? openIds.has(id) : bins.isOpen(id)),
    [controlled, openIds, bins]
  );

  // ambient motion drives the internal set, so it has nothing to drive when the
  // caller owns it
  useAmbientMotion(scene.bins, bins, controlled ? OFF : settings.motion.ambient);

  const toggle = useCallback(
    (bin) => {
      if (!controlled) bins.toggleBin(bin.id);
      onToggle?.(bin);
    },
    [controlled, bins, onToggle]
  );

  return (
    <SceneView
      scene={scene}
      materials={materials}
      slide={settings.motion.slide}
      isOpen={isOpen}
      onToggle={interactive ? toggle : null}
      label={label ?? describe(scene)}
      idPrefix={idPrefix}
      className={className}
      style={style}
      {...rest}
    />
  );
}

const OFF = { enabled: false };

const describe = (scene) =>
  `Isometric drawing of ${scene.organizers.length} storage ${
    scene.organizers.length === 1 ? "cabinet" : "cabinets"
  }, ${scene.bins.length} bins`;
