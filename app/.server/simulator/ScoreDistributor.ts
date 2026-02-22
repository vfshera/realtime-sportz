import { OVERTIME_DURATION, SPORT_CONFIG } from "./constants";
import type { ScoreEvent, ScorePrediction, Sport } from "./types";

export class ScoreDistributor {
  readonly #sport: string;
  readonly #duration: number;
  readonly #predictedHome: number;
  readonly #predictedAway: number;
  readonly #extraDuration: number;

  constructor(sport: Sport, duration: number, extraDuration = 0) {
    this.#sport = sport;
    this.#duration = duration;
    this.#extraDuration = extraDuration;

    const config = SPORT_CONFIG[sport];

    if (!config) {
      throw new Error(`Unknown sport: ${sport}`);
    }

    const { home, away } = this.generatePrediction(config.scoreRange);
    this.#predictedHome = home;
    this.#predictedAway = away;
  }

  get prediction(): ScorePrediction {
    return {
      home: this.#predictedHome,
      away: this.#predictedAway,
    };
  }

  distribute(): ScoreEvent[] {
    const effectiveDuration = this.#duration + this.#extraDuration;

    switch (this.#sport) {
      case "football":
        return this.distributeFootball(effectiveDuration);
      case "cricket":
        return this.distributeCricket();
      case "basketball":
        return this.distributeBasketball();
      default:
        return [];
    }
  }

  private generatePrediction(range: { min: number; max: number }): {
    home: number;
    away: number;
  } {
    const home =
      Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    const away =
      Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;

    return { home, away };
  }

