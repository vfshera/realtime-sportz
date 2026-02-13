import type { ClientMessage, RawWebSocket } from "~/types/ws";
import type { AppBindings } from "../types";
import { pubsub } from "./pubsub";
import type { Context } from "hono";
import type { WSEvents } from "hono/ws";

export function createWSHandler(
  c: Context<AppBindings>,
): WSEvents<RawWebSocket> {
  return {
    onOpen(_, ws) {
      console.log("New connection ⬆️");

      pubsub.addSocket(ws);
    },

    onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data.toString()) as ClientMessage;
        console.log("Received message:", data);
      } catch (err) {
        console.error("Failed to parse message:", err);
      }
    },

    onClose(_, ws) {
      console.log("Connection closed");
      pubsub.removeSocket(ws);
    },

    onError(err, ws) {
      console.error("WebSocket error:", err);
      ws.raw?.terminate();
    },
  };
}
