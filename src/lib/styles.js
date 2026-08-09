import { deepMerge, diff } from "./merge.js";
import { getAt, setAt } from "./path.js";

/**
 * Reading a list of styles.
 *
 * A style is a config override, so both questions here are questions about
 * overrides: which branches the list touches between them, and whether the
 * settings in hand are exactly what one of them asks for.
 */

/**
 * The branches the styles own between them. Switching style puts all of these
 * back to config first, so no part of the style being left behind survives into
 * the one being picked — and a style that names none of a branch is choosing
 * the default for it rather than keeping whatever was there.
 */
export const styleBranches = (styles) => [
  ...new Set(styles.flatMap((style) => Object.keys(style.patch))),
];

/**
 * Picking a style: the owned branches go back to config, then the patch is
 * folded in. Clearing first is the whole point — without it the last style's
 * colours show through wherever the next one is silent, and a few switches in
 * you are looking at a mixture of everything you have tried.
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

/** what a style looks like, for the swatch beside its name */
export function stylePreview(style, defaults) {
  const { background, borders, surfaces } = deepMerge(defaults, style.patch).appearance;
  const cabinet = surfaces.find((surface) => surface.key === "cabinet") ?? surfaces[0];

  // a style that draws no outlines should not show one on its own swatch
  return { background, fill: cabinet.fill, stroke: borders ? cabinet.stroke : cabinet.fill };
}
