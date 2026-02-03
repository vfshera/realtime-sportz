import type { Route } from "./+types/api.matches";
import { data } from "react-router";
import matches, { type NewMatch } from "~/.server/db/schema/matches";
import { createMatchSchema } from "~/validations/matches";
import { appContext } from "$/server/context";

export async function action({ request, context }: Route.ActionArgs) {
  const raw = await request.json();
  const res = createMatchSchema.safeParse({
    ...raw,
    startTime: new Date(raw.startTime),
    endTime: new Date(raw.endTime),
  });

  if (!res.success) {
    return data(
      {
        ok: false,
        errors: res.error.issues,
      },
      {
        status: 422,
        statusText: "Validation Error",
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { db } = context.get(appContext);

  const newMatch = await db
    .insert(matches)
    .values(res.data as NewMatch)
    .returning();

  return data({ ok: true, data: newMatch });
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { db } = context.get(appContext);

  const allMatches = await db.query.matches.findMany();
  return data({ data: allMatches, ok: true });
}
