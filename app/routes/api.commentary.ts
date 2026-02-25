import type { Route } from "./+types/api.commentary";
import { useFetcher } from "react-router";
import type { Commentary, NewCommentary } from "~/.server/db/schema/commentary";
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

  const matchId = url.searchParams.get("matchId");

  if (matchId) {
    const result = await commentaryService.findByMatchId(matchId);

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

export function useCommentaryFetcher() {
  const fetcher = useFetcher<Awaited<ReturnType<typeof loader>>>();

  return {
    ...fetcher,
    load: (matchId?: string) => {
      let loadPath = "/api/commentary";

      if (matchId) {
        loadPath += `?matchId=${matchId}`;
      }

      return fetcher.load(loadPath);
    },
  };
}
