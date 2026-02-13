import type { Route } from "./+types/_index";
import { type CSSProperties, useEffect, useState } from "react";
import Button from "~/components/ui/button";
import { WebSocketProvider, useWebSocketContext } from "~/providers";
import { cn } from "~/utils/styling";
import { ClientOnly } from "remix-utils/client-only";

const MATCHES = [
  {
    id: 1,
    sport: "CRICKET",
    status: "Finished",
    teams: [
      { name: "South Africa", score: 162 },
      { name: "New Zealand", score: 200 },
    ],
    time: "13:53",
    hasRecap: true,
    hasClose: true,
  },
  {
    id: 2,
    sport: "FOOTBALL",
    status: "Finished",
    teams: [
      { name: "AC Milan", score: 146 },
      { name: "Inter Milan", score: 114 },
    ],
    time: "13:53",
    hasRecap: true,
    hasClose: false,
  },
  {
    id: 3,
    sport: "BASKETBALL",
    status: "Finished",
    teams: [
      { name: "LA Lakers", score: 263 },
      { name: "Boston Celtics", score: 263 },
    ],
    time: "13:18",
    hasRecap: true,
    hasClose: false,
  },
  {
    id: 4,
    sport: "CRICKET",
    status: "Finished",
    teams: [
      { name: "England", score: 336 },
      { name: "Pakistan", score: 400 },
    ],
    time: "13:18",
    hasRecap: true,
    hasClose: false,
  },
  {
    id: 5,
    sport: "CRICKET",
    status: "Finished",
    teams: [
      { name: "India", score: 331 },
      { name: "Australia", score: 400 },
    ],
    time: "13:18",
    hasRecap: true,
    hasClose: false,
  },
  {
    id: 6,
    sport: "FOOTBALL",
    status: "Finished",
    teams: [
      { name: "Real Madrid", score: 294 },
      { name: "Barcelona", score: 230 },
    ],
    time: "13:18",
    hasRecap: true,
    hasClose: false,
  },
];

type Match = (typeof MATCHES)[number];

const COMMENTARY_ITEMS = [
  {
    id: 1,
    time: "14:14:32",
    over: "118°",
    seq: "Seq 758",
    innings: "2nd innings",
    type: "SIX",
    typeClass: "bg-yellow-300 text-gray-900",
    player: "Ben Stokes",
    team: "New Zealand",
    text: "Smashed straight down the ground for six. (New Zealand)",
    detail: "SIX",
  },
  {
    id: 2,
    time: "14:14:30",
    over: "117°",
    seq: "Seq 757",
    innings: "2nd innings",
    type: "FOUR",
    typeClass: "bg-yellow-100 text-gray-900",
    player: "Pat Cummins",
    team: "New Zealand",
    text: "Cracking cover drive for four. (New Zealand)",
    detail: "BOUNDARY",
  },
  {
    id: 3,
    time: "14:14:29",
    over: "116°",
    seq: "Seq 756",
    innings: "2nd innings",
    type: "RUN",
    typeClass: "bg-green-100 text-green-800",
    player: "Mitchell Starc",
    team: "New Zealand",
    text: "Quick single taken into the gap. (New Zealand)",
    detail: "RUN",
  },
  {
    id: 4,
    time: "14:14:27",
    over: "115°",
    seq: "Seq 755",
    innings: "2nd innings",
    type: "START",
    typeClass: "bg-purple-100 text-purple-800",
    player: "Shubman Gill",
    team: "New Zealand",
    text: "The innings begins with the openers walking out. (New Zealand)",
    detail: "START",
  },
];

export default function Index({ matches }: Route.ComponentProps) {
  const { clientEnv } = matches[0].loaderData;

  return (
    <ClientOnly fallback={<Skeleton />}>
      {() => (
        <WebSocketProvider url={clientEnv.APP_WSS_URL}>
          <HomePage />
        </WebSocketProvider>
      )}
    </ClientOnly>
  );
}

