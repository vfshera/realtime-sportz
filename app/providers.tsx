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
    (message: ClientMessage) => {
      if (!isConnected) return;
      sendJsonMessage(message);
    },
    [isConnected, sendJsonMessage],
  );

  const subscribe = useCallback(
    (matchId: number) => {
      const subs = subsRef.current;

      if (subs.has(matchId)) return;

      subs.add(matchId);
      send({ type: "subscribe", payload: { matchId } });
    },
    [send],
  );

  const unsubscribe = useCallback(
    (matchId: number) => {
      const subs = subsRef.current;

      if (!subs.has(matchId)) return;

      subs.delete(matchId);
      send({ type: "unsubscribe", payload: { matchId } });
    },
    [send],
  );

  useEffect(() => {
    if (!isConnected) return;

    subsRef.current.forEach((matchId) => {
      send({ type: "subscribe", payload: { matchId } });
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
