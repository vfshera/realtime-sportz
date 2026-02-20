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
