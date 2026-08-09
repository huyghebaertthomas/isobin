import { useState } from "react";
import { getAt } from "isobin/core";
import { Field } from "./Field.jsx";
import { Section } from "./Section.jsx";
import { StylePicker } from "./StylePicker.jsx";
import { SurfaceRow } from "./SurfaceRow.jsx";

/**
 * The whole panel, rendered from `config/controls.js`. It reads and writes the
 * live settings by path and holds no state of its own beyond which sections are
 * open, so every knob in config is reachable here without a line of bespoke
 * markup.
 */
export function ControlPanel({
  settings,
  sections,
  styles,
  onChange,
  onRestore,
  onReset,
  onCopy,
  onClose,
  labels,
}) {
  const valueAt = (path) => getAt(settings, path);
  const enabled = (field) => !field.enabledWhen || !!valueAt(field.enabledWhen);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-900">
          {labels.title}
        </h2>
        <span className="ml-auto flex gap-3">
          <CopyButton onCopy={onCopy} labels={labels} />
          <button
            onClick={onReset}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            {labels.reset}
          </button>
          <button
            onClick={onClose}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            {labels.close}
          </button>
        </span>
      </header>

      <div className="px-4">
        <StylePicker {...styles} label={labels.styles} />

        {sections.map((section) => (
          <Section
            key={section.key}
            title={section.label}
            defaultOpen={section.open}
            resetLabel={labels.resetSection}
            onReset={() => onRestore(pathsOf(section))}
          >
            {section.fields.map((field) => (
              <Field
                key={field.path}
                field={field}
                value={valueAt(field.path)}
                disabled={!enabled(field)}
                onChange={(value) => onChange(field.path, value)}
              />
            ))}

            {section.surfaces ? (
              <div className="mt-2 flex flex-col gap-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-300">
                  {labels.surfaces}
                </span>
                {settings.appearance.surfaces.map((surface, index) => (
                  <SurfaceRow
                    key={surface.key}
                    surface={surface}
                    index={index}
                    valueAt={valueAt}
                    enabled={enabled}
                    onChange={onChange}
                  />
                ))}
              </div>
            ) : null}
          </Section>
        ))}
      </div>
    </div>
  );
}

/** every branch a section owns, so "reset this section" knows what to put back */
const pathsOf = (section) => [
  ...section.fields.map((field) => field.path),
  ...(section.surfaces ? ["appearance.surfaces"] : []),
];

function CopyButton({ onCopy, labels }) {
  const [done, setDone] = useState(false);

  return (
    <button
      title={labels.copyHint}
      onClick={async () => {
        if (!(await onCopy())) return;
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:text-neutral-900 transition-colors"
    >
      {done ? labels.copied : labels.copy}
    </button>
  );
}
