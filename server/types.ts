import type { DB } from "~/.server/db";
import type { Env, PublicEnv } from "~/env.server";
import type { RequestLogger } from "evlog";
import type { RequestIdVariables } from "hono/request-id";

export type AppBindings = {
  Variables: RequestIdVariables & {
    log: RequestLogger;
  };
};

export type BaseContext = {
  appVersion: string;
  requestId: string;
  clientEnv: PublicEnv;
  env: Env;
  db: DB;
  log: RequestLogger;
};

declare module "react-router" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouterContextProvider extends BaseContext {}
}
