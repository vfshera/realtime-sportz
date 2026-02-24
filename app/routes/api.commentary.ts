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
import { appContext } from "$/server/context";
import z from "zod";

export async function action({ request, context }: Route.ActionArgs) {
  const { log } = context.get(appContext);

  const url = new URL(request.url);

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const raw = await requireJson(request);

  const res = createCommentarySchema.safeParse(raw);

  if (!res.success) {
    return validationError(z.flattenError(res.error), {
      log,
      context: {
        source: "api",
        route: url.pathname,
        action: "create",
      },
    });
  }

  const result = await commentaryService.create(res.data as NewCommentary);

  return resultToResponse(result, {
    success: 201,
    logging: {
      log,
      context: {
        source: "api",
        route: url.pathname,
        action: "create",
      },
    },
  });
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { log } = context.get(appContext);

  const url = new URL(request.url);

  const result = await commentaryService.findAll();

  return resultToResponse(result, {
    logging: {
      log,
      context: {
        source: "api",
        route: url.pathname,
      },
    },
  });
}
