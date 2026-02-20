import type { Route } from "./+types/api.commentary.$commentaryId";
import { data } from "react-router";
import commentary, { type NewCommentary } from "~/.server/db/schema/commentary";
import { requireJson } from "~/utils/api";
import {
  fullUpdateCommentarySchema,
  updateCommentarySchema,
} from "~/validations/commentary";
import { appContext } from "$/server/context";
import { eq } from "drizzle-orm";

export async function action({ request, context, params }: Route.ActionArgs) {
  const { db } = context.get(appContext);

  const existing = await db.query.commentary.findFirst({
    where: eq(commentary.id, params.commentaryId),
  });

  if (!existing) {
    return data({ ok: false, error: "Commentary not found" }, { status: 404 });
  }

  if (request.method === "DELETE") {
    await db.delete(commentary).where(eq(commentary.id, params.commentaryId));

    return data({ ok: true, data: null });
  }

  if (request.method === "PUT") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = fullUpdateCommentarySchema.safeParse(raw);

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
      .update(commentary)
      .set(res.data as NewCommentary)
      .where(eq(commentary.id, params.commentaryId))
      .returning();

    return data({ ok: true, data: updated });
  }

  if (request.method === "PATCH") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = updateCommentarySchema.safeParse(raw);

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
      .update(commentary)
      .set(res.data as Partial<NewCommentary>)
      .where(eq(commentary.id, params.commentaryId))
      .returning();

    return data({ ok: true, data: updated });
  }

  return data({ ok: false, error: "Method not allowed" }, { status: 405 });
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const item = await db.query.commentary.findFirst({
    where: eq(commentary.id, params.commentaryId),
  });

  if (!item) {
    return data({ ok: false, error: "Commentary not found" }, { status: 404 });
  }

  return data({ ok: true, data: item });
}
