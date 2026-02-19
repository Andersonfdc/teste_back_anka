import { defineConfig } from "tsup";
import path from "node:path";
import type { Plugin } from "esbuild";

// Resolves @prisma/client to the generated ESM client instead of node_modules
const prismaAliasPlugin: Plugin = {
  name: "prisma-alias",
  setup(build) {
    build.onResolve({ filter: /^@prisma\/client$/ }, () => ({
      path: path.resolve("src/core/lib/prisma/generated/client.ts"),
    }));
  },
};

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "build",
  format: "esm",
  noExternal: [/^@prisma\/client$/],
  plugins: [
    {
      name: "prisma-esm-alias",
      esbuildOptions(options) {
        options.plugins = options.plugins || [];
        options.plugins.unshift(prismaAliasPlugin);
        options.alias = { "@": path.resolve("src") };
      },
    },
  ],
});

