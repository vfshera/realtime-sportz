import type { DefaultOmit } from "../types";
import { primaryKeyCuid2, timestamps } from "../utils";
import { matches } from "./matches";
import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const commentary = sqliteTable(
  "commentary",
  {
    id: primaryKeyCuid2,
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    elapsedTime: integer("elapsed_time").notNull(), // elapsed time in seconds
    sequence: integer("sequence").notNull(),
    period: text("period"),
    eventType: text("event_type").notNull(),
    actor: text("actor"),
    team: text("team"),
    message: text("message").notNull(),
    metadata: text("metadata", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'`),
    tags: text("tags"),
    ...timestamps,
  },
  (t) => [
    index("commentary_match_timeline_idx").on(
      t.matchId,
      t.elapsedTime,
      t.sequence,
    ),
  ],
);

export const commentaryRelations = relations(commentary, ({ one }) => ({
  match: one(matches, {
    fields: [commentary.matchId],
    references: [matches.id],
  }),
}));

export type Commentary = typeof commentary.$inferSelect;

export type NewCommentary = Omit<typeof commentary.$inferInsert, DefaultOmit>;

export default commentary;
