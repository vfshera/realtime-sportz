import type { DB } from "~/.server/db";
import type { Env, PublicEnv } from "~/env.server";
import type { RequestIdVariables } from "hono/request-id";
import type { WSContext } from "hono/ws";
import type { WebSocket as RawWebSocket } from "ws";

type AppBindings = {
  Variables: RequestIdVariables;
};

type BaseContext = {
  appVersion: string;
  requestId: string;
  clientEnv: PublicEnv;
  env: Env;
  db: DB;
};

declare module "react-router" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouterContextProvider extends BaseContext {}
}

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
    subscriptions: Set<string>;
  }
}

type NodeWSContext = WSContext<RawWebSocket>;

export type { RawWebSocket, AppBindings, BaseContext, NodeWSContext };
