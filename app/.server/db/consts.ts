export const MATCH_STATUS = ["scheduled", "live", "finished"] as const;
export type MatchStatus = (typeof MATCH_STATUS)[number];
