import type { WSContext } from "hono/ws";
import type { WebSocket as RawWebSocket } from "ws";

export type NodeWSContext = WSContext<RawWebSocket>;

export type { RawWebSocket };

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
    subscriptions: Set<string>;
  }
}
