import { useCallback, useMemo, useState } from "react";
import { resolveConfig } from "../config/index.js";
import { activeStyle, styleBranches, stylePreview } from "../lib/styles.js";
import { buildScene } from "../models/scene.js";
import { useAmbientMotion } from "../hooks/useAmbientMotion.js";
import { useOpenBins } from "../hooks/useOpenBins.js";
import { useSettings } from "../hooks/useSettings.js";
import { ControlPanel } from "./controls/ControlPanel.jsx";
import { SceneView } from "./scene/SceneView.jsx";

/**
 * The digital twin.
 *
 * Pass `config` to override any part of the defaults — hardware dimensions,
 * bin types, the cabinets and their rows, the camera, timings, materials or
 * copy. Keep that object stable across renders (module scope, or memoised);
 * a fresh object every render rebuilds the scene every render.
 *
 * Those defaults are only the starting point: the panel edits the same config
 * live, and `Copy config` hands the changes back as an override object.
 */
export function BinWall({ config: overrides }) {
  const defaults = useMemo(() => resolveConfig(overrides), [overrides]);
  const { settings, materials, set, restore, apply, reset, patch } = useSettings(defaults);

  // the scene depends on these four branches and nothing else, and an edit
  // leaves the branches it did not touch identical — so recolouring a surface
  // does not rebuild ninety-six bins
  const { layout, hardware, binTypes, view } = settings;
  const scene = useMemo(
    () => buildScene({ layout, hardware, binTypes, view }),
    [layout, hardware, binTypes, view]
  );

  const bins = useOpenBins();
  useAmbientMotion(scene.bins, bins, settings.motion.ambient);

  const toggle = useCallback((bin) => bins.toggleBin(bin.id), [bins]);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(patch(), null, 2));
      return true;
    } catch {
      return false; // no clipboard permission; the button just doesn't confirm
    }
  }, [patch]);

  // the swatches, and which of them the settings currently answer to
  const styles = useMemo(() => {
    const list = settings.styles;
    const branches = styleBranches(list);

    return {
      styles: list,
      previews: Object.fromEntries(list.map((s) => [s.key, stylePreview(s, defaults)])),
      onPick: (style) => apply(branches, style.patch),
    };
  }, [settings.styles, defaults, apply]);

  const active = useMemo(
    () => activeStyle(settings.styles, defaults, settings)?.key ?? null,
    [settings, defaults]
  );

  const [panelOpen, setPanelOpen] = useState(true);

  const counts = { binCount: scene.bins.length, organizerCount: scene.organizers.length };
  const { ui } = settings;

  return (
    <div className="min-h-screen w-full bg-white text-neutral-900 flex items-stretch">
      <main className="flex-1 min-w-0 flex flex-col items-center p-6 gap-5">
        <div className="w-full max-w-5xl flex items-baseline justify-between gap-4">
          <h1 className="text-lg font-medium tracking-tight">{ui.title}</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">
            {ui.caption(counts)}
          </p>
          {panelOpen ? null : (
            <button
              onClick={() => setPanelOpen(true)}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              {ui.panel.open}
            </button>
          )}
        </div>

        <SceneView
          scene={scene}
          materials={materials}
          slide={settings.motion.slide}
          isOpen={bins.isOpen}
          onToggle={toggle}
          label={ui.sceneLabel(counts)}
          className="w-full max-w-5xl select-none rounded-lg"
        />
      </main>

      {panelOpen ? (
        <aside className="w-84 shrink-0 h-screen sticky top-0 overflow-y-auto border-l border-neutral-200 bg-white">
          <ControlPanel
            settings={settings}
            sections={settings.controls}
            styles={{ ...styles, active }}
            onChange={set}
            onRestore={restore}
            onReset={reset}
            onCopy={copy}
            onClose={() => setPanelOpen(false)}
            labels={ui.panel}
          />
        </aside>
      ) : null}
    </div>
  );
}

export default BinWall;
