import type { Route } from "./+types/api.commentary";
import { useFetcher } from "react-router";
import { appContext } from "$/server/context";
import z from "zod";
import {
  type FindCommentaryOptions,
  createCommentarySchema,
  findCommentaryOptionsSchema,
} from "~/validations/commentary";
import type { NewCommentary } from "~/.server/db/schema/commentary";
import { commentaryService } from "~/.server/services/commentary.service";
import {
  methodNotAllowed,
  requireJson,
  resultToResponse,
  validationError,
} from "~/utils/api.server";

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
    const parseResult = findCommentaryOptionsSchema.safeParse({
      sortBy: url.searchParams.get("sortBy") || undefined,
      order: url.searchParams.get("order") || undefined,
    });

    const options: FindCommentaryOptions | undefined = parseResult.success
      ? parseResult.data
      : undefined;

    const result = await commentaryService.findByMatchId(matchId, options);

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
  const fetcher = useFetcher<typeof loader>();

  return {
    ...fetcher,
    load: (matchId?: string, options?: FindCommentaryOptions) => {
      const params = new URLSearchParams();

      if (matchId) {
        params.set("matchId", matchId);
      }

      if (options?.sortBy) {
        params.set("sortBy", options.sortBy);
      }

      if (options?.order) {
        params.set("order", options.order);
      }

      const queryString = params.toString();

      const loadPath = queryString
        ? `/api/commentary?${queryString}`
        : "/api/commentary";

      return fetcher.load(loadPath);
    },
  };
}
