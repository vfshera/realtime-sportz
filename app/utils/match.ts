import type { Match } from "~/.server/db/schema/matches";

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
} as const;

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export function getMatchStatus(
  startTime: Date,
  endTime: Date,
  now = new Date(),
): MatchStatus | null {
  const start = new Date(startTime);

  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= end) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

export async function syncMatchStatus(
  match: Match,
  updateStatus: (status: MatchStatus) => Promise<void>,
) {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);

  if (!nextStatus) {
    return match.status;
  }

  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }

  return match.status;
}

/**
 * Given a match, returns an array of two objects containing the home team name and score, and the away team name and score.
 * @param {Match} match - The match object.
 * @returns {Array<{name: string, score: number}>} - An array of two objects containing the team name and score for both home and away teams.
 */
export function collectTeams(match: Match) {
  return [
    { name: match.homeTeam, score: match.homeScore },
    { name: match.awayTeam, score: match.awayScore },
  ];
}