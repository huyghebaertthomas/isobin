/**
 * Camera and canvas. The viewBox is measured from the built scene rather than
 * authored, so changing the layout or the scale reframes it automatically.
 */
export const view = {
  /** screen units per world unit */
  scale: 24,
  /** vertical foreshortening of the depth axis; 0.5 is classic 2:1 isometric */
  depthScale: 0.5,
  /** breathing room around the measured scene bounds, in screen units */
  padding: { top: 28, right: 40, bottom: 40, left: 40 },
};
