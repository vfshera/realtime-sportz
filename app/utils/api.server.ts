import { data } from "react-router";
import type { ServiceError } from "~/.server/services";
import type { SimulationError } from "~/.server/simulator";
import type { RequestLogger } from "evlog";
import type { Result } from "neverthrow";

export type LoggingOptions = {
  log: RequestLogger;
  context: Record<string, unknown>;
};

export async function requireJson<T = unknown>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw data(
      { ok: false, error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }

  try {
    return (await request.json()) as T;
  } catch {
    throw data({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }
}

/**
 * JSON API success response
 */
export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

/**
 * JSON API error response
 */
export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/**
 *
 * JSON API method not allowed response
 */
export function methodNotAllowed() {
  return data<ApiError>(
    {
      ok: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: `Method not allowed.`,
      },
    },
    { status: 405 },
  );
}

/**
 * Returns a JSON API error response with a 422 status code.
 *
 * Used to indicate that a validation error has occurred.
 *
 * @param details - The details of the validation error.
 *
 * @returns A JSON API error response.
 */
export function validationError<T = unknown>(
  details: T,
  logging?: LoggingOptions,
) {
  const error = {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details,
  };

  if (logging) {
    const { log, context = {} } = logging;

    log.set({
      ...context,
      error,
      status: 422,
    });
  }

  return data<ApiError>(
    {
      ok: false,
      error,
    },
    { status: 422 },
  );
}

/**
 * Returns a JSON API error response with a 404 status code.
 *
 * Used to indicate that the requested resource could not be found.
 *
 * @param message - The message to be included in the error response.
 * Defaults to "Resource not found".
 *
 * @returns A JSON API error response.
 */
export function notFound(message = "Resource not found") {
  return data<ApiError>(
    {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message,
      },
    },
    { status: 404 },
  );
}

/**
 * Converts a Result to a JSON API response.
 *
 * @param result - The Result to convert.
 * @param options - Optional response options.
 *
 * @returns A JSON API response.
 */
export function resultToResponse<T>(
  result: Result<T, ServiceError | SimulationError>,
  options?: {
    success?: number | ResponseInit;
    logging?: LoggingOptions;
  },
) {
  return result.match(
    (value) => data<ApiSuccess<T>>({ ok: true, data: value }, options?.success),
    (error) => {
      const status = error.type === "NOT_FOUND" ? 404 : 500;

      if (options?.logging) {
        const { log, context = {} } = options.logging;

        log.set({
          ...context,
          error,
          status,
        });
      }

      const message =
        error.type === "NOT_FOUND"
          ? "Resource not found"
          : "Internal server error";

      return data<ApiError>(
        {
          ok: false,
          error: {
            code: error.type,
            message,
          },
        },
        { status },
      );
    },
  );
}
