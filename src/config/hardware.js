/**
 * Physical dimensions of the shelving system, in world units.
 *
 * One world unit is the width of one small bin slot, so `layout.innerWidth: 5`
 * means a cabinet is five small bins wide. Every other measurement here is
 * expressed against that same unit.
 *
 * Any organizer may override any of these via its own `hardware` block — see
 * `config/layout.js`.
 */
export const hardware = {
  /** height of one row unit; a two-unit row (large bins) is twice this */
  rowHeight: 0.62,
  /** front-to-back depth of the carcass */
  depth: 2.0,
  /** thickness of the carcass frame around the mouth */
  frame: 0.18,
  /** thickness of a shelf board */
  shelfThickness: 0.09,
  /** how much shallower a shelf is than the carcass interior */
  shelfDepthInset: 0.0,

  /** gap between neighbouring bins; it falls between them, never against a wall */
  binGap: 0.06,
  /**
   * Height of a bin that fills one row unit — set outright rather than taken
   * from the row, so the row pitch can be changed without the bins growing
   * with it. A bin spanning n rows is this tall plus the (n − 1) row pitches
   * it swallows, and whatever is left over is the headroom above its rim.
   */
  binHeight: 0.49,
  /** wall thickness of a bin; at zero it is still open, just paper-thin */
  binWall: 0.05,
  /** how much shallower a bin is than the carcass interior */
  binDepthInset: 0.12,
  /** how far back from the cabinet mouth a closed bin sits */
  binFrontInset: 0.05,
  /** fraction of its own depth a bin travels when opened (capped per bin type) */
  binPullFraction: 0.78,

  /** thickness of a compartment divider */
  dividerThickness: 0.04,
  /** divider height as a fraction of the bin's interior height */
  dividerHeightFraction: 0.56,
};
