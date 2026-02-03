import { MATCH_STATUS, type MatchStatus } from "../consts";
import type { DefaultOmit } from "../types";
import { primaryKeyCuid2, timestamps } from "../utils";
import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const matches = sqliteTable(
  "matches",
  {
    id: primaryKeyCuid2,
    sport: text("sport").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    status: text("status").notNull().$type<MatchStatus>().default("scheduled"),
    startTime: integer("start_time", { mode: "timestamp" }).notNull(),
    endTime: integer("end_time", { mode: "timestamp" }),
    homeScore: integer("home_score").notNull().default(0),
    awayScore: integer("away_score").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check(
      "status_check",
      sql`${t.status} in (${sql.raw(MATCH_STATUS.map((s) => `'${s}'`).join(","))})`,
    ),
  ],
);

export type Match = typeof matches.$inferSelect;
export type NewMatch = Omit<typeof matches.$inferInsert, DefaultOmit>;

export default matches;
