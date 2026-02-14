import { simulateMatchCreation } from "./runners";
import { simulationState } from "./state";

export function clearSimulationTimers() {
  simulationState.timers.forEach(clearTimeout);
  simulationState.timers.clear();
}

export async function startSimulation() {
  if (simulationState.running) return;

  simulationState.running = true;
  console.log("Simulation started");

  simulateMatchCreation();
}

export function stopSimulation() {
  simulationState.running = false;
  clearSimulationTimers();

  console.log("Simulation stopped");
}