  private distributeFootball(duration: number): ScoreEvent[] {
    const events: ScoreEvent[] = [];

    const homeGoalMinutes = this.distributeGoals(this.#predictedHome, duration);

    const awayGoalMinutes = this.distributeGoals(this.#predictedAway, duration);

    for (const minute of homeGoalMinutes) {
      events.push({
        minute,
        scoreDelta: { home: 1, away: 0 },
      });
    }

    for (const minute of awayGoalMinutes) {
      events.push({
        minute,
        scoreDelta: { home: 0, away: 1 },
      });
    }

    return events.sort((a, b) => a.minute - b.minute);
  }

  private distributeGoals(count: number, duration: number): number[] {
    if (count === 0) return [];

    const minutes: number[] = [];

    const clusters = [
      { start: 0, end: 15, weight: 0.15 },
      { start: 16, end: 30, weight: 0.15 },
      { start: 31, end: 45, weight: 0.25 },
      { start: 46, end: 60, weight: 0.1 },
      { start: 61, end: 75, weight: 0.1 },
      { start: 76, end: duration, weight: 0.25 },
    ];

    for (let i = 0; i < count; i++) {
      const rand = Math.random();

      let cumulative = 0;

      for (const cluster of clusters) {
        cumulative += cluster.weight;

        if (rand <= cumulative) {
          const minute =
            Math.floor(Math.random() * (cluster.end - cluster.start + 1)) +
            cluster.start;
          minutes.push(minute);
          break;
        }
      }
    }

    return minutes.sort((a, b) => a - b);
  }

  private distributeCricket(): ScoreEvent[] {
    const events: ScoreEvent[] = [];

    const homeRuns = this.#predictedHome;

    const awayRuns = this.#predictedAway;

    const homeWickets = Math.floor(Math.random() * 10);

    const awayWickets = Math.floor(Math.random() * 10);

    for (let over = 1; over <= 20; over++) {
      const isHomeInnings = over <= 10;

      if (isHomeInnings) {
        const runsThisOver = this.getRunsForOver(
          homeRuns,
          over,
          10,
          homeWickets,
        );

        const wicketsThisOver = Math.random() > 0.9 ? 1 : 0;

        if (runsThisOver > 0) {
          events.push({
            minute: over,
            scoreDelta: { home: runsThisOver, away: 0 },
          });
        }

        if (wicketsThisOver > 0) {
          events.push({
            minute: over + 0.5,
            scoreDelta: { home: 0, away: wicketsThisOver },
          });
        }
      } else {
        const runsThisOver = this.getRunsForOver(
          awayRuns,
          over - 10,
          10,
          awayWickets,
        );

        const wicketsThisOver = Math.random() > 0.9 ? 1 : 0;

        if (runsThisOver > 0) {
          events.push({
            minute: over,
            scoreDelta: { home: 0, away: runsThisOver },
          });
        }

        if (wicketsThisOver > 0) {
          events.push({
            minute: over + 0.5,
            scoreDelta: { home: 0, away: wicketsThisOver },
          });
        }
      }
    }

    return events.sort((a, b) => a.minute - b.minute);
  }

  private getRunsForOver(
    totalRuns: number,
    currentOver: number,
    totalOvers: number,
    wickets: number,
  ): number {
    const avgRunRate = totalRuns / totalOvers;

    const variance = avgRunRate * 0.5;

    const base = avgRunRate + (Math.random() - 0.5) * 2 * variance;

    if (wickets > 5 && currentOver > totalOvers * 0.7) {
      return Math.max(0, Math.floor(base * 0.8));
    }

    return Math.max(0, Math.floor(base));
  }

  private distributeBasketball(): ScoreEvent[] {
    const events: ScoreEvent[] = [];

    const homeTotal = this.#predictedHome;

    const awayTotal = this.#predictedAway;

    const needsOvertime = homeTotal === awayTotal;

    let overtimeCount = 0;

    if (needsOvertime) {
      overtimeCount = Math.floor(Math.random() * 2) + 1;
    }

    const totalDuration = 48 + overtimeCount * OVERTIME_DURATION;

    const homePoints = this.distributeBasketballPoints(
      homeTotal,
      totalDuration,
    );

    const awayPoints = this.distributeBasketballPoints(
      awayTotal,
      totalDuration,
    );

    for (const event of homePoints) {
      events.push({
        minute: event.minute,
        scoreDelta: { home: event.points, away: 0 },
      });
    }

    for (const event of awayPoints) {
      events.push({
        minute: event.minute,
        scoreDelta: { home: 0, away: event.points },
      });
    }

    return events.sort((a, b) => a.minute - b.minute);
  }

  private distributeBasketballPoints(
    total: number,
    duration: number,
  ): { minute: number; points: number }[] {
    const events: { minute: number; points: number }[] = [];

    let remaining = total;

    const pointsPerQuarter = total / 4;

    for (let quarter = 1; quarter <= Math.ceil(duration / 12); quarter++) {
      const startMinute = (quarter - 1) * 12;

      const endMinute = Math.min(quarter * 12, duration);

      const quarterPoints = Math.min(
        Math.floor(pointsPerQuarter * (0.8 + Math.random() * 0.4)),
        remaining,
      );

      const scoringEvents = Math.floor(quarterPoints / 2.5);

      for (let i = 0; i < scoringEvents && remaining > 0; i++) {
        const minute =
          Math.floor(Math.random() * (endMinute - startMinute)) +
          startMinute +
          1;

        const pointOptions = [
          { points: 2, weight: 0.5 },
          { points: 3, weight: 0.3 },
          { points: 1, weight: 0.2 },
        ];

        const rand = Math.random();

        let cumulative = 0;

        let points = 2;

        for (const option of pointOptions) {
          cumulative += option.weight;

          if (rand <= cumulative) {
            points = Math.min(option.points, remaining);
            break;
          }
        }

        if (points > 0 && points <= remaining) {
          events.push({ minute, points });
          remaining -= points;
        }
      }
    }

    while (remaining > 0) {
      const minute = Math.floor(Math.random() * duration) + 1;

      const points = Math.min(remaining, Math.random() > 0.3 ? 2 : 1);
      events.push({ minute, points });
      remaining -= points;
    }

    return events.sort((a, b) => a.minute - b.minute);
  }
}
