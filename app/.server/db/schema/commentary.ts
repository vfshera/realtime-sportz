import type { DefaultOmit } from "../types";
import { primaryKeyCuid2, timestamps } from "../utils";
import { matches } from "./matches";
import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const commentary = sqliteTable(
  "commentary",
  {
    id: primaryKeyCuid2,
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    minute: integer("minute").notNull(),
    sequence: integer("sequence").notNull(),
    period: text("period"),
    eventType: text("event_type").notNull(),
    actor: text("actor"),
    team: text("team"),
    message: text("message").notNull(),
    metadata: text("metadata", { mode: "json" }),
    tags: text("tags"),
    ...timestamps,
  },
  (t) => [
    index("commentary_match_timeline_idx").on(t.matchId, t.minute, t.sequence),
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
