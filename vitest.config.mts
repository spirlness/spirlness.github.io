import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/**/*.test.{ts,tsx}", "src/**/__tests__/**"],
      reporter: ["text", "html", "json-summary", "json"],
      thresholds: {
        // Report all production files; gate core logic separately from UI
        // interactions, which are exercised by the Playwright suite.
        "src/lib/**": {
          statements: 80,
          functions: 80,
          lines: 80,
          branches: 75,
        },
      },
    },
  },
});
