import { log } from "$/server/logger";
import { getConnInfo } from "@hono/node-server/conninfo";
import { env } from "~/env.server";
import type { AppBindings } from "./types";
import type { Context } from "hono";
import type { NodeWSContext } from "~/types/ws";
import type { ServerMessage } from "~/validations/transport/messages";

/**
 * Send a message to a WebSocket client
 * @param ws WebSocket client
 * @param message Message to send
 * @returns True if message was sent successfully, false otherwise
 */
export function sendMessage(
  ws: NodeWSContext,
  message: ServerMessage,
): boolean {
  if (ws.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    ws.send(JSON.stringify(message));

    return true;
  } catch (error) {
    log.error({
      source: "websocket.helpers",
      action: "sendMessage",
      error,
    });

    return false;
  }
}

/**
 * Get real IP address from request
 */
export function getRealIp(c: Context<AppBindings>): string {
  if (env.TRUST_PROXY) {
    return (
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      c.req.header("x-real-ip") ??
      "unknown"
    );
  }

  const info = getConnInfo(c);

  return info.remote.address ?? "unknown";
}
