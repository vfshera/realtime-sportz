import { OVERTIME_DURATION } from "../constants";
import { CommentaryTemplate } from "./base";
import type {
  CommentaryEvent,
  MatchInfo,
  ScoreEvent,
  SportPlayerPool,
} from "../types";

export class BasketballTemplate extends CommentaryTemplate {
  readonly sport = "basketball";
  readonly duration = 48;
  readonly periods = ["Q1", "Q2", "Q3", "Q4"];
  readonly eventTypes = [
    "tipoff",
    "2pt",
    "3pt",
    "free_throw",
    "rebound",
    "assist",
    "steal",
    "block",
    "turnover",
    "timeout",
    "foul",
    "quarter_end",
    "overtime",
    "game_end",
  ];

  readonly overtimeNeeded: boolean;
  readonly overtimeCount: number;

  constructor(
    match: MatchInfo,
    players: SportPlayerPool,
    scoreEvents: ScoreEvent[],
  ) {
    super(match, players, scoreEvents);

    const totalHomeScore = scoreEvents.reduce(
      (sum, e) => sum + e.scoreDelta.home,
      0,
    );

    const totalAwayScore = scoreEvents.reduce(
      (sum, e) => sum + e.scoreDelta.away,
      0,
    );

    this.overtimeNeeded = totalHomeScore === totalAwayScore;
    this.overtimeCount = this.overtimeNeeded
      ? Math.floor(Math.random() * 2) + 1
      : 0;
  }

  get effectiveDuration(): number {
    return 48 + this.overtimeCount * OVERTIME_DURATION;
  }

  protected getPeriodForMinute(minute: number): string {
    if (minute <= 12) return "Q1";
    if (minute <= 24) return "Q2";
    if (minute <= 36) return "Q3";
    if (minute <= 48) return "Q4";

    const otNumber = Math.ceil((minute - 48) / OVERTIME_DURATION);

    return `OT${otNumber}`;
  }

  generate(): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];

    events.push(this.createTipoff());

    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterEvents = this.generateQuarterEvents(quarter);
      events.push(...quarterEvents);

      const quarterScoreEvents = this.getScoreEventsForQuarter(quarter);
      events.push(...this.createScoreEvents(quarterScoreEvents));

      if (quarter < 4) {
        events.push(this.createQuarterEnd(quarter * 12));
      }
    }

    events.push(this.createQuarterEnd(48));

    if (this.overtimeNeeded) {
      for (let ot = 1; ot <= this.overtimeCount; ot++) {
        events.push(
          this.createOvertimeStart(48 + (ot - 1) * OVERTIME_DURATION),
        );

        const otEvents = this.generateOvertimeEvents(ot);
        events.push(...otEvents);

        const otScoreEvents = this.getScoreEventsForOvertime(ot);
        events.push(...this.createScoreEvents(otScoreEvents));

        if (ot < this.overtimeCount || this.hasTieBreaker(ot)) {
          events.push(this.createQuarterEnd(48 + ot * OVERTIME_DURATION));
        }
      }
    }

    events.push(this.createGameEnd(this.effectiveDuration));

    return this.sortByMinute(this.assignSequences(events));
  }

  private createTipoff(): CommentaryEvent {
    const side = Math.random() > 0.5 ? "home" : "away";

    return this.createEvent(0, 1, "tipoff", side);
  }

  private createQuarterEnd(minute: number): CommentaryEvent {
    return this.createEvent(minute, 1, "quarter_end", "home");
  }

  private createOvertimeStart(minute: number): CommentaryEvent {
    return this.createEvent(minute, 1, "overtime", "home");
  }

  private createGameEnd(minute: number): CommentaryEvent {
    return this.createEvent(minute, 1, "game_end", "home");
  }

  private generateQuarterEvents(quarter: number): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];

    const startMinute = (quarter - 1) * 12 + 1;

    const endMinute = quarter * 12;

    const otherEvents = [
      "rebound",
      "assist",
      "steal",
      "block",
      "foul",
      "turnover",
    ];

    const eventCount = Math.floor(Math.random() * 8) + 5;

    const minutes = this.selectRandomMinutes(
      startMinute,
      endMinute,
      eventCount,
    );

    for (const minute of minutes) {
      const eventType =
        otherEvents[Math.floor(Math.random() * otherEvents.length)];

      const side = Math.random() > 0.5 ? "home" : "away";

      events.push(this.createEvent(minute, 0, eventType, side));
    }

    this.addTimeouts(events, startMinute, endMinute);

    return events;
  }

  private generateOvertimeEvents(otNumber: number): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];

    const startMinute = 48 + (otNumber - 1) * OVERTIME_DURATION + 1;

    const endMinute = 48 + otNumber * OVERTIME_DURATION;

    const otherEvents = ["rebound", "assist", "steal", "block", "foul"];

    const eventCount = Math.floor(Math.random() * 3) + 2;

    const minutes = this.selectRandomMinutes(
      startMinute,
      endMinute,
      eventCount,
    );

    for (const minute of minutes) {
      const eventType =
        otherEvents[Math.floor(Math.random() * otherEvents.length)];

      const side = Math.random() > 0.5 ? "home" : "away";

      events.push(this.createEvent(minute, 0, eventType, side));
    }

    return events;
  }

  private addTimeouts(
    events: CommentaryEvent[],
    startMinute: number,
    endMinute: number,
  ): void {
    const timeoutCount = Math.floor(Math.random() * 2);

    for (let i = 0; i < timeoutCount; i++) {
      const minute =
        Math.floor(Math.random() * (endMinute - startMinute)) + startMinute;

      const side = Math.random() > 0.5 ? "home" : "away";

      events.push(this.createEvent(minute, 0, "timeout", side));
    }
  }

  private getScoreEventsForQuarter(quarter: number): ScoreEvent[] {
    const startMinute = (quarter - 1) * 12;

    const endMinute = quarter * 12;

    return this.scoreEvents.filter(
      (e) => e.minute > startMinute && e.minute <= endMinute,
    );
  }

  private getScoreEventsForOvertime(otNumber: number): ScoreEvent[] {
    const startMinute = 48 + (otNumber - 1) * OVERTIME_DURATION;

    const endMinute = 48 + otNumber * OVERTIME_DURATION;

    return this.scoreEvents.filter(
      (e) => e.minute > startMinute && e.minute <= endMinute,
    );
  }

  private createScoreEvents(scoreEvents: ScoreEvent[]): CommentaryEvent[] {
    return scoreEvents.map((se) => {
      const side = se.scoreDelta.home > 0 ? "home" : "away";

      const actor = this.getRandomStartingPlayer(side);

      const points =
        se.scoreDelta.home > 0 ? se.scoreDelta.home : se.scoreDelta.away;

      let eventType: string;

      if (points === 1) {
        eventType = "free_throw";
      } else if (points === 3) {
        eventType = "3pt";
      } else {
        eventType = "2pt";
      }

      return this.createEvent(
        se.minute,
        0,
        eventType,
        side,
        actor,
        se.scoreDelta,
      );
    });
  }

  private selectRandomMinutes(
    start: number,
    end: number,
    count: number,
  ): number[] {
    const minutes: number[] = [];

    const available = Array.from(
      { length: end - start },
      (_, i) => start + i + 1,
    );

    for (let i = 0; i < Math.min(count, available.length); i++) {
      const idx = Math.floor(Math.random() * available.length);
      minutes.push(available.splice(idx, 1)[0]);
    }

    return minutes.sort((a, b) => a - b);
  }

  private hasTieBreaker(otNumber: number): boolean {
    return otNumber < this.overtimeCount;
  }
}
