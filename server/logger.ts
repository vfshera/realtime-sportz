import { env } from "~/env.server";
import type { AppBindings } from "./types";
import { createRequestLogger, initLogger, log } from "evlog";
import { createMiddleware } from "hono/factory";

initLogger({
  env: { service: env.PUBLIC_APP_NAME, environment: env.NODE_ENV },
  pretty: env.DEV,
});

export const loggerMiddleware = createMiddleware<AppBindings>(
  async (c, next) => {
    const startedAt = Date.now();

    const log = createRequestLogger({
      method: c.req.method,
      path: c.req.path,
      requestId: c.get("requestId"),
    });

    c.set("log", log);

    try {
      await next();
    } catch (error) {
      log.error(error as Error);
      throw error;
    } finally {
      log.emit({
        status: c.res.status,
        duration: Date.now() - startedAt,
      });
    }
  },
);
