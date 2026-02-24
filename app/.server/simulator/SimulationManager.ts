import { getMatches } from "~/data/loader.server";
import { getMatchStatus } from "~/utils/match";
import { db } from "../db";
import { commentary, matches } from "../db/schema";
import { matchService } from "../services";
import { MatchSimulator } from "./MatchSimulator";
import { playerPoolManager } from "./PlayerPoolManager";
import {
  DEFAULT_SPEED_MULTIPLIER,
  MATCH_CREATION_DELAY_MS,
  RESTART_DELAY_MS,
} from "./constants";
import {
  type SimulationError,
  alreadyRunning,
  dbClearFailed,
  matchesExist,
} from "./errors";
import type { ScorePrediction, SimulationStats } from "./types";
import { log } from "$/server/logger";
import { ResultAsync, errAsync } from "neverthrow";
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

  start(): ResultAsync<void, SimulationError> {
    if (this.#running) {
      return errAsync(alreadyRunning());
    }

    return ResultAsync.fromPromise(db.query.matches.findMany(), (e) =>
      dbClearFailed(e),
    ).andThen((existingMatches) => {
      if (existingMatches.length > 0) {
        return errAsync(matchesExist(existingMatches.length));
      }

      this.#running = true;
      playerPoolManager.clearAll();
      this.#predictions.clear();
      this.#matchSimulators.clear();

      return this.simulateMatchCreation();
    });
  }

  stop(): void {
    this.#running = false;
    this.clearTimers();

    for (const simulator of this.#matchSimulators.values()) {
      simulator.stop();
    }

    this.#matchSimulators.clear();
  }

  restart(): ResultAsync<void, SimulationError> {
    this.stop();

    return ResultAsync.fromPromise(
      Promise.all([db.delete(matches), db.delete(commentary)]),
      (e) => dbClearFailed(e),
    )
      .andThen(() =>
        ResultAsync.fromPromise(sleep(RESTART_DELAY_MS), (e) =>
          dbClearFailed(e),
        ),
      )
      .andThen(() => this.start())
      .orElse((error) => {
        log.error({
          source: "SimulationManager",
          action: "restart",
          operation: "clearDatabase",
          error,
        });

        return errAsync(error);
      });
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

  private simulateMatchCreation(): ResultAsync<void, SimulationError> {
    const rawMatches = getMatches();

    return ResultAsync.fromSafePromise(
      this.createMatchesSequentially(rawMatches),
    ).map(() => undefined);
  }

  private async createMatchesSequentially(
    rawMatches: ReturnType<typeof getMatches>,
  ): Promise<void> {
    for (let i = 0; i < rawMatches.length; i++) {
      if (!this.#running) break;

      const raw = rawMatches[i];

      const status = getMatchStatus(raw.startTime, raw.endTime) || "scheduled";

      const result = await matchService.create({
        sport: raw.sport,
        homeTeam: raw.homeTeam,
        awayTeam: raw.awayTeam,
        status,
        startTime: raw.startTime,
        endTime: raw.endTime,
      });

      result.match(
        (match) => {
          const simulator = new MatchSimulator(match, {
            onTimerCreated: (timer) => this.#timers.add(timer),
            onTimerCleared: (timer) => this.#timers.delete(timer),
            getSpeedMultiplier: () => this.#speedMultiplier,
          });

          simulator.initialize();

          this.#predictions.set(match.id, simulator.prediction);
          this.#matchSimulators.set(match.id, simulator);

          simulator.start();
        },
        (error) => {
          log.error({
            source: "SimulationManager",
            action: "createMatch",
            match: {
              index: i,
              sport: raw.sport,
              homeTeam: raw.homeTeam,
              awayTeam: raw.awayTeam,
            },
            error,
          });
        },
      );

      await sleep(MATCH_CREATION_DELAY_MS / this.#speedMultiplier);
    }

    this.#running = false;
  }

  private clearTimers(): void {
    for (const timer of this.#timers) {
      clearTimeout(timer);
    }

    this.#timers.clear();
  }
}

export const simulation = new SimulationManager();
