import type { Route } from "./+types/api.matches.$matchId";
import { data } from "react-router";
import matches, { type NewMatch } from "~/.server/db/schema/matches";
import { requireJson } from "~/utils/api";
import {
  fullUpdateMatchSchema,
  updateMatchSchema,
} from "~/validations/matches";
import { appContext } from "$/server/context";
import { eq } from "drizzle-orm";

export async function action({ request, context, params }: Route.ActionArgs) {
  const { db } = context.get(appContext);

  const existingMatch = await db.query.matches.findFirst({
    where: eq(matches.id, params.matchId),
  });

  if (!existingMatch) {
    return data({ ok: false, error: "Match not found" }, { status: 404 });
  }

  if (request.method === "DELETE") {
    await db.delete(matches).where(eq(matches.id, params.matchId));

    return data({ ok: true, data: null });
  }

  if (request.method === "PUT") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = fullUpdateMatchSchema.safeParse({
      ...raw,
      startTime: raw.startTime ? new Date(raw.startTime as string) : undefined,
      endTime: raw.endTime ? new Date(raw.endTime as string) : undefined,
    });

    if (!res.success) {
      return data(
        {
          ok: false,
          error: "Validation failed",
          errors: res.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        { status: 422 },
      );
    }

    const [updated] = await db
      .update(matches)
      .set(res.data as NewMatch)
      .where(eq(matches.id, params.matchId))
      .returning();

    return data({ ok: true, data: updated });
  }

  if (request.method === "PATCH") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = updateMatchSchema.safeParse({
      ...raw,
      startTime: raw.startTime ? new Date(raw.startTime as string) : undefined,
      endTime: raw.endTime ? new Date(raw.endTime as string) : undefined,
    });

    if (!res.success) {
      return data(
        {
          ok: false,
          error: "Validation failed",
          errors: res.error.issues.map((i) => ({
            path: i.path,
            message: i.message,
          })),
        },
        { status: 422 },
      );
    }

    const [updated] = await db
      .update(matches)
      .set(res.data as Partial<NewMatch>)
      .where(eq(matches.id, params.matchId))
      .returning();

    return data({ ok: true, data: updated });
  }

  return data({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, params.matchId),
  });

  if (!match) {
    return data({ ok: false, error: "Match not found" }, { status: 404 });
  }

  return data({ ok: true, data: match });
}
