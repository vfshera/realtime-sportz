import { RouterContextProvider } from "react-router";
import { db } from "~/.server/db";
import { clientEnv, env } from "~/env.server";
import { appContext } from "./context";
import {
  aiBotBlocker,
  botBlocker,
  httpLimiter,
  robotsTxt,
  wsConnectionLimiter,
  wsMessageLimiter,
} from "./security";
import type { AppBindings } from "./types";
import { createWSHandler } from "./websocket/handler";
import type { Context } from "hono";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import type { WSEvents } from "hono/ws";
import { createHonoServer } from "react-router-hono-server/node";

export default await createHonoServer<AppBindings>({
  useWebSocket: true,
  beforeAll(server) {
    server.use(requestId());
    server.use(secureHeaders());
    server.use("/robots.txt", robotsTxt);
    server.use(aiBotBlocker);
    server.use(botBlocker);
    server.use(httpLimiter);
  },
  configure: (app, { upgradeWebSocket }) => {
    app.get(
      "/ws",
      wsConnectionLimiter,
      upgradeWebSocket(
        wsMessageLimiter(
          (c: Context<AppBindings>) =>
            createWSHandler(
              c,
            ) as WSEvents /** app types not inferred correctly by 'upgradeWebSocket' */,
        ),
      ),
    );
  },
  getLoadContext: (ctx, { build }) => {
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
