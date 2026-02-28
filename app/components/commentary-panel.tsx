import { useMemo } from "react";
import type { Commentary } from "~/.server/db/schema";
import type { MatchWithCommentaries } from "~/types";
import { collectTeams } from "~/utils/match";
import { cn } from "~/utils/styling";
import { useAutoAnimate } from "@formkit/auto-animate/react";

export interface CommentaryPanelProps {
  selectedMatch: MatchWithCommentaries;
  commentaries: Commentary[];
}

export function CommentaryPanel({
  selectedMatch,
  commentaries,
}: CommentaryPanelProps) {
  const hasFirstCommentary = useMemo(() => {
    return Boolean(commentaries.find((c) => c.elapsedTime === 0));
  }, [commentaries]);

  const [listParent] = useAutoAnimate({ duration: 400 });

  return (
    <div className="commentary-panel animate-slide-left border-dark sticky top-10 flex max-h-[calc(100vh-180px)] flex-col overflow-hidden rounded-2xl border-3 bg-white pb-6 shadow-[8px_8px_0_rgba(0,0,0,0.1)] max-[1200px]:relative max-[1200px]:top-0 max-[1200px]:max-h-150">
      <div className="bg-blue border-dark space-y-4 border-b-2 p-6 pb-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-bold -tracking-[1px]">
            Live Commentary
          </h3>
          {selectedMatch.status === "live" && (
            <div className="live-badge bg-dark text-yellow flex items-center gap-2 rounded-[20px] px-3.5 py-1.5 text-xs font-bold">
              <div className="pulse bg-yellow size-2 animate-pulse rounded-full"></div>
              Real-time
            </div>
          )}
        </div>

        <div className="match-info-box border-dark rounded-xl border bg-white px-4 py-2.5">
          <div className="match-info-sport text-text-secondary mb-1 text-[11px] font-bold tracking-[0.5px] uppercase">
            {selectedMatch.sport}
          </div>
          <div className="match-info-teams text-sm font-semibold">
            {collectTeams(selectedMatch)
              .map((t) => t.name)
              .join(" vs ")}
          </div>
        </div>
      </div>

      {!!commentaries && (
        <div className="commentary-feed mt-2 mr-2 flex-1 overflow-y-auto bg-white p-6">
          <div ref={listParent} className="space-y-6">
            {commentaries.map((item) => (
              <div key={item.id} className="commentary-item relative pl-6">
                <div className="absolute top-5 bottom-0 left-[5px] w-[1.5px] bg-linear-to-b from-[#e0e0e0] to-transparent" />
                <div className="bg-yellow border-dark absolute top-1.5 left-0 size-2.5 rounded-full border shadow-sm shadow-white" />
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-space-mono text-text-secondary text-xs font-bold">
                    {new Date(item.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </span>

                  {[
                    `${Math.floor(item.elapsedTime / 60)}'`,
                    `Seq ${item.sequence}`,
                    item.period,
                  ]
                    .filter(Boolean)
                    .map((text, i) => (
                      <span
                        key={i}
                        className={cn(
                          "text-text-secondary rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          i == 2 && "capitalize",
                        )}
                      >
                        {text}
                      </span>
                    ))}
                  {item.eventType && (
                    <span className="bg-yellow text-dark border-dark rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase">
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
                <div className="mb-2 rounded-xl rounded-tl-none border border-[#e8e8e8] bg-[#f8f8f8] p-3">
                  <p className="text-text text-sm leading-normal font-semibold">
                    {item.message}
                  </p>
                </div>
                {item.tags && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.tags.split(",").map((tag) => (
                      <span
                        key={tag}
                        className="text-text-secondary rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.5px] uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {!hasFirstCommentary && (
            <div className="mt-2 pt-3">
              <p className="text-text-secondary animate-pulse text-center">
                ... loading full feed ...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EmptyCommentaryPanel() {
  return (
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
          Select a match from the list to view live commentary and real-time
          updates.
        </p>
      </div>
    </div>
  );
}
