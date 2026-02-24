/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { NodeWSContext } from "~/types/ws";
import type { ServerMessage } from "~/validations/transport/messages";
import { sendMessage } from "../helpers";
import { log } from "$/server/logger";

class MatchPubSub {
  #matchRooms = new Map<string, Set<NodeWSContext>>();
  #sockets = new Set<NodeWSContext>();
  #heartbeatInterval: NodeJS.Timeout | null = null;
  readonly #HEARTBEAT_INTERVAL_MS = 30_000;
  readonly #MAX_SUBSCRIPTIONS_PER_SOCKET = 50;

  constructor() {
    this.startHeartbeat();
  }

  addSocket(ws: NodeWSContext) {
    const rawWS = ws.raw!;

    rawWS.isAlive = true;
    rawWS.subscriptions = new Set();

    rawWS.on("pong", () => {
      rawWS.isAlive = true;
    });

    this.#sockets.add(ws);
    this.welcome(ws);
  }

  welcome(ws: NodeWSContext, message = "Welcome!"): void {
    sendMessage(ws, { type: "welcome", payload: { message } });
  }

  subscribe(ws: NodeWSContext, matchId: string): boolean {
    const socket = ws.raw!;

    if (
      socket.subscriptions &&
      socket.subscriptions.size >= this.#MAX_SUBSCRIPTIONS_PER_SOCKET
    ) {
      log.warn({
        source: "pubsub",
        action: "subscribe",
        status: "max_subscriptions_exceeded",
        maxSubscriptions: this.#MAX_SUBSCRIPTIONS_PER_SOCKET,
      });

      return false;
    }

    if (!matchId || typeof matchId !== "string") {
      log.error({
        source: "pubsub",
        action: "subscribe",
        status: "invalid_matchId",
        matchId,
      });

      return false;
    }

    if (!socket.subscriptions) {
      socket.subscriptions = new Set();
    }

    socket.subscriptions.add(matchId);

    if (!this.#matchRooms.has(matchId)) {
      this.#matchRooms.set(matchId, new Set());
    }

    this.#matchRooms.get(matchId)!.add(ws);

    log.info({
      source: "pubsub",
      action: "subscribe",
      matchId,
      status: "success",
    });

    return true;
  }

  unsubscribe(ws: NodeWSContext, matchId: string) {
    const room = this.#matchRooms.get(matchId);

    if (room) {
      room.delete(ws);

      if (room.size === 0) {
        this.#matchRooms.delete(matchId);
      }
    }

    ws.raw!.subscriptions!.delete(matchId);

    log.info({
      source: "pubsub",
      action: "unsubscribe",
      matchId,
      status: "success",
    });
  }

  broadcast(matchId: string, message: ServerMessage) {
    const room = this.#matchRooms.get(matchId);

    if (!room || room.size === 0) {
      log.warn({
        source: "pubsub",
        action: "broadcast",
        status: "no_subscribers",
        matchId,
      });

      return;
    }

    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        sendMessage(client, message);
      }
    }
  }

  broadcastToAll(message: ServerMessage) {
    if (this.#sockets.size === 0) {
      log.warn({
        source: "pubsub",
        action: "broadcastToAll",
        status: "no_connected_clients",
      });

      return;
    }

    for (const client of this.#sockets) {
      if (client.readyState === WebSocket.OPEN) {
        sendMessage(client, message);
      }
    }

    log.info({
      source: "pubsub",
      action: "broadcastToAll",
      status: "success",
      clientCount: this.#sockets.size,
    });
  }

  removeSocket(ws: NodeWSContext) {
    const subscriptions = ws.raw!.subscriptions;

    if (subscriptions) {
      for (const matchId of subscriptions) {
        const room = this.#matchRooms.get(matchId);

        if (room) {
          room.delete(ws);

          if (room.size === 0) {
            this.#matchRooms.delete(matchId);
          }
        }
      }

      subscriptions.clear();
    }

    this.#sockets.delete(ws);
  }

  startHeartbeat(intervalMs = this.#HEARTBEAT_INTERVAL_MS) {
    if (this.#heartbeatInterval) {
      log.warn({
        source: "pubsub",
        action: "startHeartbeat",
        status: "already_running",
      });

      return;
    }

    this.#heartbeatInterval = setInterval(() => {
      for (const ws of this.#sockets) {
        const socket = ws.raw!;

        if (!socket.isAlive) {
          socket.terminate();
          this.removeSocket(ws);
          continue;
        }

        socket.isAlive = false;

        if (ws.readyState === WebSocket.OPEN) {
          socket.ping();
        }
      }
    }, intervalMs);

    log.info({
      source: "pubsub",
      action: "startHeartbeat",
      intervalMs,
      status: "started",
    });
  }

  stopHeartbeat() {
    if (this.#heartbeatInterval) {
      clearInterval(this.#heartbeatInterval);
      this.#heartbeatInterval = null;

      log.info({
        source: "pubsub",
        action: "stopHeartbeat",
        status: "stopped",
      });
    }
  }

  destroy(): void {
    this.stopHeartbeat();

    for (const ws of this.#sockets) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1001, "Server shutting down");
        }
      } catch (err) {
        log.error({
          source: "pubsub",
          action: "destroy",
          status: "failed_to_close_socket",
          error: err,
        });
      }
    }

    this.#sockets.clear();
    this.#matchRooms.clear();
    log.info({ source: "pubsub", action: "destroy", status: "destroyed" });
  }

  getStats() {
    return {
      totalSockets: this.#sockets.size,
      totalRooms: this.#matchRooms.size,
      rooms: Array.from(this.#matchRooms.entries()).map(
        ([matchId, sockets]) => ({
          matchId,
          subscribers: sockets.size,
        }),
      ),
    };
  }
}

export const pubsub = new MatchPubSub();
