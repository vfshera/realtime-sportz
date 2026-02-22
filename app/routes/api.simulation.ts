import type { Route } from "./+types/api.simulation";
import { data, useFetcher } from "react-router";
import { simulation } from "~/.server/simulator";
import type { ApiError, ApiSuccess } from "~/utils/api.server";

type SimulationActionIntent = "start" | "stop" | "restart" | "setSpeed";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();

  const intent = form.get("intent") as SimulationActionIntent;

  try {
    switch (intent) {
      case "start": {
        await simulation.start();
        break;
      }

      case "stop": {
        simulation.stop();
        break;
      }

      case "restart": {
        await simulation.restart();
        break;
      }

      case "setSpeed": {
        const speed = Number(form.get("speed"));

        if (speed > 0) {
          simulation.setSpeed(speed);
        }
        break;
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
  } catch (err) {
    return data<ApiError>(
      {
        ok: false,
        error: {
          code: "SIMULATION_ERROR",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      },
      { status: 500 },
    );
  }

  return data<ApiSuccess<null>>({ ok: true, data: null });
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
