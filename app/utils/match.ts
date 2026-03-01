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
 * @param  match - The match object.
 * @returns teams  - An array of two objects containing the team name and score for both home and away teams.
 */
export function collectTeams(match: Match) {
  return [
    { name: match.homeTeam, score: match.homeScore },
    { name: match.awayTeam, score: match.awayScore },
  ];
}

const statusOrder: Record<MatchStatus, number> = {
  live: 0,
  scheduled: 1,
  finished: 2,
};

/**
 * Sorts matches with the following priority:
 * 1. Primary: Status (live → scheduled → finished)
 * 2. Secondary: Start time or end time depending on status:
 *    - live: Start time descending (most recent first)
 *    - scheduled: Start time ascending (earliest first)
 *    - finished: End time descending (most recently finished first)
 *
 * @param a - First match to compare
 * @param z - Second match to compare
 * @returns Negative if a should come before z
 */
export function latestMatchSort<T extends Match = Match>(a: T, z: T): number {
  const sameStatus = a.status === z.status;

  if (a.status === "finished" && sameStatus) {
    return z.endTime.getTime() - a.endTime.getTime();
  }

  if (a.status === "live" && sameStatus) {
    return z.startTime.getTime() - a.startTime.getTime();
  }

  if (a.status === "scheduled" && sameStatus) {
    return a.startTime.getTime() - z.startTime.getTime();
  }

  return statusOrder[a.status] - statusOrder[z.status];
}
