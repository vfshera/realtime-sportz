import type { Route } from "./+types/_index";
import { useCallback, useEffect, useMemo, useState } from "react";
import { appContext } from "$/server/context";
import { ClientOnly } from "remix-utils/client-only";
import {
  CommentaryPanel,
  EmptyCommentaryPanel,
} from "~/components/commentary-panel";
import HomeSkeleton from "~/components/HomeSkeleton";
import MatchCard from "~/components/MatchCard";
import Button from "~/components/ui/button";
import { WebSocketProvider, useWebSocketContext } from "~/providers";
import { mergeCommentaries } from "~/utils/commentary";
import { getTodayUtcRange } from "~/utils/date";
import { latestMatchSort } from "~/utils/match";
import { cn } from "~/utils/styling";
import type { Commentary } from "~/.server/db/schema";
import { useCommentaryFetcher } from "./api.commentary";
import {
  type SimulationActionIntent,
  useSimulationFetcher,
} from "./api.simulation";
import type { MatchWithCommentaries } from "~/types";

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const { endOfToday, startOfToday } = getTodayUtcRange();

  const todaysMatches = await db.query.matches.findMany({
    where: (m, { and, gte, lt }) =>
      and(
        gte(m.startTime, new Date(startOfToday)),
        lt(m.startTime, new Date(endOfToday)),
      ),
    with: {
      commentaries: {
        orderBy: (c, { desc }) => [desc(c.elapsedTime)],
      },
    },
  });

  return {
    todaysMatches,
  };
}

export default function Component({
  matches,
  loaderData,
}: Route.ComponentProps) {
  const { clientEnv } = matches[0].loaderData;

  return (
    <ClientOnly fallback={<HomeSkeleton />}>
      {() => (
        <WebSocketProvider url={clientEnv.APP_WSS_URL}>
          <HomePage {...loaderData} />
        </WebSocketProvider>
      )}
    </ClientOnly>
  );
}

function HomePage({ todaysMatches }: Route.ComponentProps["loaderData"]) {
  const [matches, setMatches] =
    useState<MatchWithCommentaries[]>(todaysMatches);

  const hasMatches = matches.length > 0;

  const sortedMatches = useMemo(
    () => [...matches].sort(latestMatchSort),
    [matches],
  );

  const allMatchesFinished = useMemo(() => {
    return matches.every((m) => m.status === "finished") && matches.length > 0;
  }, [matches]);

  const [selectedMatch, setSelectedMatch] =
    useState<MatchWithCommentaries | null>(null);

  const simulationFetcher = useSimulationFetcher();

  const commentaryFetcher = useCommentaryFetcher();

  function handleSimulationSubmit(intent: SimulationActionIntent) {
    setMatches([]);
    setSelectedMatch(null);
    simulationFetcher.submit(intent);
  }

  const { subscribe, isConnected, on } = useWebSocketContext();

  const handleSelectMatch = useCallback(
    async (match: MatchWithCommentaries | null) => {
      if (!match) {
        setSelectedMatch(null);

        return;
      }
      commentaryFetcher.load(match.id);
      setSelectedMatch(match);
    },
    [commentaryFetcher],
  );

  const commentaries = useMemo(() => {
    if (!selectedMatch) return [];

    if (commentaryFetcher.state === "idle" && commentaryFetcher.data?.ok) {
      return mergeCommentaries([
        ...commentaryFetcher.data.data,
        ...selectedMatch.commentaries,
      ]);
    }

    return selectedMatch.commentaries;
  }, [commentaryFetcher, selectedMatch]);

  useEffect(() => {
    const offWelcome = on("welcome", ({ message }) => {
      console.log(`Received welcome message from server:\n'${message}'`);
    });

    const offMatchCreated = on("match.created", (payload) => {
      setMatches((prev) => [{ ...payload, commentaries: [] }, ...prev]);
    });

    const offMatchUpdated = on(
      "match.updated",
      ({ id: updatedId, ...updatedMatch }) => {
        setMatches((prev) => {
          return prev.map((m) =>
            m.id === updatedId ? { ...m, ...updatedMatch } : m,
          );
        });
      },
    );

    const offMatchFinished = on(
      "match.finished",
      ({ id: finishedId, ...finishedMatch }) => {
        setMatches((prev) => {
          return prev.map((m) =>
            m.id === finishedId ? { ...m, ...finishedMatch } : m,
          );
        });
      },
    );

    return () => {
      offWelcome();
      offMatchCreated();
      offMatchUpdated();
      offMatchFinished();
    };
  }, [on]);

  useEffect(() => {
    if (!selectedMatch) return;

    const offCommentaryCreated = on("commentary.created", (payload) => {
      if (selectedMatch.id !== payload.matchId) return;

      setSelectedMatch((prev) => {
        if (!prev) return null;
        if (prev.id !== payload.matchId) return prev;

        return {
          ...prev,
          commentaries: [payload as Commentary, ...prev.commentaries],
        };
      });
    });

    return () => {
      offCommentaryCreated();
    };
  }, [on, selectedMatch]);

  useEffect(
    function subscribeToSelectedMatch() {
      if (!selectedMatch) return;

      return subscribe(selectedMatch.id);
    },
    [selectedMatch, subscribe],
  );

  return (
    <main className="mx-auto w-full max-w-300 px-4 pt-8 min-[1200px]:px-0 md:px-6">
      <header className="animate-slide-down rounded-2xl border-3 border-b-4 border-dark bg-yellow px-5 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[2rem]/[1.2] font-extrabold -tracking-[2px] text-dark md:text-4xl">
              Sportz
            </h1>
            <p className="text-sm font-medium text-dark opacity-70">
              Real-time match data demo
            </p>
          </div>
          <div className="status-badge flex items-center gap-2 rounded-[100px] border-2 border-dark bg-white px-5 py-3 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
            <div
              className={cn(
                "status-dot size-2.5 rounded-full",
                isConnected ? "bg-green-500" : "bg-text-secondary",
              )}
            />
            {isConnected ? "ONLINE" : "OFFLINE"}
          </div>
        </div>
      </header>

      {allMatchesFinished && hasMatches && (
        <div className="py-12">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold -tracking-[1px]">
              All matches have finished
            </h2>

            <Button
              variant="primary"
              onClick={() => handleSimulationSubmit("restart")}
            >
              Start New Matches
            </Button>
          </div>
        </div>
      )}

      {!hasMatches && (
        <div className="py-8">
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold -tracking-[1px]">
              No matches available
            </h2>

            <Button
              variant="primary"
              onClick={() => handleSimulationSubmit("start")}
            >
              Start Simulation
            </Button>
          </div>
        </div>
      )}

      {hasMatches && (
        <div className="grid animate-fade-in grid-cols-1 gap-6 py-2 min-[1200px]:grid-cols-[1fr_420px] md:py-8">
          <div className="matches-section order-2 min-[1200px]:order-1">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[28px] font-bold -tracking-[1px]">
                Current Matches
              </h2>
              <div className="api-badge rounded-[20px] bg-dark px-3.5 py-1.5 font-space-mono text-[13px] font-bold text-white">
                API: {matches.length}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {sortedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  isSelected={selectedMatch?.id === match.id}
                  handleSelect={handleSelectMatch}
                />
              ))}
            </div>
          </div>

          <div className="order-1 min-[1200px]:order-2">
            {selectedMatch ? (
              <CommentaryPanel
                selectedMatch={selectedMatch}
                commentaries={commentaries}
              />
            ) : (
              <EmptyCommentaryPanel />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
