import type { Route } from "./+types/api.matches.$matchId";
import type { NewMatch } from "~/.server/db/schema/matches";
import { matchService } from "~/.server/services";
import {
  methodNotAllowed,
  requireJson,
  resultToResponse,
  validationError,
} from "~/utils/api.server";
import {
  fullUpdateMatchSchema,
  updateMatchSchema,
} from "~/validations/matches";
import { appContext } from "$/server/context";
import z from "zod";

export async function action({ request, params, context }: Route.ActionArgs) {
  const { log } = context.get(appContext);

  const url = new URL(request.url);

  if (request.method === "DELETE") {
    const result = await matchService.delete(params.matchId);

    return resultToResponse(result, {
      logging: {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "delete",
          matchId: params.matchId,
        },
      },
    });
  }

  if (request.method === "PUT") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = fullUpdateMatchSchema.safeParse({
      ...raw,
      startTime: raw.startTime ? new Date(raw.startTime as string) : undefined,
      endTime: raw.endTime ? new Date(raw.endTime as string) : undefined,
    });

    if (!res.success) {
      return validationError(z.flattenError(res.error), {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          matchId: params.matchId,
        },
      });
    }

    const result = await matchService.update(
      params.matchId,
      res.data as NewMatch,
    );

    return resultToResponse(result, {
      logging: {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          matchId: params.matchId,
        },
      },
    });
  }

  if (request.method === "PATCH") {
    const raw = await requireJson<Record<string, unknown>>(request);

    const res = updateMatchSchema.safeParse({
      ...raw,
      startTime: raw.startTime ? new Date(raw.startTime as string) : undefined,
      endTime: raw.endTime ? new Date(raw.endTime as string) : undefined,
    });

    if (!res.success) {
      return validationError(z.flattenError(res.error), {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          matchId: params.matchId,
        },
      });
    }

    const result = await matchService.update(
      params.matchId,
      res.data as Partial<NewMatch>,
    );

    return resultToResponse(result, {
      logging: {
        log,
        context: {
          source: "api",
          route: url.pathname,
          action: "update",
          method: request.method,
          matchId: params.matchId,
        },
      },
    });
  }

  return methodNotAllowed();
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const { log } = context.get(appContext);

  const url = new URL(request.url);

  const result = await matchService.findById(params.matchId);

  return resultToResponse(result, {
    logging: {
      log,
      context: {
        source: "api",
        route: url.pathname,
        matchId: params.matchId,
      },
    },
  });
}
