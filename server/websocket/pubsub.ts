/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NodeWSContext } from "../types";

class MatchPubSub {
  #matchRooms = new Map<string, Set<NodeWSContext>>();
  #sockets = new Set<NodeWSContext>();
  #heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  addSocket(ws: NodeWSContext) {
    ws.raw!.isAlive = true;
    ws.raw!.on("pong", () => {
      console.log("Pong received!");
      ws.raw!.isAlive = true;
    });
    this.#sockets.add(ws);
  }

  subscribe(ws: NodeWSContext, matchId: string) {
    const socket = ws.raw!;

    if (!socket.subscriptions) {
      socket.subscriptions = new Set();
    }
    socket.subscriptions.add(matchId);

    if (!this.#matchRooms.has(matchId)) {
      this.#matchRooms.set(matchId, new Set());
    }
    this.#matchRooms.get(matchId)!.add(ws);
  }

  unsubscribe(ws: NodeWSContext, matchId: string) {
    this.#matchRooms.get(matchId)?.delete(ws);
    ws.raw!.subscriptions?.delete(matchId);

    if (this.#matchRooms.get(matchId)?.size === 0) {
      this.#matchRooms.delete(matchId);
    }
  }

  publish(matchId: string, payload: unknown) {
    const room = this.#matchRooms.get(matchId);
    if (!room) return;

    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(payload));
        } catch (error) {
          console.error(`Failed to send message to client: ${error}`);
        }
      }
    }
  }

  removeSocket(ws: NodeWSContext) {
    const subscriptions = ws.raw!.subscriptions;

    if (subscriptions) {
      for (const matchId of subscriptions) {
        this.#matchRooms.get(matchId)?.delete(ws);

        if (this.#matchRooms.get(matchId)?.size === 0) {
          this.#matchRooms.delete(matchId);
        }
      }
    }

    this.#sockets.delete(ws);
  }

  startHeartbeat(intervalMs = 30000) {
    if (this.#heartbeatInterval) {
      return;
    }

    this.#heartbeatInterval = setInterval(() => {
      for (const ws of this.#sockets.values()) {
        if (!ws.raw!.isAlive) {
          this.removeSocket(ws);
          ws.raw!.terminate();
          continue;
        }

        ws.raw!.isAlive = false;

        if (ws.readyState === WebSocket.OPEN) {
          console.log("Send ping...");

          ws.raw!.ping();
        }
      }
    }, intervalMs);
  }

  stopHeartbeat() {
    if (this.#heartbeatInterval) {
      clearInterval(this.#heartbeatInterval);
      this.#heartbeatInterval = null;
    }
  }
}

export const pubsub = new MatchPubSub();
