import type { Route } from "./+types/api.commentary.$commentaryId";
import { data } from "react-router";
import commentary, {
  type Commentary,
  type NewCommentary,
} from "~/.server/db/schema/commentary";
import {
  type ApiSuccess,
  methodNotAllowed,
  notFound,
  requireJson,
  validationError,
} from "~/utils/api.server";
import {
  fullUpdateCommentarySchema,
  updateCommentarySchema,
} from "~/validations/commentary";
import { appContext } from "$/server/context";
import { eq } from "drizzle-orm";
import z from "zod";

export async function action({ request, context, params }: Route.ActionArgs) {
  const { db } = context.get(appContext);

  const existing = await db.query.commentary.findFirst({
    where: eq(commentary.id, params.commentaryId),
  });

  if (!existing) {
    return notFound("Commentary not found");
  }

  if (request.method === "DELETE") {
    await db.delete(commentary).where(eq(commentary.id, params.commentaryId));

    return data<ApiSuccess<null>>({ ok: true, data: null });
  }

  if (request.method === "PUT") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = fullUpdateCommentarySchema.safeParse(raw);

    if (!res.success) {
      return validationError(z.flattenError(res.error));
    }

    const [updated] = await db
      .update(commentary)
      .set(res.data as NewCommentary)
      .where(eq(commentary.id, params.commentaryId))
      .returning();

    return data<ApiSuccess<Commentary>>({ ok: true, data: updated });
  }

  if (request.method === "PATCH") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = updateCommentarySchema.safeParse(raw);

    if (!res.success) {
      return validationError(z.flattenError(res.error));
    }

    const [updated] = await db
      .update(commentary)
      .set(res.data as Partial<NewCommentary>)
      .where(eq(commentary.id, params.commentaryId))
      .returning();

    return data<ApiSuccess<Commentary>>({ ok: true, data: updated });
  }

  return methodNotAllowed();
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const item = await db.query.commentary.findFirst({
    where: eq(commentary.id, params.commentaryId),
  });

  if (!item) {
    return notFound("Commentary not found");
  }

  return data<ApiSuccess<Commentary>>({ ok: true, data: item });
}
