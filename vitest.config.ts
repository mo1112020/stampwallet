import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**"],
    server: {
      // next-intl's ESM middleware build does `import ... from "next/server"`
      // with no extension. Loaded natively (the default for external deps),
      // Node's ESM resolver can't complete that extensionless import even
      // though the file exists -- Vite's own resolver can. Inlining forces
      // Vitest to transform next-intl through Vite instead of loading it
      // natively, which fixes resolution here. Test-only; doesn't touch how
      // the real Next.js app (built by webpack/Turbopack, not this) resolves
      // the same import.
      deps: {
        inline: ["next-intl"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
