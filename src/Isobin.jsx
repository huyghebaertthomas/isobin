import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { resolveConfig } from "./config/index.js";
import { useOpenBins } from "./hooks/useOpenBins.js";
import { buildScene } from "./models/scene.js";
import { resolveMaterials } from "./render/materials.js";
import { SceneView } from "./scene/SceneView.jsx";

/**
 * An isometric drawing of a storage system, as one `<svg>`.
 *
 * What is drawn — how many cabinets, what rows are in them, the hardware they
 * are built from, the camera and the paint — comes out of one `config` object
 * folded over the defaults. The element has no size of its own and fills
 * whatever box you put it in.
 *
 *   <Isobin config={{ style: "blueprint" }} />
 *
 * Keep `config` stable across renders — module scope, or `useMemo`. A fresh
 * object literal every render rebuilds every bin every render.
 *
 * ## Driving it
 *
 * Bins are addressed by id, and a ref is how you reach them:
 *
 *   const wall = useRef(null);
 *   <Isobin ref={wall} config={config} mode="single" />
 *
 *   wall.current.open("A-2-3");     // and .close, .toggle, .set, .closeAll
 *   wall.current.isOpen("A-2-3");   // true, immediately
 *   wall.current.bin("A-2-3");      // where it is, and its box on screen
 *
 * `mode` decides what opening one does to the others: `"multi"` leaves them
 * alone, `"single"` shuts them. Nothing opens or closes on its own — a bin
 * moves when it is clicked, or when you say so.
 *
 * State can be held here or by you. Left alone it is held here, seeded by
 * `defaultOpen`. Pass `open` and you own it: the handle and the clicks then
 * report through `onChange` instead of changing anything themselves, which is
 * the same set they would have moved to.
 *
 * @param {import("./types.js").IsobinProps} props
 * @param {import("react").Ref<import("./types.js").IsobinHandle>} ref
 */
export const Isobin = forwardRef(function Isobin(
  {
    config,
    open,
    defaultOpen,
    mode = "multi",
    onChange,
    onToggle,
    interactive = true,
    idPrefix,
    label,
    className,
    style,
    ...rest
  },
  ref
) {
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

  const { open: current, api } = useOpenBins({
    open,
    defaultOpen,
    mode,
    onChange,
    bins: scene.binsById,
  });

  useImperativeHandle(ref, () => api, [api]);

  const isOpen = useMemo(() => {
    const out = new Set(current);
    return (id) => out.has(id);
  }, [current]);

  const toggle = useCallback(
    (bin) => {
      api.toggle(bin.id);
      onToggle?.(bin);
    },
    [api, onToggle]
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
});

const describe = (scene) =>
  `Isometric drawing of ${scene.organizers.length} storage ${
    scene.organizers.length === 1 ? "cabinet" : "cabinets"
  }, ${scene.bins.length} bins`;
