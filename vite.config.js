import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const entry = (name) => fileURLToPath(new URL(`src/${name}`, import.meta.url));

/**
 * The library build. The demo has its own config in `demo/`; this one knows
 * nothing about it.
 *
 * Three entries, because the three answer different needs and nobody should
 * pay for the two they are not using — importing `isobin/core` in a build
 * script must not pull React in behind it. React itself stays external, so the
 * consumer's copy is the only one on the page.
 *
 * Left unminified on purpose: a library is not the last step, and whoever
 * bundles it will do a better job knowing their own targets.
 */
export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2020",
    // The output is unminified, so a stack trace already lands on readable code
    // with the right line on it. Maps would carry a copy of the whole source
    // for that, and come to more than everything else in the package together.
    sourcemap: false,
    minify: false,
    lib: {
      entry: {
        index: entry("index.js"),
        core: entry("core.js"),
        svg: entry("svg.js"),
      },
      formats: ["es", "cjs"],
      fileName: (format, name) => `${name}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/server",
      ],
    },
  },
});