function HomePage() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const { subscribe, unsubscribe, isConnected, on } = useWebSocketContext();

  useEffect(() => {
    const cleanup = on("welcome", (payload) => {
      console.log(`Received welcome message from server: '${payload}'`);
    });

    return cleanup;
  }, [on]);

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

      <div className="animate-fade-in grid grid-cols-1 gap-6 py-8 min-[1200px]:grid-cols-[1fr_420px]">
        <div className="matches-section">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[28px] font-bold -tracking-[1px]">
              Current Matches
            </h2>
            <div className="api-badge bg-dark font-space-mono rounded-[20px] px-3.5 py-1.5 text-[13px] font-bold text-white">
              API: {MATCHES.length}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {MATCHES.map((match, i) => (
              <div
                key={match.id}
                className="match-card animate-slide-up border-dark rounded-2xl border-3 bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.1)] transition-all delay-(--delay,0.1s) duration-300 ease-linear hover:-translate-y-1 hover:shadow-[12px_12px_0_rgba(0,0,0,0.15)] md:p-6"
                style={{ "--delay": `${i * 0.1}s` } as CSSProperties}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="sport-tag border-dark rounded-[20px] border-2 bg-white px-3 py-1 text-[11px] font-bold tracking-[0.5px] uppercase">
                    {match.sport}
                  </div>
                  <div className="match-status text-text-secondary text-[13px] font-semibold">
                    {match.status}
                  </div>
                </div>
                <div className="teams mb-6 divide-y-2 divide-[#f0f0f0]">
                  {match.teams.map((team) => (
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
                    {match.time}
                  </div>
                  <div className="match-actions flex gap-3">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setSelectedMatch(match);
                        subscribe(match.id);
                      }}
                    >
                      View Recap
                    </Button>
                    {selectedMatch?.id === match.id && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          unsubscribe(match.id);
                          setSelectedMatch(null);
                        }}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  {selectedMatch.teams.map((t) => t.name).join(" vs ")}
                </div>
              </div>

              <div className="commentary-feed flex-1 overflow-y-auto pr-3">
                {COMMENTARY_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className="commentary-item animate-slide-in-comment mb-4"
                  >
                    <div className="text-text-secondary mb-2 flex items-center gap-3">
                      <div className="commentary-time font-space-mono text-xs font-bold">
                        {item.time}
                      </div>
                      <div className="commentary-over text-[11px] font-semibold">
                        {item.over}
                      </div>
                      <div className="commentary-inning text-[11px] font-semibold">
                        {item.innings}
                      </div>
                      <div className="commentary-type type-six rounded-md px-2.5 py-1 text-[10px] font-extrabold tracking-[0.5px] uppercase">
                        {item.type}
                      </div>
                    </div>
                    <div className="commentary-player text-dark mb-1 text-[13px] font-bold">
                      {item.player} · {item.team}
                    </div>
                    <div className="commentary-text text-text text-sm leading-normal">
                      {item.text}
                    </div>
                    <span className="commentary-detail text-text-secondary mt-2 block text-[11px] font-semibold tracking-[0.5px] uppercase">
                      {item.detail}
                    </span>
                  </div>
                ))}
              </div>
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
    </main>
  );
}

export function Skeleton() {
  return (
    <main className="mx-auto w-full max-w-300 animate-pulse pt-8">
      {/* Header */}
      <header className="rounded-2xl border-3 border-b-4 border-black bg-yellow-300 px-5 py-7 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 h-8 w-40 rounded bg-yellow-200" />
            <div className="h-4 w-60 rounded bg-yellow-200" />
          </div>
          <div className="h-10 w-28 rounded-full bg-yellow-200" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 py-8 min-[1200px]:grid-cols-[1fr_420px]">
        {/* Left Column - Matches */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div className="h-7 w-56 rounded bg-gray-200" />
            <div className="h-6 w-14 rounded-full bg-gray-200" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border-3 border-black bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.1)] md:p-6"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="h-5 w-20 rounded-full bg-gray-200" />
                  <div className="h-4 w-16 rounded bg-gray-200" />
                </div>

                <div className="mb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-32 rounded bg-gray-200" />
                    <div className="h-10 w-16 rounded-xl bg-gray-200" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-5 w-28 rounded bg-gray-200" />
                    <div className="h-10 w-16 rounded-xl bg-gray-200" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="h-4 w-12 rounded bg-gray-200" />
                  <div className="h-8 w-28 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Commentary Panel */}
        <div className="rounded-2xl border-3 border-dotted border-black p-6">
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-6 h-16 w-16 rounded-full bg-gray-200" />
            <div className="mb-3 h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </main>
  );
}
