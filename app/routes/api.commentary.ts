import type { Route } from "./+types/api.commentary";
import type { NewCommentary } from "~/.server/db/schema/commentary";
import { commentaryService } from "~/.server/services";
import {
  methodNotAllowed,
  requireJson,
  resultToResponse,
  validationError,
} from "~/utils/api.server";
import { createCommentarySchema } from "~/validations/commentary";
import z from "zod";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const raw = await requireJson(request);

  const res = createCommentarySchema.safeParse(raw);

  if (!res.success) {
    return validationError(z.flattenError(res.error));
  }

  const result = await commentaryService.create(res.data as NewCommentary);

  return resultToResponse(result, { success: 201 });
}

export async function loader() {
  const result = await commentaryService.findAll();

  return resultToResponse(result);
}
