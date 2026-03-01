import { CommentaryTemplate } from "./base";
import type { CommentaryEvent, ScoreEvent } from "../types";

export class CricketTemplate extends CommentaryTemplate {
  readonly sport = "cricket";
  readonly duration = 20;
  readonly periods = ["1st innings", "2nd innings"];
  readonly eventTypes = [
    "wicket",
    "four",
    "six",
    "dot_ball",
    "single",
    "double",
    "triple",
    "maiden_over",
    "powerplay",
    "innings_break",
    "match_end",
  ];

  protected getPeriodForMinute(minute: number): string {
    return minute <= 10 ? "1st innings" : "2nd innings";
  }

  generate(): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];

    events.push(this.createMatchStart());

    const firstInningsRuns = this.scoreEvents.filter(
      (e) => e.minute <= 10 && e.scoreDelta.home > 0,
    );

    const firstInningsWickets = this.scoreEvents.filter(
      (e) => e.minute <= 10 && e.scoreDelta.away > 0,
    );

    events.push(
      ...this.generateInningsEvents(
        1,
        10,
        firstInningsRuns,
        firstInningsWickets,
      ),
    );

    events.push(this.createInningsBreak());

    const secondInningsRuns = this.scoreEvents.filter(
      (e) => e.minute > 10 && e.scoreDelta.home > 0,
    );

    const secondInningsWickets = this.scoreEvents.filter(
      (e) => e.minute > 10 && e.scoreDelta.away > 0,
    );

    events.push(
      ...this.generateInningsEvents(
        11,
        20,
        secondInningsRuns,
        secondInningsWickets,
      ),
    );

    events.push(this.createMatchEnd());

    return this.sortByMinute(this.assignSequences(events));
  }

  private createMatchStart(): CommentaryEvent {
    return this.createEvent(0, 1, "powerplay", "home");
  }

  private createInningsBreak(): CommentaryEvent {
    return this.createEvent(10, 1, "innings_break", "home");
  }

  private createMatchEnd(): CommentaryEvent {
    return this.createEvent(20, 1, "match_end", "home");
  }

  private generateInningsEvents(
    startOver: number,
    endOver: number,
    runEvents: ScoreEvent[],
    wicketEvents: ScoreEvent[],
  ): CommentaryEvent[] {
    const events: CommentaryEvent[] = [];

    const runsDistribution = this.distributeRunsAcrossOvers(
      runEvents,
      startOver,
      endOver,
    );
    events.push(...this.createRunEvents(runsDistribution));

    const wicketMinutes = wicketEvents.map((e) => e.minute);
    events.push(...this.createWicketEvents(wicketMinutes));

    this.addOtherEvents(events, startOver, endOver);

    return events;
  }

  private distributeRunsAcrossOvers(
    runEvents: ScoreEvent[],
    startOver: number,
    endOver: number,
  ): { minute: number; runs: number; type: string }[] {
    const totalRuns = runEvents.reduce((sum, e) => sum + e.scoreDelta.home, 0);

    const distribution: { minute: number; runs: number; type: string }[] = [];

    let remainingRuns = totalRuns;

    for (let over = startOver; over <= endOver && remainingRuns > 0; over++) {
      const avgRunsPerOver = remainingRuns / (endOver - over + 1);

      const runsThisOver = Math.min(
        Math.floor(avgRunsPerOver * (0.5 + Math.random())),
        remainingRuns,
        20,
      );

      if (runsThisOver > 0) {
        const runTypes = this.splitRunsIntoBalls(runsThisOver, over);

        distribution.push(...runTypes);
        remainingRuns -= runsThisOver;
      }
    }

    return distribution;
  }

  private splitRunsIntoBalls(
    runs: number,
    over: number,
  ): { minute: number; runs: number; type: string }[] {
    const balls: { minute: number; runs: number; type: string }[] = [];

    let remaining = runs;

    const ballsInOver = 6;

    for (let ball = 0; ball < ballsInOver && remaining > 0; ball++) {
      const rand = Math.random();

      let runType: string;

      let runValue: number;

      if (rand > 0.95 && remaining >= 6) {
        runType = "six";
        runValue = 6;
      } else if (rand > 0.85 && remaining >= 4) {
        runType = "four";
        runValue = 4;
      } else if (rand > 0.7 && remaining >= 2) {
        runType = "double";
        runValue = 2;
      } else if (rand > 0.4) {
        runType = "single";
        runValue = 1;
      } else {
        runType = "dot_ball";
        runValue = 0;
      }

      if (runValue <= remaining) {
        balls.push({
          minute: over + ball / 10,
          runs: runValue,
          type: runType,
        });
        remaining -= runValue;
      }
    }

    return balls;
  }

  private createRunEvents(
    distribution: { minute: number; runs: number; type: string }[],
  ): CommentaryEvent[] {
    return distribution
      .filter((d) => d.runs > 0)
      .map((d) => {
        const side = Math.random() > 0.5 ? "home" : "away";

        const actor = this.getRandomStartingPlayer(side);

        return this.createEvent(
          Math.ceil(d.minute),
          0,
          d.type,
          side,
          actor,
          d.runs > 0 ? { home: d.runs, away: 0 } : undefined,
        );
      });
  }

  private createWicketEvents(wicketMinutes: number[]): CommentaryEvent[] {
    return wicketMinutes.map((minute) => {
      const battingSide = Math.random() > 0.5 ? "home" : "away";

      const batter = this.getRandomStartingPlayer(battingSide);

      return this.createEvent(minute, 0, "wicket", battingSide, batter, {
        home: 0,
        away: 1,
      });
    });
  }

  private addOtherEvents(
    events: CommentaryEvent[],
    startOver: number,
    endOver: number,
  ): void {
    const overs = endOver - startOver;

    const dotBalls = Math.floor(overs * 0.3);

    for (let i = 0; i < dotBalls; i++) {
      const minute = startOver + Math.floor(Math.random() * overs);

      const side = Math.random() > 0.5 ? "home" : "away";

      events.push(this.createEvent(minute, 0, "dot_ball", side));
    }
  }
}
