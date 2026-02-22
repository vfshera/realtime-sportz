import { EXTRA_TIME_RANGES } from "../constants";
import type {
  CommentaryEvent,
  FootballExtraTime,
  MatchInfo,
  ScoreEvent,
  SportPlayerPool,
} from "../types";
import { CommentaryTemplate } from "./base";

export class FootballTemplate extends CommentaryTemplate {
  readonly sport = "football";
  readonly duration = 90;
  readonly periods = ["1st half", "2nd half"];
  readonly eventTypes = [
    "kickoff",
    "goal",
    "shot",
    "save",
    "foul",
    "yellow_card",
    "red_card",
    "substitution",
    "corner",
    "free_kick",
    "penalty",
    "var",
    "halftime",
    "fulltime",
  ];

  readonly extraTime: FootballExtraTime;

  constructor(
    match: MatchInfo,
    players: SportPlayerPool,
    scoreEvents: ScoreEvent[],
  ) {
    super(match, players, scoreEvents);
    this.extraTime = this.generateExtraTime();
  }

  private generateExtraTime(): FootballExtraTime {
    const { firstHalf, secondHalf } = EXTRA_TIME_RANGES.football;

    return {
      firstHalf:
        Math.random() * (firstHalf.max - firstHalf.min) + firstHalf.min,
      secondHalf:
        Math.random() * (secondHalf.max - secondHalf.min) + secondHalf.min,
    };
  }

  get effectiveDuration(): number {
    return 90 + this.extraTime.firstHalf + this.extraTime.secondHalf;
  }

  protected getPeriodForMinute(minute: number): string {
    const halftimeEnd = 45 + this.extraTime.firstHalf;

    if (minute <= halftimeEnd) {
      return "1st half";
    }

    return "2nd half";
  }

  generate(): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];

    events.push(this.createKickoff());

    const firstHalfEvents = this.generateHalfEvents(1, 45, "home");
    events.push(...firstHalfEvents);

    const firstHalfScoreEvents = this.scoreEvents.filter(
      (e) => e.minute <= 45 + this.extraTime.firstHalf,
    );
    events.push(...this.createScoreEvents(firstHalfScoreEvents));

    if (this.extraTime.firstHalf > 0) {
      events.push(
        this.createExtraTimeAnnouncement(
          45,
          "1st half",
          this.extraTime.firstHalf,
        ),
      );
    }

    events.push(this.createHalftime());

    const secondHalfEvents = this.generateHalfEvents(
      46,
      90,
      this.getSecondHalfStartSide(),
    );
    events.push(...secondHalfEvents);

    const secondHalfScoreEvents = this.scoreEvents.filter(
      (e) => e.minute > 45 + this.extraTime.firstHalf,
    );
    events.push(...this.createScoreEvents(secondHalfScoreEvents));

    if (this.extraTime.secondHalf > 0) {
      events.push(
        this.createExtraTimeAnnouncement(
          90,
          "2nd half",
          this.extraTime.secondHalf,
        ),
      );
    }

    events.push(this.createFulltime());

    return this.sortByMinute(this.assignSequences(events));
  }

  private createKickoff(): CommentaryEvent {
    return this.createEvent(0, 1, "kickoff", "home");
  }

  private createHalftime(): CommentaryEvent {
    const minute = Math.ceil(45 + this.extraTime.firstHalf);

    return this.createEvent(minute, 1, "halftime", "home");
  }

  private createFulltime(): CommentaryEvent {
    const minute = Math.ceil(90 + this.extraTime.secondHalf);

    return this.createEvent(minute, 1, "fulltime", "home");
  }

  private createExtraTimeAnnouncement(
    minute: number,
    period: string,
    extraMinutes: number,
  ): CommentaryEvent {
    return {
      minute,
      sequence: 0,
      period,
      eventType: "extra_time",
      team: null,
      actor: null,
      message: `${Math.ceil(extraMinutes)} minutes of added time announced.`,
      tags: ["extra_time"],
    };
  }

  private generateHalfEvents(
    startMinute: number,
    endMinute: number,
    dominantSide: "home" | "away",
  ): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];

    const nonScoringEvents = ["shot", "save", "foul", "corner", "free_kick"];

    const minutesWithEvents = this.selectRandomMinutes(
      startMinute,
      endMinute,
      Math.floor((endMinute - startMinute) / 3),
    );

    for (const minute of minutesWithEvents) {
      const eventType =
        nonScoringEvents[Math.floor(Math.random() * nonScoringEvents.length)];

      const side =
        Math.random() > 0.5 ? dominantSide : this.opposite(dominantSide);

      events.push(this.createEvent(minute, 0, eventType, side));
    }

    this.addCards(events, startMinute, endMinute);
    this.addSubstitutions(events, startMinute, endMinute);

    return events;
  }

  private addCards(
    events: CommentaryEvent[],
    startMinute: number,
    endMinute: number,
  ): void {
    const yellowCards = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < yellowCards; i++) {
      const minute =
        Math.floor(Math.random() * (endMinute - startMinute)) + startMinute;

      const side = Math.random() > 0.5 ? "home" : "away";

      events.push(this.createEvent(minute, 0, "yellow_card", side));
    }

    if (Math.random() > 0.8) {
      const minute =
        Math.floor(Math.random() * (endMinute - startMinute)) + startMinute;

      const side = Math.random() > 0.5 ? "home" : "away";

      events.push(this.createEvent(minute, 0, "red_card", side));
    }
  }

  private addSubstitutions(
    events: CommentaryEvent[],
    startMinute: number,
    endMinute: number,
  ): void {
    const subMinutes = this.selectRandomMinutes(
      Math.max(startMinute, endMinute - 30),
      endMinute,
      Math.floor(Math.random() * 3) + 1,
    );

    for (const minute of subMinutes) {
      const side = Math.random() > 0.5 ? "home" : "away";

      const actor = this.getRandomPlayer(side);

      events.push(this.createEvent(minute, 0, "substitution", side, actor));
    }
  }

  private createScoreEvents(scoreEvents: ScoreEvent[]): CommentaryEvent[] {
    return scoreEvents.map((se) => {
      const side = se.scoreDelta.home > 0 ? "home" : "away";

      const actor = this.getRandomStartingPlayer(side);

      return this.createEvent(se.minute, 0, "goal", side, actor, se.scoreDelta);
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

  private opposite(side: "home" | "away"): "home" | "away" {
    return side === "home" ? "away" : "home";
  }

  private getSecondHalfStartSide(): "home" | "away" {
    return Math.random() > 0.5 ? "away" : "home";
  }
}
