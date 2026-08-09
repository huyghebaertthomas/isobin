import { useCallback, useMemo, useRef, useState } from "react";
import { Isobin } from "isobin";
import { level, short, stock, wall as config } from "./config/parts.js";

/**
 * A bench for the parts of the library you cannot reach from the control panel.
 *
 * The playground edits config; this drives a drawing. Everything on the page is
 * either a call on the handle or a prop keyed by bin id, so what you see here is
 * the whole of the public behaviour: single vs multi, open/close/toggle/set,
 * reading a bin back, highlights, labels, hover, and the keyboard.
 *
 * Nothing here is library code. An application would look about like this.
 */
export function Sandbox() {
  const wall = useRef(null);
  const frame = useRef(null);

  const [mode, setMode] = useState("multi");
  const [query, setQuery] = useState("");
  const [showStock, setShowStock] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [open, setOpen] = useState([]);
  const [log, setLog] = useState([]);
  const [hover, setHover] = useState(null);

  /** every id in the wall, asked of the drawing rather than kept in step by hand */
  const ids = useMemo(() => Object.keys(stock), []);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ids.filter((id) => id.toLowerCase().includes(q)) : [];
  }, [ids, query]);

  /**
   * One map from id to look. Stock decides the base colour; a search hit paints
   * over it, because when you are looking for something that is what you want to
   * see. This is ordinary data work — the library only reads the result.
   */
  const highlight = useMemo(() => {
    const flags = {};
    if (showStock) {
      for (const [id, count] of Object.entries(stock)) {
        const kind = level(count);
        if (kind) flags[id] = kind;
      }
    }
    for (const id of matches) flags[id] = "found";
    return flags;
  }, [showStock, matches]);

  const labels = useMemo(
    () => (showLabels ? Object.fromEntries(Object.entries(stock).map(([id, n]) => [id, short(n)])) : undefined),
    [showLabels]
  );

  const note = useCallback((line) => setLog((prev) => [line, ...prev].slice(0, 8)), []);

  const onChange = useCallback(
    (ids, detail) => {
      setOpen(ids);
      note(`${detail.action}(${format(detail.ids)}) → [${ids.join(", ") || "—"}]`);
    },
    [note]
  );

  /**
   * `bin.screen` is the box in the drawing's own coordinates. Putting HTML over
   * it means undoing the viewBox fit — the one bit of arithmetic the library
   * cannot do for you, because only the page knows how big it drew the svg.
   */
  const anchor = (bin) => {
    const svg = frame.current?.querySelector("svg");
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    const box = svg.viewBox.baseVal;
    const scale = Math.min(rect.width / box.width, rect.height / box.height);

    return {
      left: rect.left + (rect.width - box.width * scale) / 2 + (bin.screen.x - box.x) * scale,
      top: rect.top + (rect.height - box.height * scale) / 2 + (bin.screen.y - box.y) * scale,
      width: bin.screen.width * scale,
      height: bin.screen.height * scale,
    };
  };

  const call = (label, run) => () => {
    const result = run(wall.current);
    note(`${label} → ${format(result)}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center gap-5 p-6">
      <header className="w-full max-w-5xl flex items-baseline justify-between gap-4">
        <h1 className="text-lg font-medium tracking-tight">isobin · bench</h1>
        <a href="#" className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400 hover:text-neutral-900">
          playground
        </a>
      </header>

      <div ref={frame} className="w-full max-w-5xl relative">
        <Isobin
          ref={wall}
          config={config}
          mode={mode}
          highlight={highlight}
          labels={labels}
          onChange={onChange}
          onBinEnter={setHover}
          onBinLeave={() => setHover(null)}
          className="w-full select-none rounded-lg bg-white"
        />

        {hover ? <Tooltip bin={hover} at={anchor(hover)} /> : null}
      </div>

      <section className="w-full max-w-5xl grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="search — try 10k, or LED, or Q-"
              className="flex-1 min-w-56 rounded border border-neutral-300 px-2 py-1 text-sm"
            />
            <Button onClick={call("set(matches)", (api) => api.set(matches))} disabled={!matches.length}>
              open matches ({matches.length})
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Toggle on={mode === "single"} onClick={() => setMode(mode === "single" ? "multi" : "single")}>
              single mode
            </Toggle>
            <Toggle on={showStock} onClick={() => setShowStock(!showStock)}>
              stock colours
            </Toggle>
            <Toggle on={showLabels} onClick={() => setShowLabels(!showLabels)}>
              labels
            </Toggle>
            <Button onClick={call('open("BULK")', (api) => api.open("BULK"))}>open BULK</Button>
            <Button onClick={call('toggle("R-10k")', (api) => api.toggle("R-10k"))}>toggle R-10k</Button>
            <Button onClick={call('isOpen("R-10k")', (api) => api.isOpen("R-10k"))}>is R-10k open?</Button>
            <Button onClick={call('bin("R-10k")', (api) => api.bin("R-10k"))}>read R-10k</Button>
            <Button onClick={call("closeAll()", (api) => api.closeAll())}>close all</Button>
            <Button onClick={call('open("NOPE")', (api) => api.open("NOPE"))}>open a bin that isn't there</Button>
          </div>

          <p className="text-xs text-neutral-500">
            Click a bin, or tab into the wall and walk it with the arrow keys — Enter and Space work the
            one you are on. Turn on single mode and watch opening one shut the rest.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Readout title="open">{open.join(", ") || "nothing"}</Readout>
          <Readout title="log">
            <ol className="flex flex-col gap-0.5">
              {log.map((line, index) => (
                <li key={`${index}-${line}`} className="truncate">
                  {line}
                </li>
              ))}
            </ol>
          </Readout>
        </div>
      </section>
    </div>
  );
}

/** what a tooltip is for: the thing the drawing cannot say itself */
function Tooltip({ bin, at }) {
  if (!at) return null;

  return (
    <div
      className="fixed z-10 -translate-x-1/2 -translate-y-full pointer-events-none rounded bg-neutral-900 px-2 py-1 text-[11px] text-white shadow-lg"
      style={{ left: at.left + at.width / 2, top: at.top - 6 }}
    >
      <strong className="font-mono">{bin.id}</strong> · {stock[bin.id] ?? 0} in stock
      <span className="text-neutral-400">
        {" "}
        — {bin.organizerName}, row {bin.row + 1}
        {bin.open ? " · open" : ""}
      </span>
    </div>
  );
}

const Button = ({ children, ...rest }) => (
  <button
    {...rest}
    className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs hover:border-neutral-900 disabled:opacity-40 disabled:hover:border-neutral-300"
  >
    {children}
  </button>
);

const Toggle = ({ on, children, ...rest }) => (
  <button
    {...rest}
    aria-pressed={on}
    className={`rounded border px-2 py-1 text-xs ${
      on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:border-neutral-900"
    }`}
  >
    {children}
  </button>
);

const Readout = ({ title, children }) => (
  <div role="group" aria-label={title} className="rounded border border-neutral-200 bg-white p-2">
    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-neutral-400">{title}</div>
    <div className="mt-1 font-mono text-[11px] text-neutral-700">{children}</div>
  </div>
);

const format = (value) =>
  Array.isArray(value) ? `[${value.join(", ") || "—"}]` : typeof value === "object" && value
    ? JSON.stringify(value)
    : String(value);
