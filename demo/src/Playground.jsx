import { useCallback, useMemo, useState } from "react";
import {
  Isobin,
  activeStyle,
  buildScene,
  defaultConfig,
  styleBranches,
  stylePreview,
  styles as presets,
} from "isobin";
import { useSettings } from "./useSettings.js";
import { controls } from "./config/controls.js";
import { ui } from "./config/ui.js";
import { ControlPanel } from "./controls/ControlPanel.jsx";

/**
 * The page: a drawing with a panel that edits it.
 *
 * The whole of the panel's state is one config object, the same one `<Isobin>`
 * takes, so `Copy config` really is the code that reproduces what is on screen.
 * The demo owns three branches the package does not — `controls` describes the
 * widgets, `ui` holds the copy, `styles` is the swatch list — and they ride
 * along in the same object because the panel edits by path and does not care
 * which of them a path lands in.
 */
const defaults = { ...defaultConfig, controls, ui, styles: presets };

export function Playground() {
  const { settings, set, restore, apply, reset, patch } = useSettings(defaults);
  const [panelOpen, setPanelOpen] = useState(true);

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
  }, [settings.styles, apply]);

  const active = useMemo(() => activeStyle(settings.styles, defaults, settings)?.key ?? null, [settings]);

  /**
   * The caption counts what is actually there, so it asks the model rather than
   * counting rows itself and drifting from it. `<Isobin>` builds the same scene
   * inside, but only these four branches decide it and a merge leaves the ones
   * an edit did not touch identical — so this runs again when the layout
   * changes and not when a colour does.
   */
  const { layout, hardware, binTypes, view } = settings;
  const counts = useMemo(() => {
    const scene = buildScene({ layout, hardware, binTypes, view });
    return { binCount: scene.bins.length, organizerCount: scene.organizers.length };
  }, [layout, hardware, binTypes, view]);

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

        <Isobin config={settings} className="w-full max-w-5xl select-none rounded-lg" />
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
