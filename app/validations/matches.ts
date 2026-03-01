import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { MATCH_STATUS, type MatchStatus } from "~/utils/match";
import matches from "~/.server/db/schema/matches";

const baseInsertMatchSchema = createInsertSchema(matches, {
  status: z.enum(
    Object.values(MATCH_STATUS) as [MatchStatus, ...MatchStatus[]],
  ),
});

const validateTimes = (
  data: { startTime?: unknown; endTime?: unknown },
  ctx: z.RefinementCtx,
) => {
  const start =
    data.startTime instanceof Date
      ? data.startTime
      : new Date(data.startTime as string);

  const end =
    data.endTime instanceof Date
      ? data.endTime
      : new Date(data.endTime as string);

  if (
    data.startTime !== undefined &&
    data.endTime !== undefined &&
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
};

export const createMatchSchema =
  baseInsertMatchSchema.superRefine(validateTimes);

export const updateMatchSchema = baseInsertMatchSchema
  .partial()
  .superRefine(validateTimes);

export const fullUpdateMatchSchema = baseInsertMatchSchema
  .required({
    sport: true,
    homeTeam: true,
    awayTeam: true,
    startTime: true,
    endTime: true,
  })
  .superRefine(validateTimes);

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().min(0),
  awayScore: z.coerce.number().int().min(0),
});
