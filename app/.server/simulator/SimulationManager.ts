import { getMatches } from "~/data/loader.server";
import { getMatchStatus } from "~/utils/match";
import { db } from "../db";
import { commentary, matches } from "../db/schema";
import { MatchSimulator } from "./MatchSimulator";
import { playerPoolManager } from "./PlayerPoolManager";
import { DEFAULT_SPEED_MULTIPLIER, MATCH_CREATION_DELAY_MS } from "./constants";
import type { ScorePrediction, SimulationStats } from "./types";
import { pubsub } from "$/server/websocket/pubsub";
import { setTimeout as sleep } from "node:timers/promises";

export class SimulationManager {
  #running = false;
  #speedMultiplier = DEFAULT_SPEED_MULTIPLIER;
  #timers: Set<NodeJS.Timeout> = new Set();
  #predictions: Map<string, ScorePrediction> = new Map();
  #matchSimulators: Map<string, MatchSimulator> = new Map();

  get running(): boolean {
    return this.#running;
  }

  get speed(): number {
    return this.#speedMultiplier;
  }

  async start(): Promise<void> {
    if (this.#running) return;

    this.#running = true;
    playerPoolManager.clearAll();
    this.#predictions.clear();
    this.#matchSimulators.clear();

    await this.simulateMatchCreation();
  }

  stop(): void {
    this.#running = false;
    this.clearTimers();

    for (const simulator of this.#matchSimulators.values()) {
      simulator.stop();
    }

    this.#matchSimulators.clear();
  }

  async restart(): Promise<void> {
    this.stop();
    await db.delete(matches);
    await db.delete(commentary);
    await this.start();
  }

  setSpeed(speed: number): void {
    if (speed > 0) {
      this.#speedMultiplier = speed;
    }
  }

  getStats(): SimulationStats {
    return {
      running: this.#running,
      speed: this.#speedMultiplier,
      activeMatches: this.#matchSimulators.size,
    };
  }

  getPrediction(matchId: string): ScorePrediction | undefined {
    return this.#predictions.get(matchId);
  }

  private async simulateMatchCreation(): Promise<void> {
    const rawMatches = getMatches();

    for (const raw of rawMatches) {
      if (!this.#running) break;

      try {
        const status =
          getMatchStatus(raw.startTime, raw.endTime) || "scheduled";

        const [match] = await db
          .insert(matches)
          .values({
            sport: raw.sport,
            homeTeam: raw.homeTeam,
            awayTeam: raw.awayTeam,
            status,
            startTime: raw.startTime,
            endTime: raw.endTime,
          })
          .returning();

        const simulator = new MatchSimulator(match, {
          onTimerCreated: (timer) => this.#timers.add(timer),
          onTimerCleared: (timer) => this.#timers.delete(timer),
          getSpeedMultiplier: () => this.#speedMultiplier,
        });

        await simulator.initialize();

        this.#predictions.set(match.id, simulator.prediction);
        this.#matchSimulators.set(match.id, simulator);

        pubsub.broadcast(match.id, {
          type: "match.created",
          payload: match,
        });

        simulator.start();

        await sleep(MATCH_CREATION_DELAY_MS / this.#speedMultiplier);
      } catch (err) {
        console.error("SimulationManager: Failed to create match", {
          raw,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  private clearTimers(): void {
    for (const timer of this.#timers) {
      clearTimeout(timer);
    }

    this.#timers.clear();
  }
}

export const simulation = new SimulationManager();
