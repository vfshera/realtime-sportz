import { pubsub } from "$/server/websocket/pubsub";
import { eq } from "drizzle-orm";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { db } from "../db";
import { commentary } from "../db/schema";
import { type ServiceError, databaseError, notFound } from "./errors";
import type { Commentary, NewCommentary } from "../db/schema/commentary";
import type { FindCommentaryOptions } from "~/validations/commentary";

export class CommentaryService {
  create(data: NewCommentary): ResultAsync<Commentary, ServiceError> {
    return ResultAsync.fromPromise(
      db.insert(commentary).values(data).returning(),
      (e) => databaseError(e instanceof Error ? e.message : String(e)),
    ).andThen(([entry]) => {
      pubsub.broadcast(data.matchId, {
        type: "commentary.created",
        payload: entry,
      });

      return okAsync(entry);
    });
  }

  findById(id: string): ResultAsync<Commentary, ServiceError> {
    return ResultAsync.fromPromise(
      db.query.commentary.findFirst({ where: eq(commentary.id, id) }),
      (e) => databaseError(e instanceof Error ? e.message : String(e)),
    ).andThen((entry) =>
      entry ? okAsync(entry) : errAsync(notFound("Commentary", id)),
    );
  }

  findByMatchId(
    matchId: string,
    options?: FindCommentaryOptions,
  ): ResultAsync<Commentary[], ServiceError> {
    return ResultAsync.fromPromise(
      db.query.commentary.findMany({
        where: eq(commentary.matchId, matchId),
        orderBy: (t, { asc: ascOp, desc: descOp }) => {
          const orderFn = options?.order === "asc" ? ascOp : descOp;

          const sortFieldMap = {
            createdAt: t.createdAt,
            eventType: t.eventType,
            sequence: t.sequence,
            elapsedTime: t.elapsedTime,
          } as const;

          const sortField = options?.sortBy
            ? sortFieldMap[options.sortBy]
            : null;

          if (sortField) {
            return [orderFn(sortField)];
          }

          return [orderFn(t.elapsedTime)];
        },
      }),
      (e) => databaseError(e instanceof Error ? e.message : String(e)),
    );
  }

  findAll(): ResultAsync<Commentary[], ServiceError> {
    return ResultAsync.fromPromise(db.query.commentary.findMany(), (e) =>
      databaseError(e instanceof Error ? e.message : String(e)),
    );
  }

  update(
    id: string,
    data: Partial<NewCommentary>,
  ): ResultAsync<Commentary, ServiceError> {
    return this.findById(id).andThen(() =>
      ResultAsync.fromPromise(
        db
          .update(commentary)
          .set(data)
          .where(eq(commentary.id, id))
          .returning(),
        (e) => databaseError(e instanceof Error ? e.message : String(e)),
      ).andThen(([entry]) => okAsync(entry)),
    );
  }

  delete(id: string): ResultAsync<null, ServiceError> {
    return this.findById(id).andThen(() =>
      ResultAsync.fromPromise(
        db.delete(commentary).where(eq(commentary.id, id)),
        (e) => databaseError(e instanceof Error ? e.message : String(e)),
      ).map(() => null),
    );
  }
}

export const commentaryService = new CommentaryService();
