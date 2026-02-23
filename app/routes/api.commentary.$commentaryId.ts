import type { Route } from "./+types/api.commentary.$commentaryId";
import type { NewCommentary } from "~/.server/db/schema/commentary";
import { commentaryService } from "~/.server/services";
import {
  methodNotAllowed,
  requireJson,
  resultToResponse,
  validationError,
} from "~/utils/api.server";
import {
  fullUpdateCommentarySchema,
  updateCommentarySchema,
} from "~/validations/commentary";
import z from "zod";

export async function action({ request, params }: Route.ActionArgs) {
  if (request.method === "DELETE") {
    const result = await commentaryService.delete(params.commentaryId);

    return resultToResponse(result);
  }

  if (request.method === "PUT") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = fullUpdateCommentarySchema.safeParse(raw);

    if (!res.success) {
      return validationError(z.flattenError(res.error));
    }

    const result = await commentaryService.update(
      params.commentaryId,
      res.data as NewCommentary,
    );

    return resultToResponse(result);
  }

  if (request.method === "PATCH") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = updateCommentarySchema.safeParse(raw);

    if (!res.success) {
      return validationError(z.flattenError(res.error));
    }

    const result = await commentaryService.update(
      params.commentaryId,
      res.data as Partial<NewCommentary>,
    );

    return resultToResponse(result);
  }

  return methodNotAllowed();
}

export async function loader({ params }: Route.LoaderArgs) {
  const result = await commentaryService.findById(params.commentaryId);

  return resultToResponse(result);
}
