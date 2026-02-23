import type { Route } from "./+types/api.simulation";
import { data, useFetcher } from "react-router";
import { simulation } from "~/.server/simulator";
import type { ApiError, ApiSuccess } from "~/utils/api.server";

type SimulationActionIntent = "start" | "stop" | "restart" | "setSpeed";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();

  const intent = form.get("intent") as SimulationActionIntent | null;

  if (!intent) {
    return data<ApiError>(
      {
        ok: false,
        error: {
          code: "MISSING_INTENT",
          message: "Missing intent",
        },
      },
      { status: 400 },
    );
  }

  switch (intent) {
    case "start": {
      const result = await simulation.start();

      return result.match(
        () => data<ApiSuccess<null>>({ ok: true, data: null }),
        (error) => {
          console.error("Simulation start failed:", error);
          return data<ApiError>(
            {
              ok: false,
              error: {
                code: "INTERNAL_ERROR",
                message: "Internal server error",
              },
            },
            { status: 500 },
          );
        },
      );
    }

    case "stop": {
      simulation.stop();
      return data<ApiSuccess<null>>({ ok: true, data: null });
    }

    case "restart": {
      const result = await simulation.restart();

      return result.match(
        () => data<ApiSuccess<null>>({ ok: true, data: null }),
        (error) => {
          console.error("Simulation restart failed:", error);
          return data<ApiError>(
            {
              ok: false,
              error: {
                code: "INTERNAL_ERROR",
                message: "Internal server error",
              },
            },
            { status: 500 },
          );
        },
      );
    }

    case "setSpeed": {
      const speed = Number(form.get("speed"));

      if (speed > 0) {
        simulation.setSpeed(speed);
      }
      return data<ApiSuccess<null>>({ ok: true, data: null });
    }

    default:
      return data<ApiError>(
        {
          ok: false,
          error: {
            code: "INVALID_INTENT",
            message: "Invalid intent",
          },
        },
        { status: 400 },
      );
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
