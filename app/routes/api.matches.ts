import type { Route } from "./+types/api.matches";
import { data } from "react-router";
import matches, {
  type Match,
  type NewMatch,
} from "~/.server/db/schema/matches";
import {
  type ApiSuccess,
  methodNotAllowed,
  requireJson,
  validationError,
} from "~/utils/api.server";
import { createMatchSchema } from "~/validations/matches";
import { appContext } from "$/server/context";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const raw = await requireJson<Record<string, unknown>>(request);

  const res = createMatchSchema.safeParse({
    ...raw,
    startTime: new Date(raw.startTime as string),
    endTime: new Date(raw.endTime as string),
  });

  if (!res.success) {
    return validationError(
      res.error.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    );
  }

  const { db } = context.get(appContext);

  const [newMatch] = await db
    .insert(matches)
    .values(res.data as NewMatch)
    .returning();

  return data<ApiSuccess<Match>>({ ok: true, data: newMatch }, { status: 201 });
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const allMatches = await db.query.matches.findMany();

  return data<ApiSuccess<Match[]>>({ ok: true, data: allMatches });
}
