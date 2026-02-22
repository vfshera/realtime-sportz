import { formatEventMessage, getEventDefinition } from "../data/events";
import type {
  CommentaryEvent,
  MatchInfo,
  ScoreEvent,
  SportPlayerPool,
} from "../types";

export abstract class CommentaryTemplate {
  abstract readonly sport: string;
  abstract readonly duration: number;
  abstract readonly periods: string[];
  abstract readonly eventTypes: string[];

  constructor(
    protected readonly match: MatchInfo,
    protected readonly players: SportPlayerPool,
    protected readonly scoreEvents: ScoreEvent[],
  ) {}

  abstract generate(): CommentaryEvent[];

  protected getRandomPlayer(side: "home" | "away"): string {
    const squad = side === "home" ? this.players.home : this.players.away;

    const allPlayers = [...squad.starting, ...squad.substitutes];

    return allPlayers[Math.floor(Math.random() * allPlayers.length)];
  }

  protected getRandomStartingPlayer(side: "home" | "away"): string {
    const squad = side === "home" ? this.players.home : this.players.away;

    return squad.starting[Math.floor(Math.random() * squad.starting.length)];
  }

  protected getTeamName(side: "home" | "away"): string {
    return side === "home" ? this.match.homeTeam : this.match.awayTeam;
  }

  protected createEvent(
    minute: number,
    sequence: number,
    eventType: string,
    side: "home" | "away" = "home",
    actor?: string,
    scoreDelta?: { home: number; away: number },
  ): CommentaryEvent {
    const definition = getEventDefinition(this.sport, eventType);

    const team = this.getTeamName(side);

    const eventActor = actor ?? this.getRandomPlayer(side);

    const period = this.getPeriodForMinute(minute);

    const message = definition
      ? formatEventMessage(definition, { team, actor: eventActor })
      : `${eventType} event at minute ${minute}`;

    const event: CommentaryEvent = {
      minute,
      sequence,
      period,
      eventType,
      team,
      actor: eventActor,
      message,
      tags: definition?.tags ?? [],
    };

    if (scoreDelta) {
      event.scoreDelta = scoreDelta;
    }

    return event;
  }

  protected abstract getPeriodForMinute(minute: number): string;

  protected sortByMinute(events: CommentaryEvent[]): CommentaryEvent[] {
    return [...events].sort((a, b) => {
      if (a.minute !== b.minute) {
        return a.minute - b.minute;
      }

      return a.sequence - b.sequence;
    });
  }

  protected assignSequences(events: CommentaryEvent[]): CommentaryEvent[] {
    let currentMinute = -1;

    let sequence = 0;

    return events.map((event) => {
      if (event.minute !== currentMinute) {
        currentMinute = event.minute;
        sequence = 1;
      } else {
        sequence++;
      }

      return { ...event, sequence };
    });
  }
}
