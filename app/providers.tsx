/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import type { Match } from "./.server/db/schema";
import {
  type ClientMessage,
  type ServerMessage,
  serverMessageSchema,
} from "./validations/transport/messages";

type PayloadOf<T extends ServerMessage["type"]> = Extract<
  ServerMessage,
  { type: T }
>["payload"];

type ListenerMap = {
  [K in ServerMessage["type"]]?: Set<(payload: PayloadOf<K>) => void>;
};

function useProvideWebSocket(url: string) {
  const subsRef = useRef<Set<Match["id"]>>(new Set());

  const { sendJsonMessage, readyState } = useWebSocket(url, {
    onMessage: (event) => {
      try {
        const parsed = JSON.parse(event.data);

        const result = serverMessageSchema.safeParse(parsed);

        if (!result.success) {
          console.error("Bad WS message", parsed);

          return;
        }

        const msg = result.data;

        emit(msg.type, msg.payload);
      } catch {
        console.error("Bad WS message", event.data);
      }
    },
    shouldReconnect: () => true,
    reconnectInterval: 5000,
  });

  const isConnected = readyState === ReadyState.OPEN;

  const listenersRef = useRef<ListenerMap>({});

  const on = useCallback(
    <T extends ServerMessage["type"]>(
      type: T,
      cb: (payload: PayloadOf<T>) => void,
    ) => {
      const map = listenersRef.current;

      let set = map[type] as Set<(payload: PayloadOf<T>) => void> | undefined;

      if (!set) {
        set = new Set();
        map[type] = set as ListenerMap[T];
      }

      set.add(cb);

      return () => {
        set!.delete(cb);
        if (set!.size === 0) {
          delete map[type];
        }
      };
    },
    [],
  );

  const emit = useCallback(
    <T extends ServerMessage["type"]>(type: T, payload: PayloadOf<T>) => {
      const set = listenersRef.current[type] as
        | Set<(payload: PayloadOf<T>) => void>
        | undefined;

      set?.forEach((cb) => cb(payload));
    },
    [],
  );

  const send = useCallback(
    (message: ClientMessage): boolean => {
      if (!isConnected) return false;
      sendJsonMessage(message);

      return true;
    },
    [isConnected, sendJsonMessage],
  );

  const unsubscribe = useCallback(
    (matchId: Match["id"]) => {
      const subs = subsRef.current;

      if (!subs.has(matchId)) return;

      subs.delete(matchId);
      const sent = send({ type: "unsubscribe", payload: { matchId } });

      if (!sent) {
        console.warn(
          `Failed to unsubscribe from match ${matchId}: WebSocket not connected`,
        );
      }
    },
    [send],
  );

  const subscribe = useCallback(
    (matchId: Match["id"]) => {
      const subs = subsRef.current;

      const cleanUp = () => {
        unsubscribe(matchId);
      };

      if (subs.has(matchId)) {
        return cleanUp;
      }

      subs.add(matchId);
      const sent = send({ type: "subscribe", payload: { matchId } });

      if (!sent) {
        console.warn(
          `Failed to subscribe to match ${matchId}: WebSocket not connected`,
        );
      }

      return cleanUp;
    },
    [send, unsubscribe],
  );

  useEffect(
    function resubscribeToActiveMatches() {
      if (isConnected) {
        subsRef.current.forEach((matchId) => {
          const sent = send({ type: "subscribe", payload: { matchId } });

          if (!sent) {
            console.warn(
              `Failed to resubscribe to match ${matchId} on reconnect`,
            );
          }
        });
      }
    },
    [isConnected, send],
  );

  return useMemo(
    () => ({ on, send, subscribe, unsubscribe, readyState, isConnected }),
    [send, subscribe, unsubscribe, readyState, isConnected, on],
  );
}

type WebSocketContextType = ReturnType<typeof useProvideWebSocket>;

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) {
  const value = useProvideWebSocket(url);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const ctx = useContext(WebSocketContext);

  if (!ctx) {
    throw new Error(
      "useWebSocketContext must be used within WebSocketProvider",
    );
  }

  return ctx;
}
