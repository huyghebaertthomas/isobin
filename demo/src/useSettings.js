import { useCallback, useState } from "react";
import { diff, getAt, restyle, setAt } from "isobin/core";

/**
 * The live config the panel edits.
 *
 * Everything on screen — dimensions, camera, timings, materials — lives in one
 * object shaped like an isobin config, addressed by path. Writes clone only the
 * branch they touch, so changing a colour leaves the layout identical by
 * reference and nothing downstream rebuilds that did not have to.
 *
 * The object goes straight to `<Isobin config={…}>`; the branches the package
 * does not know about ride along and are ignored.
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

  /** the smallest override object that reproduces the current settings */
  const patch = useCallback(() => diff(defaults, settings) ?? {}, [defaults, settings]);

  return { settings, set, restore, apply, reset, patch };
}
