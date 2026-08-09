import test from "node:test";
import assert from "node:assert/strict";

import { buildScene, defaultConfig } from "../src/core.js";
import { closeAllBins, closeBins, openBins, setBins, toggleBin } from "../src/lib/selection.js";
import { createBinApi } from "../src/lib/binApi.js";

/**
 * Opening and closing bins, which is what the library is for.
 *
 * None of this needs React: the rules are pure functions over a list of ids,
 * and the handle is closures over "how to read" and "how to write". So the
 * behaviour a caller depends on is checked here, and the component is left
 * holding nothing but the wiring.
 */

const scene = buildScene(defaultConfig);
const [a, b, c] = scene.bins.map((bin) => bin.id);

test("multi mode leaves the other bins where they are", () => {
  let open = [];
  open = openBins(open, a);
  open = openBins(open, b);
  assert.deepEqual(open, [a, b], "both stay out, in the order they opened");

  open = closeBins(open, a);
  assert.deepEqual(open, [b]);

  open = toggleBin(open, c);
  assert.deepEqual(open, [b, c]);
  assert.deepEqual(toggleBin(open, c), [b], "and toggling it again shuts it");
});

test("single mode keeps exactly one bin out", () => {
  let open = openBins([], a, "single");
  assert.deepEqual(open, [a]);

  open = openBins(open, b, "single");
  assert.deepEqual(open, [b], "opening one shuts the last");

  // asked for several at once, the most recent thing said wins
  assert.deepEqual(openBins([], [a, b, c], "single"), [c]);
  assert.deepEqual(setBins([a], [a, b], "single"), [b]);

  assert.deepEqual(toggleBin([a], b, "single"), [b]);
  assert.deepEqual(toggleBin([a], a, "single"), [], "and a bin can still be shut");
});

test("a change that changes nothing keeps the very same list", () => {
  // the component holds this in state, so a new array here is a wasted render
  const open = [a, b];
  assert.equal(openBins(open, a), open, "already out");
  assert.equal(closeBins(open, c), open, "was never out");
  assert.equal(setBins(open, [a, b]), open, "the same set, in the same order");
  assert.equal(openBins(open, []), open, "nothing asked for");

  const none = [];
  assert.equal(closeAllBins(none), none, "already shut");
  assert.deepEqual(closeAllBins(open), [], "but shutting two does return a new one");

  assert.notEqual(setBins(open, [b, a]), open, "but order is part of the value");
});

/** a handle over a plain variable — the same one the component builds */
function handle({ mode = "multi", open = [] } = {}) {
  const state = { open, changes: [] };
  const api = createBinApi({
    read: () => state.open,
    write: (next, detail) => {
      state.open = next;
      state.changes.push(detail);
    },
    getMode: () => mode,
    lookup: scene.binsById,
  });
  return { api, state };
}

test("the handle opens, closes and reports what it did", () => {
  const { api, state } = handle();

  assert.deepEqual(api.open(a), [a], "and hands back the resulting set");
  assert.deepEqual(api.open([b, c]), [a, b, c]);
  assert.deepEqual(api.close(b), [a, c]);
  assert.deepEqual(api.toggle(a), [c]);
  assert.deepEqual(api.set([a, b]), [a, b]);
  assert.deepEqual(api.closeAll(), []);

  assert.deepEqual(
    state.changes.map((change) => change.action),
    ["open", "open", "close", "toggle", "set", "closeAll"],
    "every change says what it was"
  );
});

test("a read after a write tells the truth straight away", () => {
  // the trap this guards: a handle closed over a render's value would still
  // say false here, and start saying true a moment later
  const { api } = handle();

  api.open(a);
  assert.equal(api.isOpen(a), true);
  assert.deepEqual(api.getOpen(), [a]);
  assert.equal(api.bin(a).open, true);

  api.close(a);
  assert.equal(api.isOpen(a), false);
  assert.equal(api.bin(a).open, false);
});

test("the handle in single mode is the same handle", () => {
  const { api } = handle({ mode: "single" });

  api.open(a);
  api.open(b);
  assert.deepEqual(api.getOpen(), [b]);
  assert.equal(api.isOpen(a), false, "opening one shut the other");
});

test("a bin reports where it is and the box it occupies", () => {
  const { api } = handle();
  const bin = api.bin(a);

  assert.equal(bin.id, a);
  assert.equal(bin.organizerId, scene.binsById.get(a).organizerId);
  assert.equal(typeof bin.row, "number");
  assert.equal(typeof bin.index, "number");
  assert.match(bin.label, /\S/);

  for (const side of ["x", "y", "width", "height"]) {
    assert.equal(typeof bin.screen[side], "number", `screen.${side}`);
  }
  assert.ok(bin.screen.width > 0 && bin.screen.height > 0, "a box a tooltip can be hung on");

  // the box covers the bin shut and fully out, so an overlay pinned to it does
  // not have to move when the bin does
  const shut = scene.binsById.get(a).box;
  assert.ok(bin.screen.width >= 1 && bin.screen.height >= shut.h, "and it covers the travel");

  assert.equal(api.bins().length, scene.bins.length, "and every bin is reachable");
});

test("an id that names no bin is refused rather than quietly ignored", () => {
  const { api, state } = handle();
  const warnings = [];
  const real = console.warn;
  console.warn = (message) => warnings.push(message);

  try {
    assert.deepEqual(api.open("no-such-bin"), [], "nothing opens");
    assert.deepEqual(api.open([a, "nope"]), [a], "and the good ones still do");
  } finally {
    console.warn = real;
  }

  assert.equal(warnings.length, 2, "each mistake is said once");
  assert.match(warnings[0], /no bin with id "no-such-bin"/);
  assert.equal(api.bin("no-such-bin"), null);
  assert.ok(state.changes.length >= 1);
});

test("nothing opens on its own: the config has no idle animation to switch off", () => {
  assert.deepEqual(Object.keys(defaultConfig.motion), ["slide"]);
  assert.equal(defaultConfig.motion.ambient, undefined);
});
