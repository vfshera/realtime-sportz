import { cn } from "~/utils/styling";
import useWebSocket, { ReadyState } from "react-use-websocket";

function getConnectionStatus(readyState: ReadyState) {
  return {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];
}

export function Status({ wsUrl }: { wsUrl: string }) {
  const { readyState } = useWebSocket(wsUrl || null);

  const isOnline = readyState === ReadyState.OPEN;

  const connectionStatus = getConnectionStatus(readyState);

  console.log("Websocket Connection: ", connectionStatus);

  return (
    <div className="status-badge border-dark flex items-center gap-2 rounded-[100px] border-2 bg-white px-5 py-3 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
      <div
        className={cn(
          "status-dot size-2.5 rounded-full",
          isOnline ? "bg-green-500" : "bg-text-secondary",
        )}
      />
      {isOnline ? "ONLINE" : "OFFLINE"}
    </div>
  );
}
