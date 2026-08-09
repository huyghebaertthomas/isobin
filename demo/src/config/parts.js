/**
 * A parts wall with real names, and a stock table keyed by the same names.
 *
 * This is the shape the library was built for: the ids are the inventory
 * system's ids, written into the layout, so everything downstream — the
 * highlights, the labels, the handle calls — is keyed by something that means
 * something rather than by where a bin happens to sit. Insert a row at the top
 * of a cabinet and `R-10k` is still `R-10k`.
 */
export const wall = {
  view: { scale: 32 },
  layout: {
    organizers: [
      {
        id: "A",
        name: "Passives",
        rows: [
          { type: "small", ids: ["R-100", "R-220", "R-1k", "R-4k7", "R-10k"] },
          { type: "small", ids: ["R-22k", "R-47k", "R-100k", "R-220k", "R-1M"] },
          { type: "small", ids: ["C-100n", "C-1u", "C-10u", "C-47u", "C-100u"] },
          { type: "medium", ids: ["L-COIL", "X-XTAL"] },
        ],
      },
      {
        id: "B",
        name: "Actives",
        rows: [
          { type: "small", ids: ["D-1N4148", "D-1N4007", "D-ZENER", "LED-R", "LED-G"] },
          { type: "small", ids: ["Q-2N3904", "Q-2N3906", "Q-BC547", "Q-IRLZ44", "Q-TIP120"] },
          { type: "medium", ids: ["IC-555", "IC-OPAMP"] },
          { type: "large", id: "BULK" },
        ],
      },
    ],
  },
};

/** what is in each bin, as an inventory system would know it */
export const stock = {
  "R-100": 480,
  "R-220": 350,
  "R-1k": 1200,
  "R-4k7": 96,
  "R-10k": 940,
  "R-22k": 14,
  "R-47k": 210,
  "R-100k": 0,
  "R-220k": 65,
  "R-1M": 8,
  "C-100n": 620,
  "C-1u": 145,
  "C-10u": 12,
  "C-47u": 40,
  "C-100u": 0,
  "L-COIL": 32,
  "X-XTAL": 19,
  "D-1N4148": 300,
  "D-1N4007": 175,
  "D-ZENER": 6,
  "LED-R": 88,
  "LED-G": 74,
  "Q-2N3904": 140,
  "Q-2N3906": 130,
  "Q-BC547": 0,
  "Q-IRLZ44": 22,
  "Q-TIP120": 9,
  "IC-555": 35,
  "IC-OPAMP": 58,
  BULK: 1,
};

/** the rule the twin colours by: out is out, nearly out is worth seeing */
export const level = (count) => (count === 0 ? "empty" : count < 20 ? "low" : null);

/** 940 → "940", 1200 → "1.2k" — short enough to letter onto a bin face */
export const short = (count) => (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : String(count));
