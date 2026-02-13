import type { Match } from "~/.server/db/schema";
import type { WSContext } from "hono/ws";
import type { WebSocket as RawWebSocket } from "ws";

/**
 *  Websocket subscription message type
 */
export type SubscriptionMessage =
  | {
      type: "subscribe";
      payload: { matchId: number };
    }
  | {
      type: "unsubscribe";
      payload: { matchId: number };
    };

/**
 *  Websocket message types sent from the client to the server
 */
export type ClientMessage = SubscriptionMessage;

/**
 * Websocket message type for match updates sent from the server to the client
 */
export type MatchMessage = { type: "match.created"; payload: Match };

/**
 * Websocket message types sent from the server to the client
 */
export type ServerMessage = MatchMessage | { type: "welcome"; payload: string };

export type NodeWSContext = WSContext<RawWebSocket>;

export type { RawWebSocket };

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
    subscriptions: Set<string>;
  }
}
