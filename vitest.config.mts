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
    // Cold dynamic imports of the MDX pipeline can exceed the 5s default when
    // the suite runs at full parallelism; the observed failures were load
    // timeouts inside fixtures, not slow assertions.
    testTimeout: 15000,
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
