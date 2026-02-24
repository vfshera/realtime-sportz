import type { Route } from "./+types/api.matches";
import { matchService } from "~/.server/services";
import {
  methodNotAllowed,
  requireJson,
  resultToResponse,
  validationError,
} from "~/utils/api.server";
import { createMatchSchema } from "~/validations/matches";
import { appContext } from "$/server/context";
import z from "zod";

export async function action({ request, context }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  const { log } = context.get(appContext);

  const url = new URL(request.url);

  const raw = await requireJson<Record<string, unknown>>(request);

  const res = createMatchSchema.safeParse({
    ...raw,
    startTime: new Date(raw.startTime as string),
    endTime: new Date(raw.endTime as string),
  });

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

  const result = await matchService.create(res.data);

  return resultToResponse(result, {
    success: { status: 201 },
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

  const result = await matchService.findAll();

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
