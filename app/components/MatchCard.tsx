import type { CSSProperties } from "react";
import Button from "~/components/ui/button";
import type { MatchWithCommentaries } from "~/types";
import { collectTeams } from "~/utils/match";
import { cn } from "~/utils/styling";

type MatchCardProps = {
  match: MatchWithCommentaries;
  isSelected: boolean;
  handleSelect: (match: MatchWithCommentaries | null) => void;
  index: number;
};

export default function MatchCard({
  match,
  isSelected,
  handleSelect,
  index,
}: MatchCardProps) {
  const teams = collectTeams(match);

  const getButtonLabel = () => {
    if (match.status === "finished") {
      return isSelected ? "Viewing Recap" : "View Recap";
    }

    return isSelected ? "Watching Live" : "Watch Live";
  };

  const isLive = match.status === "live";

  return (
    <div
      className="match-card animate-slide-up border-dark rounded-2xl border-3 bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.1)] transition-all delay-(--delay,0.1s) duration-300 ease-linear hover:-translate-y-1 hover:shadow-[12px_12px_0_rgba(0,0,0,0.15)] md:p-6"
      style={{ "--delay": `${index * 0.1}s` } as CSSProperties}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="sport-tag border-dark rounded-[20px] border-2 bg-white px-3 py-1 text-[11px] font-bold tracking-[0.5px] uppercase">
          {match.sport}
        </div>
        <div
          className={cn(
            "match-status text-[13px] font-semibold capitalize",
            isLive
              ? "flex items-center gap-2 text-green-500"
              : "text-text-secondary",
          )}
        >
          {isLive && (
            <span className="size-2 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full bg-current" />
          )}
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
          {match.startTime.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
        </div>
        <div className="match-actions flex gap-3">
          <Button
            variant="primary"
            disabled={match.status === "scheduled"}
            className={cn(isSelected && "bg-blue")}
            onClick={() => {
              handleSelect(match);
            }}
          >
            {getButtonLabel()}
          </Button>
          {isSelected && (
            <Button
              variant="secondary"
              onClick={() => {
                handleSelect(null);
              }}
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
