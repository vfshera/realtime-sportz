import type { Commentary, Match } from "~/.server/db/schema";

export type MatchWithCommentaries = Match & { commentaries: Commentary[] };
