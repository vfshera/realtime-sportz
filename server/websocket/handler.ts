import { log } from "$/server/logger";
import z from "zod";
import {
  type ServerMessage,
  clientMessageSchema,
} from "~/validations/transport/messages";
import { env } from "~/env.server";
import { pubsub } from "./pubsub";
import type { AppBindings } from "../types";
import type { Context } from "hono";
import type { WSEvents } from "hono/ws";
import type { NodeWSContext, RawWebSocket } from "~/types/ws";

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
    log.error({ source: "websocket", action: "sendError", error: err });
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
    log.error({
      source: "websocket",
      action: "parseMessage",
      status: "invalid_json",
      error: err,
    });
    sendError(ws, "Invalid JSON format");

    if (recordViolation(ws)) {
      log.warn({
        source: "websocket",
        action: "closeConnection",
        reason: "repeated_invalid_messages",
      });
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
      log.info({ source: "websocket", action: "connection", status: "open" });
      pubsub.addSocket(ws);
    },

    onMessage(event, ws) {
      const parsed = parseIncomingMessage(event.data.toString(), ws);

      if (parsed === null) {
        return;
      }

      const result = clientMessageSchema.safeParse(parsed);

      if (!result.success) {
        const errors = z.flattenError(result.error);
        log.error({
          source: "websocket",
          action: "validateMessage",
          status: "validation_failed",
          errors,
        });
        sendError(ws, "Invalid message format", errors);

        if (recordViolation(ws)) {
          log.warn({
            source: "websocket",
            action: "closeConnection",
            reason: "repeated_validation_failures",
          });
          ws.close(1008, "Too many invalid messages");
        }

        return;
      }

      const { data } = result;

      try {
        switch (data.type) {
          case "subscribe": {
            log.info({
              source: "websocket",
              action: "subscribe",
              matchId: data.payload.matchId,
            });
            pubsub.subscribe(ws, data.payload.matchId);
            break;
          }

          case "unsubscribe": {
            log.info({
              source: "websocket",
              action: "unsubscribe",
              matchId: data.payload.matchId,
            });
            pubsub.unsubscribe(ws, data.payload.matchId);
            break;
          }

          default: {
            const _exhaustive: never = data;
            log.error({
              source: "websocket",
              action: "unhandledMessageType",
              data: _exhaustive,
            });
          }
        }
      } catch (err) {
        log.error({
          source: "websocket",
          action: "handleMessage",
          error: err,
        });
        sendError(ws, "Internal server error");
      }
    },

    onClose(_, ws) {
      log.info({ source: "websocket", action: "connection", status: "closed" });
      pubsub.removeSocket(ws);
      violations.delete(ws);
    },

    onError(err, ws) {
      log.error({ source: "websocket", action: "error", error: err });
      pubsub.removeSocket(ws);
      violations.delete(ws);
      ws.raw?.terminate();
    },
  };
}
