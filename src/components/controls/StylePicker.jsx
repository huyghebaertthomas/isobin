/**
 * The ready-made looks, as a row of swatches.
 *
 * Picking one writes into the same settings every other control writes into,
 * so a style is a starting point rather than a mode: carry on turning knobs
 * afterwards and the panel neither knows nor minds. The lit swatch goes out the
 * moment you do, because from then on what you are looking at is yours.
 */
export function StylePicker({ styles, previews, active, onPick, label }) {
  return (
    <div className="border-b border-neutral-200 py-3">
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-300">
        {label}
      </span>

      <div className="mt-2 grid grid-cols-2 gap-1">
        {styles.map((style) => {
          const chosen = active === style.key;
          const { background, fill, stroke } = previews[style.key];

          return (
            <button
              key={style.key}
              onClick={() => onPick(style)}
              title={style.hint}
              aria-pressed={chosen}
              className={`flex items-center gap-2 rounded px-1.5 py-1 text-left transition-colors ${
                chosen ? "bg-neutral-900" : "hover:bg-neutral-100"
              }`}
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-sm border"
                style={{ background, borderColor: stroke }}
              >
                <span className="block h-full w-full scale-50 rounded-[1px]" style={{ background: fill }} />
              </span>
              <span
                className={`truncate font-mono text-[10px] uppercase tracking-[0.12em] ${
                  chosen ? "text-white" : "text-neutral-500"
                }`}
              >
                {style.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
