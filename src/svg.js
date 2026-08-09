import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Isobin } from "./Isobin.jsx";

/**
 * isobin/svg — the drawing as a string.
 *
 *   import { renderToSVG } from "isobin/svg";
 *   writeFileSync("wall.svg", renderToSVG({ style: "kraft" }));
 *
 * The same components the React component uses, rendered once and handed back
 * as markup: no browser, no mounting, and nothing to hydrate. Use it to commit
 * a diagram to a repo, to put a picture in an email, or to serve one from a
 * process that has no front end at all.
 *
 * What you get back is a still. Bins do not slide without a document to animate
 * them, so the scene is drawn shut unless `open` says otherwise, and it carries
 * no click handlers.
 *
 * @param {import("./types.js").Config} [config]
 * @param {import("./types.js").RenderOptions} [options]
 * @returns {string} one `<svg>` element
 */
export function renderToSVG(config, options = {}) {
  const { open = [], idPrefix, label, className, ...rest } = options;

  return renderToStaticMarkup(
    createElement(Isobin, {
      config,
      open,
      interactive: false,
      // Every id in the drawing hangs off this one, and a document holding two
      // of these drawings needs them to differ. Callers who care can say; the
      // rest get a fresh one per call, which is the answer they wanted anyway.
      idPrefix: idPrefix ?? `isobin${next()}`,
      label,
      className,
      // a file that has to stand on its own needs the namespace; harmless in a
      // page, where the parser already knows what an <svg> is
      xmlns: "http://www.w3.org/2000/svg",
      ...rest,
    })
  );
}

let count = 0;
const next = () => ++count;
