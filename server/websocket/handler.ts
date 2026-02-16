import { env } from "~/env.server";
import type { NodeWSContext, RawWebSocket } from "~/types/ws";
import {
  type ServerMessage,
  clientMessageSchema,
} from "~/validations/transport/messages";
import type { AppBindings } from "../types";
import { pubsub } from "./pubsub";
import type { Context } from "hono";
import type { WSEvents } from "hono/ws";

const violations = new WeakMap<NodeWSContext, number>();

function sendError(ws: NodeWSContext, message: string, details?: unknown) {
  try {
    ws.send(
      JSON.stringify({
        type: "error",
        payload: {
          message,
          details: env.DEV ? details : undefined,
        },
      } satisfies ServerMessage),
    );
  } catch (err) {
    console.error("Failed to send error message:", err);
  }
}

function recordViolation(ws: NodeWSContext): boolean {
  const count = (violations.get(ws) || 0) + 1;
  violations.set(ws, count);

  return count >= 3;
}

function parseIncomingMessage(data: string, ws: NodeWSContext): unknown | null {
  try {
    return JSON.parse(data);
  } catch (err) {
    console.error("Invalid JSON received:", err);
    sendError(ws, "Invalid JSON format");

    if (recordViolation(ws)) {
      console.warn("Closing connection due to repeated invalid messages");
      ws.close(1003, "Too many invalid messages");
    }

    return null;
  }
}

export function createWSHandler(
  c: Context<AppBindings>,
): WSEvents<RawWebSocket> {
  return {
    onOpen(_, ws) {
      console.log("New connection ⬆️");

      pubsub.addSocket(ws);
    },

    onMessage(event, ws) {
      const parsed = parseIncomingMessage(event.data.toString(), ws);

      if (parsed === null) {
        return;
      }

      const result = clientMessageSchema.safeParse(parsed);

      if (!result.success) {
        console.error("Schema validation failed:", result.error.flatten());
        sendError(ws, "Invalid message format", result.error.flatten());

        if (recordViolation(ws)) {
          console.warn(
            "Closing connection due to repeated validation failures",
          );
          ws.close(1008, "Too many invalid messages");
        }

        return;
      }

      const { data } = result;

      try {
        switch (data.type) {
          case "subscribe": {
            console.log(`Subscribing to match: ${data.payload.matchId}`);
            pubsub.subscribe(ws, data.payload.matchId);
            break;
          }

          case "unsubscribe": {
            console.log(`Unsubscribing from match: ${data.payload.matchId}`);
            pubsub.unsubscribe(ws, data.payload.matchId);
            break;
          }

          default: {
            const _exhaustive: never = data;
            console.error("Unhandled message type: ", _exhaustive);
          }
        }
      } catch (err) {
        console.error("Error handling message:", err);
        sendError(ws, "Internal server error");
      }
    },

    onClose(_, ws) {
      console.log("Connection closed ⬇️");
      pubsub.removeSocket(ws);
      violations.delete(ws);
    },

    onError(err, ws) {
      console.error("WebSocket error: ", err);
      pubsub.removeSocket(ws);
      violations.delete(ws);
      ws.raw?.terminate();
    },
  };
}
