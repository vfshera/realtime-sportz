import type { MatchStatus } from "~/utils/match";
import type { Match } from "../db/schema";
import { commentaryService, matchService } from "../services";
import { playerPoolManager } from "./PlayerPoolManager";
import { ScoreDistributor } from "./ScoreDistributor";
import { BASE_DELAY_PER_MINUTE_MS } from "./constants";
import { createTemplate, getTemplateDuration } from "./templates";
import type { CommentaryEvent, MatchInfo, ScorePrediction } from "./types";
import { log } from "$/server/logger";

type SimulationCallbacks = {
  onTimerCreated: (timer: NodeJS.Timeout) => void;
  onTimerCleared: (timer: NodeJS.Timeout) => void;
  getSpeedMultiplier: () => number;
};

export class MatchSimulator {
  readonly #matchId: string;
  readonly #match: MatchInfo;
  readonly #callbacks: SimulationCallbacks;
  readonly #timers: Set<NodeJS.Timeout> = new Set();

  #players: ReturnType<typeof playerPoolManager.getPool> | null = null;
  #scoreDistributor: ScoreDistributor | null = null;
  #events: CommentaryEvent[] = [];
  #currentScore = { home: 0, away: 0 };
  #status: MatchStatus = "scheduled";
  #extraDuration = 0;

  constructor(match: Match, callbacks: SimulationCallbacks) {
    this.#matchId = match.id;
    this.#match = {
      id: match.id,
      sport: match.sport as MatchInfo["sport"],
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startTime: match.startTime,
      endTime: match.endTime,
    };
    this.#callbacks = callbacks;
  }

  get matchId(): string {
    return this.#matchId;
  }

  get prediction(): ScorePrediction {
    return this.#scoreDistributor?.prediction ?? { home: 0, away: 0 };
  }

  initialize(): void {
    this.#players = playerPoolManager.getPool(
      this.#matchId,
      this.#match.sport,
      this.#match.homeTeam,
      this.#match.awayTeam,
    );

    const baseDuration = getTemplateDuration(this.#match.sport);

    if (this.#match.sport === "football") {
      this.#extraDuration = Math.random() * 2.5 + 0.5 + (Math.random() * 6 + 1);
    } else if (this.#match.sport === "basketball") {
      this.#extraDuration = Math.random() > 0.9 ? 5 : 0;
    }

    this.#scoreDistributor = new ScoreDistributor(
      this.#match.sport,
      baseDuration,
      this.#extraDuration,
    );

    const scoreEvents = this.#scoreDistributor.distribute();

    const template = createTemplate(
      this.#match.sport,
      this.#match,
      this.#players,
      scoreEvents,
    );

    this.#events = template.generate();
  }

  start(): void {
    this.scheduleStatusTransition(0, "live");

    for (const event of this.#events) {
      this.scheduleEvent(event);
    }

    const lastEvent = this.#events[this.#events.length - 1];

    const endMinute = lastEvent?.minute ?? 90;

    this.scheduleStatusTransition(endMinute, "finished");
  }

  stop(): void {
    for (const timer of this.#timers) {
      clearTimeout(timer);
      this.#callbacks.onTimerCleared(timer);
    }

    this.#timers.clear();
  }

  private scheduleEvent(event: CommentaryEvent): void {
    const delay = this.calculateDelay(event.minute);

    const timer = setTimeout(() => this.executeEvent(event), delay);
    this.#timers.add(timer);
    this.#callbacks.onTimerCreated(timer);
  }

  private scheduleStatusTransition(
    minute: number,
    status: "live" | "finished",
  ): void {
    const delay = this.calculateDelay(minute);

    const timer = setTimeout(() => this.transitionStatus(status), delay);
    this.#timers.add(timer);
    this.#callbacks.onTimerCreated(timer);
  }

  private calculateDelay(minute: number): number {
    const speed = this.#callbacks.getSpeedMultiplier();

    return (minute * BASE_DELAY_PER_MINUTE_MS) / speed;
  }

  private async executeEvent(event: CommentaryEvent): Promise<void> {
    const result = await commentaryService.create({
      matchId: this.#matchId,
      minute: event.minute,
      sequence: event.sequence,
      period: event.period,
      eventType: event.eventType,
      team: event.team,
      actor: event.actor,
      message: event.message,
      tags: event.tags ? JSON.stringify(event.tags) : null,
      metadata: event.scoreDelta ?? {},
    });

    if (result.isErr()) {
      log.error({
        source: "MatchSimulator",
        action: "executeEvent",
        matchId: this.#matchId,
        sport: this.#match.sport,
        event: { type: event.eventType, minute: event.minute },
        error: result.error,
      });

      return;
    }

    if (event.scoreDelta) {
      await this.updateScore(event.scoreDelta);
    }
  }

  private async updateScore(scoreDelta: {
    home: number;
    away: number;
  }): Promise<void> {
    this.#currentScore.home += scoreDelta.home;
    this.#currentScore.away += scoreDelta.away;

    const result = await matchService.updateScore(this.#matchId, scoreDelta);

    if (result.isErr()) {
      log.error({
        source: "MatchSimulator",
        action: "updateScore",
        matchId: this.#matchId,
        sport: this.#match.sport,
        scoreDelta,
        error: result.error,
      });
    }
  }

  private async transitionStatus(status: "live" | "finished"): Promise<void> {
    this.#status = status;

    if (status === "finished") {
      const result = await matchService.finish(this.#matchId);

      if (result.isErr()) {
        log.error({
          source: "MatchSimulator",
          action: "finishMatch",
          matchId: this.#matchId,
          sport: this.#match.sport,
          error: result.error,
        });
      }
    } else {
      const result = await matchService.updateStatus(this.#matchId, status);

      if (result.isErr()) {
        log.error({
          source: "MatchSimulator",
          action: "updateStatus",
          matchId: this.#matchId,
          sport: this.#match.sport,
          status,
          error: result.error,
        });
      }
    }
  }
}
