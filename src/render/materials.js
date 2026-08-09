import { darken } from "../lib/color.js";

/**
 * Turn the appearance settings into props components can spread onto SVG.
 *
 * Each surface becomes `{ faces, line }` — `line` is either the full stroke set
 * or `stroke: "none"` when borders are switched off, so a component never has
 * to know whether outlines are enabled. A zero border width counts as off too:
 * an SVG hairline never goes thinner than one pixel, so it has to be dropped
 * rather than shrunk.
 *
 * `faces` is the fill, once per direction a face can point. An isometric camera
 * only ever shows three of them, so shading is a matter of handing each its own
 * slightly darker fill — see `shadeFaces`. `ramp` then carries what a face needs
 * to fall off across itself as well, or is null when the light is flat.
 */

/**
 * The three faces of a box the camera can see, in the order the light leaves
 * them: whichever one is lit, the next is a step darker and the last two steps.
 * Starting at `top` gives the familiar reading — lit from above and in front.
 */
export const FACES = ["top", "side", "front"];

/**
 * Which way the shadow deepens, given the face taking the light: away from the
 * light, along the lit face's own normal. That is the one direction that leaves
 * the lit face level — it is square to it — while the other two run the whole
 * way along it, which is the split the ramp needs.
 */
const SHADOW = {
  top: ([, y]) => -y,
  side: ([x]) => x,
  front: ([, , z]) => z,
};

/** stand-in for a surface that config no longer defines: draws nothing */
export const blankMaterial = {
  faces: Object.fromEntries(FACES.map((key) => [key, { fill: "none" }])),
  ramp: null,
  width: 0,
  line: { stroke: "none" },
};

export function resolveMaterials({ borders, background, glass, shading, surfaces, stroke }) {
  return {
    background,
    glass,
    /**
     * `vector-effect` is not an inherited property, so setting it on the group
     * a shape lives in does nothing at all. The scene turns this into one CSS
     * rule over its own descendants instead, which does reach them.
     */
    hairline: borders && stroke.nonScaling,
    surfaces: Object.fromEntries(
      surfaces.map((surface) => [surface.key, surfaceMaterial(surface, borders, stroke, shading)])
    ),
  };
}

function surfaceMaterial(surface, borders, stroke, shading) {
  const outlined = borders && surface.width > 0 && surface.strokeOpacity > 0;
  const faces = shadeFaces(surface, shading);

  return {
    faces,
    ramp: rampFor(faces, shading),
    width: outlined ? surface.width : 0,
    line: outlined
      ? {
          stroke: surface.stroke,
          strokeOpacity: surface.strokeOpacity,
          strokeWidth: surface.width,
          strokeLinejoin: stroke.linejoin,
        }
      : { stroke: "none" },
  };
}

/**
 * One fill per face direction. Turning the light off gives every direction the
 * same fill, so a component spreads `faces[direction]` either way and nothing
 * downstream has to know whether shading is on.
 */
function shadeFaces(surface, shading) {
  const face = { fill: surface.fill, fillOpacity: surface.fillOpacity };
  const lit = FACES.indexOf(shading.lit);

  if (!shading.enabled || lit < 0) {
    return Object.fromEntries(FACES.map((key) => [key, face]));
  }

  return Object.fromEntries(
    FACES.map((key, index) => {
      const steps = (index - lit + FACES.length) % FACES.length;
      return [key, { ...face, fill: darken(face.fill, steps * shading.strength) }];
    })
  );
}

/**
 * What a face needs to fall off across itself: which way the shadow deepens,
 * and the colour each direction reaches at its far end. The lit face gets none
 * — it is square to the light, so it has no far end to reach.
 *
 * A colour the mixer cannot read darkens to itself, and a ramp between one
 * colour and the same colour is just a flat fill drawn the expensive way, so
 * that comes back as no ramp at all.
 */
function rampFor(faces, shading) {
  const shadow = SHADOW[shading.lit];
  if (!shading.enabled || !shadow) return null;
  if (!shading.gradient.enabled || !(shading.gradient.strength > 0)) return null;

  const shades = Object.fromEntries(
    FACES.map((key) => {
      const far = darken(faces[key].fill, shading.gradient.strength);
      return [key, key === shading.lit || far === faces[key].fill ? null : far];
    })
  );

  return FACES.some((key) => shades[key]) ? { shadow, shades } : null;
}

export const materialFor = (materials, key) => materials.surfaces[key] ?? blankMaterial;
