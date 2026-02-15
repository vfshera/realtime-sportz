import { db } from "../db";
import { commentary, matches } from "../db/schema";
import { simulateMatchCreation } from "./runners";
import { simulationState } from "./state";

export function clearSimulationTimers() {
  simulationState.timers.forEach(clearTimeout);
  simulationState.timers.clear();
}

export async function startSimulation() {
  if (simulationState.running) return;

  simulationState.running = true;

  await simulateMatchCreation();
}

export function stopSimulation() {
  simulationState.running = false;
  clearSimulationTimers();
}

export async function restartSimulation() {
  stopSimulation();
  await db.delete(matches);
  await db.delete(commentary);
  await startSimulation();
}
