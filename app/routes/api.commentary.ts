import type { Route } from "./+types/api.commentary";
import { data } from "react-router";
import commentary from "~/.server/db/schema/commentary";
import { requireJson } from "~/utils/api";
import { createCommentarySchema } from "~/validations/commentary";
import { appContext } from "$/server/context";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const raw = await requireJson(request);

  const res = createCommentarySchema.safeParse(raw);

  if (!res.success) {
    return data(
      {
        ok: false,
        errors: res.error.issues,
      },
      { status: 422 },
    );
  }

  const { db } = context.get(appContext);

  const [newCommentary] = await db
    .insert(commentary)
    .values(res.data)
    .returning();

  return data({ ok: true, data: newCommentary }, { status: 201 });
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const allCommentary = await db.query.commentary.findMany();

  return data({ data: allCommentary });
}
