import type { Route } from "./+types/api.simulation";
import { data, useFetcher } from "react-router";
import { simulation } from "~/.server/simulator";
import {
  type ApiError,
  type ApiSuccess,
  resultToResponse,
} from "~/utils/api.server";
import { appContext } from "$/server/context";

type SimulationActionIntent = "start" | "stop" | "restart" | "setSpeed";

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();

  const intent = form.get("intent") as SimulationActionIntent | null;

  const { log } = context.get(appContext);

  const url = new URL(request.url);

  if (!intent) {
    const error = {
      code: "MISSING_INTENT",
      message: "Missing intent",
    };

    log.set({
      source: "api",
      route: url.pathname,
      intent,
      action: intent,
      error,
      status: 400,
    });

    return data<ApiError>(
      {
        ok: false,
        error,
      },
      { status: 400 },
    );
  }

  switch (intent) {
    case "start": {
      const result = await simulation.start();

      return resultToResponse(result, {
        logging: {
          log,
          context: {
            source: "api",
            route: url.pathname,
            action: "start",
            intent,
          },
        },
      });
    }

    case "stop": {
      simulation.stop();

      return data<ApiSuccess<null>>({ ok: true, data: null });
    }

    case "restart": {
      const result = await simulation.restart();

      return resultToResponse(result, {
        logging: {
          log,
          context: {
            source: "api",
            route: url.pathname,
            action: "restart",
            intent,
          },
        },
      });
    }

    case "setSpeed": {
      const speed = Number(form.get("speed"));

      if (speed > 0) {
        simulation.setSpeed(speed);
      }

      return data<ApiSuccess<null>>({ ok: true, data: null });
    }

    default: {
      const error = {
        code: "INVALID_INTENT",
        message: "Invalid intent",
      };

      log.set({
        source: "api",
        route: url.pathname,
        action: "invalid_intent",
        error,
        status: 400,
      });

      return data<ApiError>(
        {
          ok: false,
          error,
        },
        { status: 400 },
      );
    }
  }
}

export function useSimulationFetcher() {
  const fetcher = useFetcher<ReturnType<typeof action>>();

  return {
    ...fetcher,
    submit: (intent: SimulationActionIntent, speed?: number) =>
      fetcher.submit(
        intent === "setSpeed" ? { intent, speed: speed ?? 1 } : { intent },
        { method: "post", action: "/api/simulation" },
      ),
  };
}
