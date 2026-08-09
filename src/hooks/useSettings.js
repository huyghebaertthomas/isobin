import { useCallback, useMemo, useState } from "react";
import { diff } from "../lib/merge.js";
import { getAt, setAt } from "../lib/path.js";
import { restyle } from "../lib/styles.js";
import { resolveMaterials } from "../render/materials.js";

/**
 * The live config, and the render-ready materials derived from it.
 *
 * Everything the panel edits — dimensions, camera, timings, materials — lives
 * in one object with the same shape as `config/`, addressed by path. Writes
 * clone only the branch they touch, so changing a colour leaves the layout and
 * the motion settings identical by reference and nothing downstream rebuilds
 * that did not have to.
 */
export function useSettings(defaults) {
  const [settings, setSettings] = useState(defaults);

  const set = useCallback((path, value) => {
    setSettings((prev) => setAt(prev, path, value));
  }, []);

  /** put the named branches back the way config had them */
  const restore = useCallback(
    (paths) =>
      setSettings((prev) =>
        paths.reduce((next, path) => setAt(next, path, getAt(defaults, path)), prev)
      ),
    [defaults]
  );

  /**
   * Swap whole branches at once: the named ones go back to config, then the
   * patch is folded in. That is what picking a style does — clearing first is
   * what stops the last one's colours from showing through the next one's gaps.
   */
  const apply = useCallback(
    (branches, patch) => setSettings((prev) => restyle(prev, defaults, branches, patch)),
    [defaults]
  );

  const reset = useCallback(() => setSettings(defaults), [defaults]);

  const materials = useMemo(() => resolveMaterials(settings.appearance), [settings.appearance]);

  /** the smallest override object that reproduces the current settings */
  const patch = useCallback(() => diff(defaults, settings) ?? {}, [defaults, settings]);

  return { settings, materials, set, restore, apply, reset, patch };
}
