import { createContext, useContext, useId } from "react";

/**
 * A name no other scene on the page will use.
 *
 * Everything the scene refers to by url — clip paths, the frost backdrops, one
 * gradient per shaded face — needs an id, and an SVG id is global to the
 * document however deeply the element is nested. Two scenes that agreed on a
 * name would quietly share the first one's gradients.
 *
 * In the browser `useId` settles that on its own: it is unique per React root
 * and per position in the tree, so any number of mounted scenes get their own.
 * It is server rendering that breaks the guarantee, because the counter behind
 * it restarts on every `renderToStaticMarkup` call — render two scenes in two
 * calls, put both in one page, and the second one's `url(#…)` resolves to the
 * first one's gradients. Hence `idPrefix`: hand a scene a name of your own and
 * it is answerable for its own uniqueness.
 */
const SceneIdContext = createContext(null);

/** strip an id down to what is safe in a CSS selector as well as an SVG id */
const clean = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, "");

/**
 * This scene's id, from `idPrefix` when the caller supplied one and from
 * `useId` when they did not. Called by the scene root; everything below reads
 * it back with `useSceneId`.
 */
export function useSceneName(idPrefix) {
  const generated = useId();
  return idPrefix ? clean(idPrefix) : `iso${clean(generated)}`;
}

export function SceneIdProvider({ id, children }) {
  return <SceneIdContext.Provider value={id}>{children}</SceneIdContext.Provider>;
}

/**
 * A unique id for something inside this scene. `local` distinguishes it from
 * the scene's other ids; the prefix distinguishes it from every other scene's.
 */
export function useSceneId(local) {
  const scene = useContext(SceneIdContext);
  if (!scene) throw new Error("useSceneId must be used inside a <SceneIdProvider>.");
  return `${scene}-${clean(local)}`;
}

export { clean as cleanId };
