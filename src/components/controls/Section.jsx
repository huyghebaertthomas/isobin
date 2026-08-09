import { useState } from "react";

/** A collapsible block of controls, with a reset for just this block. */
export function Section({ title, defaultOpen = false, onReset, resetLabel, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-b border-neutral-200 last:border-b-0">
      <div className="flex items-center">
        <button
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-2 py-2.5 text-left font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-900 hover:text-neutral-500 transition-colors"
        >
          <span className={`text-neutral-300 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
          {title}
        </button>

        {open && onReset ? (
          <button
            onClick={onReset}
            title={resetLabel}
            aria-label={resetLabel}
            className="px-1 font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-300 hover:text-neutral-900 transition-colors"
          >
            ↺
          </button>
        ) : null}
      </div>

      {open ? <div className="flex flex-col gap-2 pb-4">{children}</div> : null}
    </section>
  );
}
