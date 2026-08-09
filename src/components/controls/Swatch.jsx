/** A colour well: the native picker sits invisibly on top of a painted chip. */
export function Swatch({ value, onChange, disabled, title }) {
  return (
    <span
      title={title}
      className={`relative inline-block h-6 w-6 shrink-0 rounded-md border border-neutral-300 overflow-hidden ${
        disabled ? "opacity-30" : ""
      }`}
    >
      <span className="absolute inset-0" style={{ background: value }} />
      <input
        type="color"
        value={hex(value)}
        disabled={disabled}
        aria-label={title}
        onChange={(event) => onChange(event.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
    </span>
  );
}

/**
 * The chip can paint any CSS colour, but the native picker only accepts
 * `#rrggbb` — anything else and the browser silently swaps in black, which
 * would then be reported back as a change nobody made.
 */
const hex = (value) => (/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000");
