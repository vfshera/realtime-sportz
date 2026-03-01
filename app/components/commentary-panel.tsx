import { useMemo } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { collectTeams } from "~/utils/match";
import { cn } from "~/utils/styling";
import type { Commentary } from "~/.server/db/schema";
import type { MatchWithCommentaries } from "~/types";

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
    <div className="commentary-panel sticky top-10 flex max-h-[calc(100vh-180px)] animate-slide-left flex-col overflow-hidden rounded-2xl border-3 border-dark bg-white pb-6 shadow-[8px_8px_0_rgba(0,0,0,0.1)] max-[1200px]:relative max-[1200px]:top-0 max-[1200px]:max-h-150">
      <div className="space-y-4 border-b-2 border-dark bg-blue p-6 pb-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-bold -tracking-[1px]">
            Live Commentary
          </h3>
          {selectedMatch.status === "live" && (
            <div className="live-badge flex items-center gap-2 rounded-[20px] bg-dark px-3.5 py-1.5 text-xs font-bold text-yellow">
              <div className="pulse size-2 animate-pulse rounded-full bg-yellow"></div>
              Real-time
            </div>
          )}
        </div>

        <div className="match-info-box rounded-xl border border-dark bg-white px-4 py-2.5">
          <div className="match-info-sport mb-1 text-[11px] font-bold tracking-[0.5px] text-text-secondary uppercase">
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
                <div className="absolute top-1.5 left-0 size-2.5 rounded-full border border-dark bg-yellow shadow-sm shadow-white" />
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-space-mono text-xs font-bold text-text-secondary">
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
                          "rounded-full border px-2 py-0.5 text-[11px] font-semibold text-text-secondary",
                          i == 2 && "capitalize",
                        )}
                      >
                        {text}
                      </span>
                    ))}
                  {item.eventType && (
                    <span className="rounded-full border border-dark bg-yellow px-2 py-0.5 text-[10px] font-bold tracking-wide text-dark uppercase">
                      {item.eventType}
                    </span>
                  )}
                </div>
                {(item.actor || item.team) && (
                  <div className="mb-2 text-[13px] font-bold text-dark">
                    {item.actor}
                    {item.actor && item.team && " · "}
                    {item.team}
                  </div>
                )}
                <div className="mb-2 rounded-xl rounded-tl-none border border-[#e8e8e8] bg-[#f8f8f8] p-3">
                  <p className="text-sm leading-normal font-semibold text-text">
                    {item.message}
                  </p>
                </div>
                {item.tags && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.tags.split(",").map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.5px] text-text-secondary uppercase"
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
              <p className="animate-pulse text-center text-text-secondary">
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
    <div className="flex h-full max-h-[calc(100vh-180px)] flex-col justify-center rounded-2xl border-3 border-dotted border-dark p-6 md:items-center">
      <div className="max-w-sm md:text-center">
        <div className="flex items-center gap-4 md:contents">
          <div className="flex justify-center md:mb-6">
            <div className="flex size-14 items-center justify-center rounded-full border-2 border-black bg-yellow-300 md:size-16">
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
          <h3 className="text-2xl font-bold text-gray-900 md:mb-3">
            No Match Selected
          </h3>
        </div>
        <p className="leading-normal text-gray-900 max-md:mt-3 md:leading-relaxed md:text-gray-500">
          Select a match from the list to view live commentary and real-time
          updates.
        </p>
      </div>
    </div>
  );
}
