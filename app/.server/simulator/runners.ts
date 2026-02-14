import { getCommentary, getMatches } from "~/data/loader.server";
import { db } from "../db";
import { commentary, matches } from "../db/schema";
import { simulationState } from "./state";
import { pubsub } from "$/server/websocket/pubsub";
import { eq, sql } from "drizzle-orm";
import { setTimeout as sleep } from "node:timers/promises";

export async function simulateMatchCreation() {
  for (const raw of getMatches()) {
    try {
      const [match] = await db
        .insert(matches)
        .values({
          ...raw,
          status: "live",
        })
        .returning();

      pubsub.broadcast(match.id, {
        type: "match.created",
        payload: match,
      });

      await sleep(2000);
    } catch (err) {
      console.error("simulateMatchCreation: failed to insert match", {
        raw,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      // on failure: do not broadcast or sleep, continue with next match
      continue;
    }
  }
}

export function simulateCommentary(dbMatchId: string, rawMatchId: number) {
  const timeline = getCommentary()
    .filter((c) => c.matchId === rawMatchId)
    .sort((a, b) =>
      a.minute === b.minute ? a.sequence - b.sequence : a.minute - b.minute,
    );

  for (const event of timeline) {
    const delay = event.minute * 1000; // 1 minute = 1 second

    const { scoreDelta } = event;

    const timer = setTimeout(async () => {
      const [entry] = await db
        .insert(commentary)
        .values({
          matchId: dbMatchId,
          minute: event.minute,
          sequence: event.sequence,
          period: event.period,
          eventType: event.eventType,
          team: event.team,
          actor: event.actor,
          message: event.message,
          tags: JSON.stringify(event.tags),
          metadata: scoreDelta ? JSON.stringify({ scoreDelta }) : undefined,
        })
        .returning();

      // Apply score change if goal
      if (scoreDelta) {
        await db
          .update(matches)
          .set({
            homeScore: sql`${matches.homeScore} + ${scoreDelta.home}`,
            awayScore: sql`${matches.awayScore} + ${scoreDelta.away}`,
          })
          .where(eq(matches.id, dbMatchId));
      }

      pubsub.broadcast(dbMatchId, {
        type: "commentary.created",
        payload: entry,
      });
    }, delay);

    simulationState.timers.add(timer);
  }
}
