import type { Route } from "./+types/system.simulation";
import { startSimulation, stopSimulation } from "~/.server/simulator";

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();

  const intent = form.get("intent");

  switch (intent) {
    case "start": {
      await startSimulation();
      break;
    }

    case "stop": {
      stopSimulation();
      break;
    }
    default:
      return { ok: false, error: "Invalid intent" };
  }

  return { ok: true };
}
