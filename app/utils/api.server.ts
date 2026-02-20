import { data } from "react-router";

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
export function validationError<T = unknown>(details: T) {
  return data<ApiError>(
    {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
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
