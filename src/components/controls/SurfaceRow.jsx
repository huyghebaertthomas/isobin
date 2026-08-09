import { surfaceFields } from "../../config/controls.js";
import { Field } from "./Field.jsx";

/**
 * Fill, border and opacity for one surface. The controls are generated from the
 * surface's index, so this component has no idea which surfaces exist — adding
 * one to `appearance.surfaces` adds its block here.
 */
export function SurfaceRow({ surface, index, valueAt, enabled, onChange }) {
  return (
    <div className="flex flex-col gap-2 border-l border-neutral-200 pl-3">
      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-sm border border-neutral-300"
          style={{ background: surface.fill, opacity: surface.fillOpacity }}
        />
        {surface.label}
      </span>

      {surfaceFields(index).map((field) => (
        <Field
          key={field.path}
          field={field}
          value={valueAt(field.path)}
          disabled={!enabled(field)}
          onChange={(value) => onChange(field.path, value)}
        />
      ))}
    </div>
  );
}
