/**
 * Which cabinets exist, and what goes in them.
 *
 * A row is `{ type, repeat?, count?, divided?, id? }`, or just the type name as
 * a bare string:
 *
 *   type     — key into `config/binTypes.js`
 *   repeat   — how many identical rows to emit (default 1)
 *   count    — bins across the row; defaults to the bin type's `perRow`.
 *              Whatever the count, the row is divided into equal widths, so
 *              this widens or narrows the bins rather than leaving a gap.
 *   divided  — fit the compartment divider? Defaults to the bin type's
 *              `divider.fittedByDefault`; only honoured when the type marks
 *              its divider `optional`.
 *
 * Rows are listed top to bottom. Cabinets are placed left to right from
 * `origin`, each one `gap` away from the last — no x coordinate is authored.
 */
export const layout = {
  /** world x where the leftmost cabinet starts */
  origin: 0,
  /** horizontal gap between neighbouring cabinets */
  gap: 0.14,
  /** usable width inside a cabinet, in world units; per-cabinet overridable */
  innerWidth: 5,

  /**
   * The surface the cabinets stand on. Measured from them, not authored: it
   * spans whatever cabinets there are, `overhang` clear of them on every side.
   */
  table: { enabled: true, thickness: 0.16, overhang: 0.35 },

  organizers: [
    {
      id: "A",
      name: "Organizer 1",
      rows: [{ type: "small", repeat: 12 }],
    },
    {
      id: "B",
      name: "Organizer 2",
      rows: [
        { type: "small", repeat: 6 },
        { type: "medium", repeat: 2 },
        { type: "large", repeat: 2 },
      ],
    },
  ],
};
