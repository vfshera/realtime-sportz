import commentary from "~/.server/db/schema/commentary";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const createCommentarySchema = createInsertSchema(commentary);

export const updateCommentarySchema = createCommentarySchema.partial();

export const fullUpdateCommentarySchema = createCommentarySchema.required({
  matchId: true,
  minute: true,
  sequence: true,
  eventType: true,
  message: true,
});

export const findCommentaryOptionsSchema = z.object({
  sortBy: z.enum(["minute", "sequence", "createdAt", "eventType"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type FindCommentaryOptions = z.infer<typeof findCommentaryOptionsSchema>;
