/**
 * Just enough colour to shade a face.
 *
 * `darken` mixes toward black by a fraction, the way a surface turned away from
 * the light loses a proportion of what it reflects rather than a fixed amount.
 * Anything it cannot read — a named colour, `rgb()`, a gradient — is handed back
 * untouched, so an unshaded face is the worst that happens.
 */

export function darken(color, amount) {
  const channels = parseHex(color);
  if (!channels || !(amount > 0)) return color;

  const kept = Math.max(0, 1 - amount);
  return `#${channels.map((c) => clampByte(c * kept)).join("")}`;
}

function parseHex(color) {
  if (typeof color !== "string") return null;

  const hex = color.trim().replace(/^#/, "");
  const wide = hex.length === 3 ? [...hex].map((c) => c + c) : hex.match(/.{2}/g);
  if (hex.length !== 3 && hex.length !== 6) return null;

  const channels = wide.map((pair) => parseInt(pair, 16));
  return channels.some(Number.isNaN) ? null : channels;
}

const clampByte = (value) =>
  Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, "0");
