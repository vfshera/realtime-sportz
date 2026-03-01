import type { Route } from "./+types/api.commentary.$commentaryId";
import { appContext } from "$/server/context";
import z from "zod";
import {
  fullUpdateCommentarySchema,
  updateCommentarySchema,
} from "~/validations/commentary";
import type { NewCommentary } from "~/.server/db/schema/commentary";
import { commentaryService } from "~/.server/services";
import {
  methodNotAllowed,
  requireJson,
  resultToResponse,
  validationError,
} from "~/utils/api.server";

export async function action({ request, params, context }: Route.ActionArgs) {
  const { log } = context.get(appContext);

  const url = new URL(request.url);

  if (request.method === "DELETE") {
    const result = await commentaryService.delete(params.commentaryId);

    return resultToResponse(result, {
      logging: {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "delete",
          commentaryId: params.commentaryId,
        },
      },
    });
  }

  if (request.method === "PUT") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = fullUpdateCommentarySchema.safeParse(raw);

    if (!res.success) {
      return validationError(z.flattenError(res.error), {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          commentaryId: params.commentaryId,
        },
      });
    }

    const result = await commentaryService.update(
      params.commentaryId,
      res.data as NewCommentary,
    );

    return resultToResponse(result, {
      logging: {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          commentaryId: params.commentaryId,
        },
      },
    });
  }

  if (request.method === "PATCH") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = updateCommentarySchema.safeParse(raw);

    if (!res.success) {
      return validationError(z.flattenError(res.error), {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          commentaryId: params.commentaryId,
        },
      });
    }

    const result = await commentaryService.update(
      params.commentaryId,
      res.data as Partial<NewCommentary>,
    );

    return resultToResponse(result, {
      logging: {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          commentaryId: params.commentaryId,
        },
      },
    });
  }

  return methodNotAllowed();
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { log } = context.get(appContext);

  const url = new URL(request.url);

  const result = await commentaryService.findById(params.commentaryId);

  return resultToResponse(result, {
    logging: {
      log,
      context: {
        source: "api",
        route: url.pathname,
        commentaryId: params.commentaryId,
      },
    },
  });
}
