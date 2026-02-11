import { RouterContextProvider } from "react-router";
import { db } from "~/.server/db";
import { clientEnv, env } from "~/env.server";
import { appContext } from "./context";
import type { AppBindings } from "./types";
import { requestId } from "hono/request-id";
import type { WSContext } from "hono/ws";
import { createHonoServer } from "react-router-hono-server/node";

const clients = new Set<WSContext>();

export default await createHonoServer<AppBindings>({
  useWebSocket: true,
  beforeAll(server) {
    server.use(requestId());
  },
  configure: (app, { upgradeWebSocket }) => {
    app.get(
      "/ws",
      upgradeWebSocket((c) => ({
        onOpen(_, ws) {
          console.log("New connection ⬆️");
          clients.add(ws);
        },
        onMessage(event, ws) {
          console.log("Context", c.req.header("Cookie"));
          console.log("Event", event);
          console.log(`Message from client: ${event.data}`);
          // Broadcast to all clients except sender
          clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(`${event.data}`);
            }
          });
        },
        onClose(_, ws) {
          console.log("Connection closed");
          clients.delete(ws);
        },
        onError(err, ws) {
          console.error("WebSocket error:", err);
          clients.delete(ws);
        },
      })),
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
