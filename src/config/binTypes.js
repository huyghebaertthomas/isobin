/**
 * The three bin types the physical system ships with.
 *
 * `perRow` is a compartment/bin COUNT, not a width: a row is always filled
 * exactly, so bin width falls out of `innerWidth / perRow`. Divider positions
 * work the same way — `compartments` is a count, and the dividers are packed
 * from it so every compartment comes out equal.
 *
 *   axis "x" → divider runs front-to-back, splitting the bin left/right
 *   axis "z" → divider runs left-to-right, splitting the bin depth-wise
 */
export const binTypes = {
  small: {
    label: "Small",
    /** row units of height this bin occupies */
    rowUnits: 1,
    /** how many of these fit across one row */
    perRow: 5,
    /** furthest this bin can slide out, regardless of binPullFraction */
    maxPull: 1.2,
    divider: { axis: "z", compartments: 2, optional: true, fittedByDefault: true },
  },
  medium: {
    label: "Medium",
    rowUnits: 1,
    perRow: 2,
    maxPull: 1.2,
    divider: { axis: "x", compartments: 2, optional: true, fittedByDefault: true },
  },
  large: {
    label: "Large",
    rowUnits: 2,
    perRow: 1,
    maxPull: 1.45,
    divider: { axis: "x", compartments: 3, optional: false, fittedByDefault: true },
  },
};
