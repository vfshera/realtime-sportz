import { pubsub } from "$/server/websocket/pubsub";
import { eq, sql } from "drizzle-orm";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { db } from "../db";
import { matches } from "../db/schema";
import { type ServiceError, databaseError, notFound } from "./errors";
import type { Match, NewMatch } from "../db/schema/matches";
import type { MatchStatus } from "~/utils/match";

export class MatchService {
  create(data: NewMatch): ResultAsync<Match, ServiceError> {
    return ResultAsync.fromPromise(
      db.insert(matches).values(data).returning(),
      (e) => databaseError(e instanceof Error ? e.message : String(e)),
    ).andThen(([match]) => {
      pubsub.broadcastToAll({ type: "match.created", payload: match });

      return okAsync(match);
    });
  }

  findById(
    id: string,
    withCommentaries?: boolean,
  ): ResultAsync<Match, ServiceError> {
    return ResultAsync.fromPromise(
      db.query.matches.findFirst({
        where: eq(matches.id, id),
        with: withCommentaries ? { commentaries: true } : undefined,
      }),
      (e) => databaseError(e instanceof Error ? e.message : String(e)),
    ).andThen((match) =>
      match ? okAsync(match) : errAsync(notFound("Match", id)),
    );
  }

  findAll(): ResultAsync<Match[], ServiceError> {
    return ResultAsync.fromPromise(db.query.matches.findMany(), (e) =>
      databaseError(e instanceof Error ? e.message : String(e)),
    );
  }

  update(
    id: string,
    data: Partial<NewMatch>,
  ): ResultAsync<Match, ServiceError> {
    return this.findById(id).andThen(() =>
      ResultAsync.fromPromise(
        db.update(matches).set(data).where(eq(matches.id, id)).returning(),
        (e) => databaseError(e instanceof Error ? e.message : String(e)),
      ).andThen(([match]) => {
        pubsub.broadcastToAll({
          type: "match.updated",
          payload: {
            id: match.id,
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          },
        });

        return okAsync(match);
      }),
    );
  }

  updateScore(
    id: string,
    delta: { home: number; away: number },
  ): ResultAsync<Match, ServiceError> {
    return this.findById(id).andThen(() =>
      ResultAsync.fromPromise(
        db
          .update(matches)
          .set({
            homeScore: sql`${matches.homeScore} + ${delta.home}`,
            awayScore: sql`${matches.awayScore} + ${delta.away}`,
          })
          .where(eq(matches.id, id))
          .returning(),
        (e) => databaseError(e instanceof Error ? e.message : String(e)),
      ).andThen(([match]) => {
        pubsub.broadcastToAll({
          type: "match.updated",
          payload: {
            id: match.id,
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          },
        });

        return okAsync(match);
      }),
    );
  }

  updateStatus(
    id: string,
    status: MatchStatus,
  ): ResultAsync<Match, ServiceError> {
    return this.findById(id).andThen(() =>
      ResultAsync.fromPromise(
        db
          .update(matches)
          .set({ status })
          .where(eq(matches.id, id))
          .returning(),
        (e) => databaseError(e instanceof Error ? e.message : String(e)),
      ).andThen(([match]) => {
        pubsub.broadcastToAll({
          type: "match.updated",
          payload: {
            id: match.id,
            status: match.status,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          },
        });

        return okAsync(match);
      }),
    );
  }

  finish(id: string): ResultAsync<Match, ServiceError> {
    return this.updateStatus(id, "finished").andThen((match) => {
      pubsub.broadcastToAll({
        type: "match.finished",
        payload: {
          id: match.id,
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
        },
      });

      return okAsync(match);
    });
  }

  delete(id: string): ResultAsync<null, ServiceError> {
    return this.findById(id).andThen(() =>
      ResultAsync.fromPromise(
        db.delete(matches).where(eq(matches.id, id)),
        (e) => databaseError(e instanceof Error ? e.message : String(e)),
      ).map(() => null),
    );
  }
}

export const matchService = new MatchService();
