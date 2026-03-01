import type { Route } from "./+types/api.simulation";
import { data, useFetcher } from "react-router";
import { appContext } from "$/server/context";
import { simulation } from "~/.server/simulator";
import type { ApiError, ApiSuccess } from "~/utils/api.server";

export type SimulationActionIntent = "start" | "stop" | "restart" | "setSpeed";

export async function action({ request, context }: Route.ActionArgs) {
  const form = await request.formData();

  const intent = form.get("intent") as SimulationActionIntent | null;

  const { db, log } = context.get(appContext);

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
      if (simulation.running) {
        const error = {
          code: "SIMULATION_RUNNING",
          message: "Simulation is already running",
        };

        log.set({
          source: "api",
          route: url.pathname,
          action: "start",
          intent,
          error,
          status: 409,
        });

        return data<ApiError>(
          {
            ok: false,
            error,
          },
          { status: 409 },
        );
      }

      const existingMatches = await db.query.matches.findMany();

      if (existingMatches.length > 0) {
        void simulation.restart();

        return data<ApiSuccess<{ initiated: true; message: string }>>(
          {
            ok: true,
            data: {
              initiated: true,
              message: "Restart initiated - matches will appear shortly",
            },
          },
          { status: 202 },
        );
      }

      void simulation.start();

      return data<ApiSuccess<{ initiated: true; message: string }>>(
        {
          ok: true,
          data: {
            initiated: true,
            message: "Simulation started",
          },
        },
        { status: 202 },
      );
    }

    case "stop": {
      simulation.stop();

      return data<ApiSuccess<null>>({ ok: true, data: null });
    }

    case "restart": {
      if (simulation.running) {
        const error = {
          code: "SIMULATION_RUNNING",
          message: "Simulation is already running",
        };

        log.set({
          source: "api",
          route: url.pathname,
          action: "restart",
          intent,
          error,
          status: 409,
        });

        return data<ApiError>(
          {
            ok: false,
            error,
          },
          { status: 409 },
        );
      }

      void simulation.restart();

      return data<ApiSuccess<{ initiated: true; message: string }>>(
        {
          ok: true,
          data: {
            initiated: true,
            message: "Restart initiated - matches will appear shortly",
          },
        },
        { status: 202 },
      );
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
  const fetcher = useFetcher<typeof action>();

  return {
    ...fetcher,
    submit: (intent: SimulationActionIntent, speed?: number) =>
      fetcher.submit(
        intent === "setSpeed" ? { intent, speed: speed ?? 1 } : { intent },
        { method: "post", action: "/api/simulation" },
      ),
  };
}
