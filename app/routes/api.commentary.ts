import type { Route } from "./+types/api.commentary";
import { data } from "react-router";
import commentary, { type Commentary } from "~/.server/db/schema/commentary";
import {
  type ApiSuccess,
  methodNotAllowed,
  requireJson,
  validationError,
} from "~/utils/api.server";
import { createCommentarySchema } from "~/validations/commentary";
import { appContext } from "$/server/context";
import z from "zod";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const raw = await requireJson(request);

  const res = createCommentarySchema.safeParse(raw);

  if (!res.success) {
    return validationError(z.flattenError(res.error));
  }

  const { db } = context.get(appContext);

  const [newCommentary] = await db
    .insert(commentary)
    .values(res.data)
    .returning();

  return data<ApiSuccess<Commentary>>(
    { ok: true, data: newCommentary },
    { status: 201 },
  );
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const allCommentary = await db.query.commentary.findMany();

  return data<ApiSuccess<Commentary[]>>({ ok: true, data: allCommentary });
}
