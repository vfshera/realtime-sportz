import type { Route } from "./+types/_index";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Commentary, Match } from "~/.server/db/schema";
import HomeSkeleton from "~/components/HomeSkeleton";
import Button from "~/components/ui/button";
import { WebSocketProvider, useWebSocketContext } from "~/providers";
import { getTodayUtcRange } from "~/utils/date";
import { collectTeams } from "~/utils/match";
import { cn } from "~/utils/styling";
import {
  type SimulationActionIntent,
  useSimulationFetcher,
} from "./api.simulation";
import { appContext } from "$/server/context";
import { ClientOnly } from "remix-utils/client-only";

type MatchWithCommentaries = Match & { commentaries: Commentary[] };

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
      commentaries: true,
    },
  });

  return {
    todaysMatches,
  };
}

export default function Index({ matches, loaderData }: Route.ComponentProps) {
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

  const [commentaries, setCommentaries] = useState<Commentary[] | null>(null);

  const hasMatches = matches.length > 0;

  const allMatchesFinished = useMemo(() => {
    return matches.every((m) => m.status === "finished") && matches.length > 0;
  }, [matches]);

  const [selectedMatch, setSelectedMatch] =
    useState<MatchWithCommentaries | null>(null);

  const simulationFetcher = useSimulationFetcher();

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
      setSelectedMatch(match);
    },
    [],
  );

  useEffect(() => {
    const offWelcome = on("welcome", ({ message }) => {
      console.log(`Received welcome message from server:\n'${message}'`);
    });

    const offCommentaryCreated = on("commentary.created", (payload) => {
      setCommentaries((prev) => {
        if (!prev) return [payload as Commentary];

        return [...prev, payload as Commentary];
      });
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
            m.id === finishedId
              ? { ...m, ...finishedMatch, status: "finished" }
              : m,
          );
        });
      },
    );

    return () => {
      offWelcome();
      offMatchCreated();
      offMatchUpdated();
      offMatchFinished();
      offCommentaryCreated();
    };
  }, [on]);

  useEffect(
    function subscribeToSelectedMatch() {
      if (!selectedMatch) return;

      return subscribe(selectedMatch.id);
    },
    [selectedMatch, subscribe],
  );

  const getMatchButtonLabel = useCallback(
    (match: MatchWithCommentaries) => {
      const isSelected = selectedMatch?.id === match.id;

      if (match.status === "finished") {
        return isSelected ? "Viewing Recap" : "View Recap";
      }

      return isSelected ? "Watching Live" : "Watch Live";
    },
    [selectedMatch],
  );

  return (
    <main className="mx-auto w-full max-w-300 pt-8">
      <header className="bg-yellow border-dark animate-slide-down rounded-2xl border-3 border-b-4 px-5 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-dark text-[2rem] font-extrabold -tracking-[2px] md:text-4xl">
              Sportz
            </h1>
            <p className="text-dark text-sm font-medium opacity-70">
              Real-time match data demo
            </p>
          </div>
          <div className="status-badge border-dark flex items-center gap-2 rounded-[100px] border-2 bg-white px-5 py-3 text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
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
        <div className="animate-fade-in grid grid-cols-1 gap-6 py-8 min-[1200px]:grid-cols-[1fr_420px]">
          <div className="matches-section">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[28px] font-bold -tracking-[1px]">
                Current Matches
              </h2>
              <div className="api-badge bg-dark font-space-mono rounded-[20px] px-3.5 py-1.5 text-[13px] font-bold text-white">
                API: {matches.length}
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              {matches.map((match, i) => {
                const teams = collectTeams(match);

                return (
                  <div
                    key={match.id}
                    className="match-card animate-slide-up border-dark rounded-2xl border-3 bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.1)] transition-all delay-(--delay,0.1s) duration-300 ease-linear hover:-translate-y-1 hover:shadow-[12px_12px_0_rgba(0,0,0,0.15)] md:p-6"
                    style={{ "--delay": `${i * 0.1}s` } as CSSProperties}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="sport-tag border-dark rounded-[20px] border-2 bg-white px-3 py-1 text-[11px] font-bold tracking-[0.5px] uppercase">
                        {match.sport}
                      </div>
                      <div className="match-status text-text-secondary text-[13px] font-semibold capitalize">
                        {match.status}
                      </div>
                    </div>

                    <div className="teams mb-6 divide-y-2 divide-[#f0f0f0]">
                      {teams.map((team) => (
                        <div
                          className="team-row flex items-center justify-between py-3"
                          key={team.name}
                        >
                          <div className="team-name text-base font-bold -tracking-[0.5px] md:text-xl">
                            {team.name}
                          </div>
                          <div className="score font-space-mono border-dark min-w-15 rounded-xl border-2 bg-white px-5 py-1.5 text-center text-2xl font-extrabold max-md:px-4 md:min-w-20 md:py-2 md:text-[2rem]">
                            {team.score}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt5 flex items-center justify-between border-t-2 border-[#f0f0f0] pt-5">
                      <div className="match-time text-text-secondary font-space-mono text-[13px] font-semibold">
                        {match.startTime.toLocaleTimeString()}
                      </div>
                      <div className="match-actions flex gap-3">
                        <Button
                          variant="primary"
                          disabled={match.status === "scheduled"}
                          onClick={() => {
                            handleSelectMatch(match);
                          }}
                        >
                          {getMatchButtonLabel(match)}
                        </Button>
                        {selectedMatch?.id === match.id && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              handleSelectMatch(null);
                            }}
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            {selectedMatch ? (
              <div className="commentary-panel animate-slide-left bg-blue border-dark sticky top-10 flex max-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-2xl border-3 p-6 shadow-[8px_8px_0_rgba(0,0,0,0.1)] max-[1200px]:relative max-[1200px]:top-0 max-[1200px]:max-h-150">
                <div className="mb-5 flex items-baseline justify-between">
                  <h3 className="text-2xl font-bold -tracking-[1px]">
                    Live Commentary
                  </h3>
                  <div className="live-badge bg-dark text-yellow flex items-center gap-2 rounded-[20px] px-3.5 py-1.5 text-xs font-bold">
                    <div className="pulse bg-yellow size-2 animate-pulse rounded-full"></div>
                    Real-time
                  </div>
                </div>

                <div className="match-info-box border-dark mb-5 rounded-xl border-2 bg-white p-4">
                  <div className="match-info-sport text-text-secondary mb-1 text-[11px] font-bold tracking-[0.5px] uppercase">
                    {selectedMatch.sport}
                  </div>
                  <div className="match-info-teams text-sm font-semibold">
                    {collectTeams(selectedMatch)
                      .map((t) => t.name)
                      .join(" vs ")}
                  </div>
                </div>

                {!!commentaries && (
                  <div className="commentary-feed flex-1 overflow-y-auto pr-2">
                    <div className="relative">
                      <div className="absolute top-0 bottom-0 left-[5px] w-[2px] bg-[#e0e0e0]" />
                      {commentaries.map((item, index) => (
                        <div
                          key={item.id}
                          className="commentary-item animate-slide-in-comment relative mb-6 pl-6"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="bg-dark absolute top-1.5 left-0 size-3 rounded-full border-2 border-white shadow-sm" />
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="font-space-mono text-text-secondary text-xs font-bold">
                              {new Date(item.createdAt).toLocaleTimeString(
                                "en-US",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: true,
                                },
                              )}
                            </span>
                            {item.minute && (
                              <span className="text-text-secondary text-[11px] font-semibold">
                                {item.minute}'
                              </span>
                            )}
                            {item.sequence && (
                              <span className="text-text-secondary text-[11px] font-semibold">
                                Seq {item.sequence}
                              </span>
                            )}
                            {item.period && (
                              <span className="text-text-secondary text-[11px] font-semibold capitalize">
                                {item.period}
                              </span>
                            )}
                            {item.eventType && (
                              <span className="bg-yellow text-dark rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
                                {item.eventType}
                              </span>
                            )}
                          </div>
                          {(item.actor || item.team) && (
                            <div className="text-dark mb-2 text-[13px] font-bold">
                              {item.actor}
                              {item.actor && item.team && " · "}
                              {item.team}
                            </div>
                          )}
                          <div className="mb-2 rounded-xl border border-[#e8e8e8] bg-[#f8f8f8] p-3">
                            <p className="text-text text-sm leading-normal">
                              {item.message}
                            </p>
                          </div>
                          {item.tags && (
                            <span className="text-text-secondary mt-1 block text-[11px] font-semibold tracking-[0.5px] uppercase">
                              {item.tags}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-dark flex h-full max-h-[calc(100vh-180px)] flex-col items-center justify-center rounded-2xl border-3 border-dotted p-6">
                <div className="max-w-sm text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-yellow-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        strokeWidth={2}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-8 text-gray-900"
                      >
                        <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                        <rect x="2" y="6" width="14" height="12" rx="2" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-gray-900">
                    No Match Selected
                  </h3>
                  <p className="leading-relaxed text-gray-500">
                    Select a match from the list to view live commentary and
                    real-time updates.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
