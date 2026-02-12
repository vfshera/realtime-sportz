import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ClientMessage } from "./types";
import useWebSocket, { ReadyState } from "react-use-websocket";

function useProvideWebSocket(url: string) {
  const subsRef = useRef<Set<number>>(new Set());

  const { sendJsonMessage, readyState } = useWebSocket(url, {
    shouldReconnect: () => true,
    reconnectInterval: 5000,
  });

  const isConnected = readyState === ReadyState.OPEN;

  const send = useCallback(
    (message: ClientMessage): boolean => {
      if (!isConnected) return false;
      sendJsonMessage(message);

      return true;
    },
    [isConnected, sendJsonMessage],
  );

  const subscribe = useCallback(
    (matchId: number) => {
      const subs = subsRef.current;

      if (subs.has(matchId)) return;

      subs.add(matchId);
      const sent = send({ type: "subscribe", payload: { matchId } });

      if (!sent) {
        console.warn(
          `Failed to subscribe to match ${matchId}: WebSocket not connected`,
        );
      }
    },
    [send],
  );

  const unsubscribe = useCallback(
    (matchId: number) => {
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

  useEffect(() => {
    if (!isConnected) return;

    subsRef.current.forEach((matchId) => {
      const sent = send({ type: "subscribe", payload: { matchId } });

      if (!sent) {
        console.warn(`Failed to resubscribe to match ${matchId} on reconnect`);
      }
    });
  }, [isConnected, send]);

  return useMemo(
    () => ({
      send,
      subscribe,
      unsubscribe,
      readyState,
      isConnected,
    }),
    [send, subscribe, unsubscribe, readyState, isConnected],
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
