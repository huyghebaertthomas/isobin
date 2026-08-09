import { Swatch } from "./Swatch.jsx";

/**
 * One control, chosen by the field's `type`. It knows nothing about what it is
 * editing — the field says where the value comes from and what shape it is, and
 * `ControlPanel` hands it the value and a setter for that path.
 */
export function Field({ field, value, disabled, onChange }) {
  const dim = disabled ? "opacity-30" : "";

  return (
    <div
      className="grid grid-cols-[6rem_1fr_2.75rem] items-center gap-2"
      title={[field.hint, field.unit && `in ${field.unit}`].filter(Boolean).join(" · ") || undefined}
    >
      <span className={`font-mono text-[10px] uppercase tracking-[0.12em] text-neutral-500 truncate ${dim}`}>
        {field.label}
      </span>
      {control(field, value, disabled, onChange)}
    </div>
  );
}

function control(field, value, disabled, onChange) {
  switch (field.type) {
    case "color":
      return (
        <>
          <span className="flex items-center gap-2">
            <Swatch value={value} onChange={onChange} disabled={disabled} title={field.label} />
            <input
              type="text"
              value={value}
              disabled={disabled}
              onChange={(event) => onChange(event.target.value)}
              aria-label={field.label}
              className="w-20 rounded border border-neutral-200 px-1 py-0.5 font-mono text-[10px] uppercase text-neutral-600 disabled:opacity-30"
            />
          </span>
          <span />
        </>
      );

    case "toggle":
      return (
        <>
          <input
            type="checkbox"
            checked={!!value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
            aria-label={field.label}
            className="h-4 w-4 justify-self-start accent-neutral-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
          />
          <span />
        </>
      );

    case "select":
      return (
        <>
          <select
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            aria-label={field.label}
            className="col-span-2 w-full rounded border border-neutral-200 bg-white px-1 py-0.5 font-mono text-[10px] text-neutral-600 disabled:opacity-30"
          >
            {field.options.map((option) => {
              const { value: v, label } = typeof option === "string" ? { value: option, label: option } : option;
              return (
                <option key={v} value={v}>
                  {label}
                </option>
              );
            })}
          </select>
        </>
      );

    default:
      return (
        <>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(parseFloat(event.target.value))}
            aria-label={field.label}
            className="w-full accent-neutral-900 disabled:opacity-30"
          />
          <span
            className={`font-mono text-[10px] tabular-nums text-neutral-400 text-right ${
              disabled ? "opacity-30" : ""
            }`}
          >
            {format(value, field.step)}
          </span>
        </>
      );
  }
}

/** as many decimals as the step implies, so 0.01 steps do not read as 0.6100000001 */
function format(value, step) {
  const decimals = (String(step ?? 1).split(".")[1] ?? "").length;
  return Number(value).toFixed(decimals);
}
