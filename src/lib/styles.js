import { deepMerge, diff } from "./merge.js";
import { getAt, setAt } from "./path.js";

/**
 * Applying and recognising styles.
 *
 * A style is a config override, so both jobs here are jobs about overrides:
 * folding one in over settings somebody has been editing, and saying which one
 * — if any — the settings currently answer to.
 *
 * `resolveConfig({ style })` is the easy road and covers most uses. This is the
 * harder one, for an editor: settings that are already the user's, that have to
 * take a new style without keeping shreds of the last.
 */

/**
 * The branches the styles own between them. Switching style puts all of these
 * back to config first, so no part of the style being left survives into the
 * one being picked — and a style that names none of a branch is choosing the
 * default for it rather than keeping whatever was there.
 */
export const styleBranches = (styles) => [
  ...new Set(styles.flatMap((style) => Object.keys(style.patch))),
];

/**
 * Picking a style: the owned branches go back to config, then the patch is
 * folded in. Clearing first is the whole point — without it the last style's
 * colours show through wherever the next one is silent, and a few switches in
 * you are looking at a mixture of everything you have tried.
 *
 *   restyle(settings, defaults, styleBranches(styles), style.patch)
 */
export function restyle(settings, defaults, branches, patch) {
  const cleared = branches.reduce((next, key) => setAt(next, key, getAt(defaults, key)), settings);
  return deepMerge(cleared, patch);
}

/**
 * Which style the settings are currently showing, if any — compared over the
 * owned branches only, so a style stays recognised however the camera or the
 * layout has been moved since. Edit one of its colours and nothing matches,
 * which is the honest answer: it is no longer that style.
 */
export function activeStyle(styles, defaults, settings) {
  const branches = styleBranches(styles);

  return (
    styles.find((style) => {
      const wanted = deepMerge(defaults, style.patch);
      return branches.every((key) => diff(wanted[key], settings[key]) === undefined);
    }) ?? null
  );
}

/**
 * A whole look boiled down to the three colours a swatch can show: what it is
 * drawn on, what a cabinet is painted, and what its outline is. For building a
 * picker without rendering thirteen scenes to fill it.
 *
 * A style that draws no outlines reports its fill as its stroke, so the swatch
 * does not show a border the style would never draw.
 */
export function stylePreview(style, defaults) {
  const { background, borders, surfaces } = deepMerge(defaults, style.patch).appearance;
  const cabinet = surfaces.find((surface) => surface.key === "cabinet") ?? surfaces[0];

  return { background, fill: cabinet.fill, stroke: borders ? cabinet.stroke : cabinet.fill };
}
