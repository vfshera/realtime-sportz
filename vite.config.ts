import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { reactRouterHonoServer } from "react-router-hono-server/dev";
import { defineConfig } from "vite";
import { denyImports } from "vite-env-only";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    denyImports({
      client: {
        files: ["server/**/*"],
      },
    }),
    reactRouterHonoServer({ serverEntryPoint: "./server/index.ts" }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
