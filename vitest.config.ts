import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      exclude: ["node_modules", "dist", "**/*.test.ts", "vitest.config.ts", ".pnp.*"],
      thresholds: {
        lines: 50,
        functions: 20,
        branches: 50,
        statements: 50,
      },
    },
  },
});
