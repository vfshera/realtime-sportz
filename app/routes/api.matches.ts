import type { Route } from "./+types/api.matches";
import { data } from "react-router";
import matches, { type NewMatch } from "~/.server/db/schema/matches";
import { requireJson } from "~/utils/api";
import { createMatchSchema } from "~/validations/matches";
import { appContext } from "$/server/context";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return data({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const raw = await requireJson<Record<string, unknown>>(request);

  const res = createMatchSchema.safeParse({
    ...raw,
    startTime: new Date(raw.startTime as string),
    endTime: new Date(raw.endTime as string),
  });

  if (!res.success) {
    return data(
      {
        ok: false,
        errors: res.error.issues,
      },
      {
        status: 422,
      },
    );
  }

  const { db } = context.get(appContext);

  const [newMatch] = await db
    .insert(matches)
    .values(res.data as NewMatch)
    .returning();

  return data({ ok: true, data: newMatch }, { status: 201 });
}

export async function loader({ context }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const allMatches = await db.query.matches.findMany();

  return data({ data: allMatches });
}
