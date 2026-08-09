import { forwardRef, useCallback, useImperativeHandle, useMemo } from "react";
import { resolveConfig } from "./config/index.js";
import { useOpenBins } from "./hooks/useOpenBins.js";
import { neighbour } from "./lib/navigate.js";
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
 *   wall.current.open("R-100");     // and .close, .toggle, .set, .closeAll
 *   wall.current.isOpen("R-100");   // true, immediately
 *   wall.current.bin("R-100");      // where it is, and its box on screen
 *
 * `mode` decides what opening one does to the others: `"multi"` leaves them
 * alone, `"single"` shuts them. Nothing opens or closes on its own — a bin
 * moves when it is clicked, or when you say so.
 *
 * State can be held here or by you. Left alone it is held here, seeded by
 * `defaultOpen`. Pass `open` and you own it: the handle and the clicks then
 * report through `onChange` instead of changing anything themselves.
 *
 * ## Saying something about a bin
 *
 *   <Isobin
 *     highlight={{ "R-100": "found", "R-231": "#f59e0b" }}
 *     labels={{ "R-100": "10k", "R-231": "4µ7" }}
 *   />
 *
 * `highlight` names a style from `appearance.highlights` or gives a colour of
 * its own; `labels` letters the bin's face. Both are keyed by bin id, so both
 * come straight from your own data.
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
    highlight,
    labels,
    onChange,
    onToggle,
    onBinEnter,
    onBinLeave,
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

  /**
   * The highlights, resolved once per distinct look rather than once per bin
   * wearing it — flag half a wall as low on stock and it still costs one
   * material, because they all point at the same one.
   */
  const highlights = useMemo(() => {
    if (!highlight) return null;

    const wanted = Array.isArray(highlight)
      ? Object.fromEntries(highlight.map((id) => [id, "found"]))
      : highlight;

    const made = new Map();
    const resolve = (spec) => {
      const key = typeof spec === "string" ? spec : JSON.stringify(spec);
      if (!made.has(key)) {
        made.set(key, materials.highlights[spec] ?? materials.highlight(spec));
      }
      return made.get(key);
    };

    return new Map(Object.entries(wanted).map(([id, spec]) => [id, resolve(spec)]));
  }, [highlight, materials]);

  const bin = useMemo(() => {
    const info = (raw) => api.bin(raw.id) ?? raw;

    /** Enter and Space work it; the arrows walk the wall */
    const onKeyDown = (event, raw) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        api.toggle(raw.id);
        onToggle?.(info(raw));
        return;
      }

      const next = neighbour(scene, raw.id, event.key);
      if (!next) return;

      event.preventDefault();
      // Focus is moved rather than tracked: the bins are real elements, so the
      // document already knows which one has it. The search is scoped to this
      // drawing's own <svg>, so two drawings on a page never reach into each
      // other however their bins are named.
      event.currentTarget.closest("svg")?.querySelector(`[data-bin-id="${escape(next)}"]`)?.focus();
    };

    return {
      materialFor: (id) => highlights?.get(id) ?? null,
      labelFor: (id) => labels?.[id] ?? null,
      labelStyle: materials.label,
      handlers: {
        onToggle: interactive
          ? (raw) => {
              api.toggle(raw.id);
              onToggle?.(info(raw));
            }
          : null,
        // hover is reported whether or not the drawing can be clicked: a
        // read-only wall still wants a tooltip
        onEnter: onBinEnter ? (raw) => onBinEnter(info(raw)) : null,
        onLeave: onBinLeave ? (raw) => onBinLeave(info(raw)) : null,
        onKeyDown: interactive ? onKeyDown : null,
        focusable: interactive,
      },
    };
  }, [api, scene, highlights, labels, materials, interactive, onToggle, onBinEnter, onBinLeave]);

  return (
    <SceneView
      scene={scene}
      materials={materials}
      slide={settings.motion.slide}
      isOpen={isOpen}
      bin={bin}
      label={label ?? describe(scene)}
      role={interactive ? "group" : "img"}
      idPrefix={idPrefix}
      className={className}
      style={style}
      {...rest}
    />
  );
});

/** ids come from the caller's data, so they cannot be trusted in a selector */
const escape = (id) =>
  typeof CSS !== "undefined" && CSS.escape
    ? CSS.escape(id)
    : String(id).replace(/["\\]/g, "\\$&");

const describe = (scene) =>
  `Isometric drawing of ${scene.organizers.length} storage ${
    scene.organizers.length === 1 ? "cabinet" : "cabinets"
  }, ${scene.bins.length} bins`;
