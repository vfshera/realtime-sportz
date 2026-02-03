import { RouterContextProvider } from "react-router";
import { db } from "~/.server/db";
import { clientEnv, env } from "~/env.server";
import { appContext } from "./context";
import type { AppBindings } from "./types";
import { requestId } from "hono/request-id";
import { createHonoServer } from "react-router-hono-server/node";

export default await createHonoServer<AppBindings>({
  beforeAll(server) {
    server.use(requestId());
  },
  getLoadContext: async function (ctx, { build }) {
    const context = new RouterContextProvider();

    context.set(appContext, {
      appVersion: env.PROD ? build.assets.version : "dev",
      requestId: ctx.get("requestId"),
      env,
      clientEnv,
      db,
    });

    return context;
  },
});
