import { db } from "../db";
import type { Match } from "../db/schema";
import { commentary, matches } from "../db/schema";
import { playerPoolManager } from "./PlayerPoolManager";
import { ScoreDistributor } from "./ScoreDistributor";
import { BASE_DELAY_PER_MINUTE_MS } from "./constants";
import { createTemplate, getTemplateDuration } from "./templates";
import type { CommentaryEvent, MatchInfo, ScorePrediction } from "./types";
import { pubsub } from "$/server/websocket/pubsub";
import { eq, sql } from "drizzle-orm";

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
  #status: "scheduled" | "live" | "finished" = "scheduled";
  #extraDuration = 0;

  constructor(match: Match, callbacks: SimulationCallbacks) {
    this.#matchId = match.id;
    this.#match = {
      id: match.id,
      sport: match.sport,
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

  async initialize(): Promise<void> {
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
    try {
      const [entry] = await db
        .insert(commentary)
        .values({
          matchId: this.#matchId,
          minute: event.minute,
          sequence: event.sequence,
          period: event.period,
          eventType: event.eventType,
          team: event.team,
          actor: event.actor,
          message: event.message,
          tags: JSON.stringify(event.tags),
          metadata: event.scoreDelta ?? {},
        })
        .returning();

      if (event.scoreDelta) {
        await this.updateScore(event.scoreDelta);
      }

      pubsub.broadcast(this.#matchId, {
        type: "commentary.created",
        payload: entry,
      });
    } catch (err) {
      console.error("MatchSimulator: Failed to execute event", {
        matchId: this.#matchId,
        event,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async updateScore(scoreDelta: {
    home: number;
    away: number;
  }): Promise<void> {
    this.#currentScore.home += scoreDelta.home;
    this.#currentScore.away += scoreDelta.away;

    await db
      .update(matches)
      .set({
        homeScore: sql`${matches.homeScore} + ${scoreDelta.home}`,
        awayScore: sql`${matches.awayScore} + ${scoreDelta.away}`,
      })
      .where(eq(matches.id, this.#matchId));

    pubsub.broadcast(this.#matchId, {
      type: "match.updated",
      payload: {
        id: this.#matchId,
        status: this.#status,
        homeScore: this.#currentScore.home,
        awayScore: this.#currentScore.away,
      },
    });
  }

  private async transitionStatus(status: "live" | "finished"): Promise<void> {
    this.#status = status;

    await db
      .update(matches)
      .set({ status })
      .where(eq(matches.id, this.#matchId));

    pubsub.broadcast(this.#matchId, {
      type: "match.updated",
      payload: {
        id: this.#matchId,
        status,
        homeScore: this.#currentScore.home,
        awayScore: this.#currentScore.away,
      },
    });

    if (status === "finished") {
      pubsub.broadcast(this.#matchId, {
        type: "match.finished",
        payload: {
          id: this.#matchId,
          homeTeam: this.#match.homeTeam,
          awayTeam: this.#match.awayTeam,
          homeScore: this.#currentScore.home,
          awayScore: this.#currentScore.away,
          sport: this.#match.sport,
        },
      });
    }
  }
}
