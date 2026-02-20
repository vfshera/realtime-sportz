import commentary from "~/.server/db/schema/commentary";
import { createInsertSchema } from "drizzle-zod";

export const createCommentarySchema = createInsertSchema(commentary);

export const updateCommentarySchema = createCommentarySchema.partial();

export const fullUpdateCommentarySchema = createCommentarySchema.required({
  matchId: true,
  minute: true,
  sequence: true,
  eventType: true,
  message: true,
});
