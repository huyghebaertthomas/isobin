/** Uniform sample from a `{ min, max }` range. */
export const randomIn = ({ min, max }) => min + Math.random() * (max - min);

/** Uniform pick from a non-empty array. */
export const randomPick = (items) => items[Math.floor(Math.random() * items.length)];

/** True with probability `p`. */
export const chance = (p) => Math.random() < p;
