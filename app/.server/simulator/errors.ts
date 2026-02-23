export type SimulationError =
  | { type: "ALREADY_RUNNING" }
  | { type: "MATCHES_EXIST"; count: number }
  | { type: "DB_CLEAR_FAILED"; cause: unknown }
  | { type: "MATCH_CREATION_FAILED"; matchIndex: number; cause: unknown };

export const alreadyRunning = (): SimulationError => ({
  type: "ALREADY_RUNNING",
});

export const matchesExist = (count: number): SimulationError => ({
  type: "MATCHES_EXIST",
  count,
});

export const dbClearFailed = (cause: unknown): SimulationError => ({
  type: "DB_CLEAR_FAILED",
  cause,
});

export const matchCreationFailed = (
  matchIndex: number,
  cause: unknown,
): SimulationError => ({
  type: "MATCH_CREATION_FAILED",
  matchIndex,
  cause,
});
