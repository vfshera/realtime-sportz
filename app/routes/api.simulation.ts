import type { Route } from "./+types/api.simulation";
import { useFetcher } from "react-router";
import {
  restartSimulation,
  startSimulation,
  stopSimulation,
} from "~/.server/simulator";

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
        return { ok: false, error: "Invalid intent" };
    }
  } catch (err) {
    return { ok: false, error: String(err) };
  }

  return { ok: true };
}

export function useSimulationFetcher() {
  const fetcher = useFetcher();

  return {
    ...fetcher,
    submit: (intent: "start" | "stop" | "restart") =>
      fetcher.submit({ intent }, { method: "post", action: "/api/simulation" }),
  };
}
