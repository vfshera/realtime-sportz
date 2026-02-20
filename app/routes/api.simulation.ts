import type { Route } from "./+types/api.simulation";
import { data, useFetcher } from "react-router";
import {
  restartSimulation,
  startSimulation,
  stopSimulation,
} from "~/.server/simulator";
import { type ApiError, type ApiSuccess } from "~/utils/api.server";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();

  const intent = form.get("intent");

  try {
    switch (intent) {
      case "start": {
        await startSimulation();
        break;
      }

      case "stop": {
        stopSimulation();
        break;
      }

      case "restart": {
        await restartSimulation();
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
    submit: (intent: "start" | "stop" | "restart") =>
      fetcher.submit({ intent }, { method: "post", action: "/api/simulation" }),
  };
}
