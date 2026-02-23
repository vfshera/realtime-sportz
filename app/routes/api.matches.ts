import type { Route } from "./+types/api.matches";
import type { Match } from "~/.server/db/schema/matches";
import { matchService } from "~/.server/services";
import {
  methodNotAllowed,
  requireJson,
  resultToResponse,
  validationError,
} from "~/utils/api.server";
import { createMatchSchema } from "~/validations/matches";
import z from "zod";

export async function action({ request }: Route.ActionArgs) {
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
    return validationError(z.flattenError(res.error));
  }

  const result = await matchService.create(res.data);

  return resultToResponse(result, { success: 201 });
}

export async function loader() {
  const result = await matchService.findAll();

  return resultToResponse(result);
}
