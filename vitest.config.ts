import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [tsconfigPaths()],
    test: {
      environment: "node",
      include: ["tests/**/*.test.ts"],
      coverage: {
        provider: "v8",
        reportsDirectory: "./coverage",
        reporter: ["text", "html", "lcov"],
        exclude: ["src/server.ts", "src/plugins/swagger.ts"],
      },
      globals: false,
      hookTimeout: 30000,
      env: {
        ...env,
        NODE_ENV: "test", // Override NODE_ENV for tests
      },
    },
  };
});
