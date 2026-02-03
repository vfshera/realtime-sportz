import matches from "~/.server/db/schema/matches";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Schema for creating a match
 */
export const createMatchSchema = createInsertSchema(matches).superRefine(
  (data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end <= start
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "endTime must be after startTime",
      });
    }
  },
);

/**
 * Schema for updating match scores
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});
