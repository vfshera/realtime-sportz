export type SimulationState = {
  running: boolean;
  timers: Set<NodeJS.Timeout>;
};

export const simulationState: SimulationState = {
  running: false,
  timers: new Set(),
};
