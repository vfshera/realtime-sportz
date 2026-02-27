import { z } from "zod";

/**
 * ISO date string -> Date
 */
const isoStringToDate = z.iso
  .datetime()
  .transform((s) => new Date(s))
  .refine((d) => !Number.isNaN(d.getTime()), {
    message: "Invalid ISO date",
  });

const nullableText = z.string().nullable().optional();

export const matchPayloadSchema = z.object({
  id: z.string().min(1),
  sport: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number().int().nonnegative(),
  awayScore: z.number().int().nonnegative(),
  status: z.enum(["scheduled", "live", "finished"]),
  startTime: isoStringToDate,
  endTime: isoStringToDate,
  createdAt: isoStringToDate,
  updatedAt: isoStringToDate,
});

export const matchUpdatedPayloadSchema = matchPayloadSchema.pick({
  id: true,
  status: true,
  homeScore: true,
  awayScore: true,
});

export const matchFinishedPayloadSchema = matchPayloadSchema.pick({
  id: true,
  homeScore: true,
  awayScore: true,
});

export const commentaryPayloadSchema = z.object({
  id: z.string().min(1),
  matchId: z.string().min(1),
  elapsedTime: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative(),
  period: nullableText,
  eventType: z.string(),
  actor: nullableText,
  team: nullableText,
  message: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  tags: nullableText,
  createdAt: isoStringToDate,
  updatedAt: isoStringToDate,
});

export const welcomePayloadSchema = z.object({ message: z.string() });

export const errorPayloadSchema = z.object({
  message: z.string(),
  details: z.unknown().optional(),
});

export type ErrorPayload = z.infer<typeof errorPayloadSchema>;

/**
 * Union of all possible messages that can be sent from server to client.
 *
 * - use this to validate server messages on client.
 */
export const serverMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("welcome"),
    payload: welcomePayloadSchema,
  }),
  z.object({
    type: z.literal("match.created"),
    payload: matchPayloadSchema,
  }),
  z.object({
    type: z.literal("match.updated"),
    payload: matchUpdatedPayloadSchema,
  }),
  z.object({
    type: z.literal("match.finished"),
    payload: matchFinishedPayloadSchema,
  }),
  z.object({
    type: z.literal("commentary.created"),
    payload: commentaryPayloadSchema,
  }),
  z.object({
    type: z.literal("error"),
    payload: errorPayloadSchema,
  }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;

/**
 * Union of all possible messages that can be sent from client to server.
 *
 * - use this to validate client messages on server.
 */
export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("subscribe"),
    payload: z.object({ matchId: z.string() }),
  }),
  z.object({
    type: z.literal("unsubscribe"),
    payload: z.object({ matchId: z.string() }),
  }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;
