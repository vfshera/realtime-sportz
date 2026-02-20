import { data } from "react-router";

/**
 *  Utility function to ensure that the incoming request has a JSON content type.
 *
 * - If the content type is not application/json, it throws a 415 Unsupported Media Type response.
 */
export function requireJson(request: Request) {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    throw data(
      { ok: false, error: "Content-Type must be application/json" },
      { status: 415 },
    );
  }
}
