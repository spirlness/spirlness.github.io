import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      thresholds: {
        statements: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
