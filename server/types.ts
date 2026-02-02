import type { Env, PublicEnv } from "~/env.server";
import type { RequestIdVariables } from "hono/request-id";

export type SessionVariables = {};

export type AppBindings = {
  Variables: SessionVariables & RequestIdVariables;
};

export type BaseContext = SessionVariables & {
  appVersion: string;
  requestId: string;
  clientEnv: PublicEnv;
  env: Env;
};

declare module "react-router" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouterContextProvider extends BaseContext {}
}
