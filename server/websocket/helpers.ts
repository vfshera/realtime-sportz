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
    console.error("Failed to send message:", error);

    return false;
  }
}
