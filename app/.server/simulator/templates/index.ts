import { BasketballTemplate } from "./basketball";
import { CricketTemplate } from "./cricket";
import { FootballTemplate } from "./football";
import type {
  CommentaryEvent,
  MatchInfo,
  ScoreEvent,
  Sport,
  SportPlayerPool,
} from "../types";

export { CommentaryTemplate } from "./base";

export { FootballTemplate } from "./football";

export { CricketTemplate } from "./cricket";

export { BasketballTemplate } from "./basketball";

export type TemplateConstructor = new (
  match: MatchInfo,
  players: SportPlayerPool,
  scoreEvents: ScoreEvent[],
) => {
  sport: string;
  duration: number;
  generate(): CommentaryEvent[];
};

const TEMPLATE_MAP: Record<string, TemplateConstructor> = {
  football: FootballTemplate,
  cricket: CricketTemplate,
  basketball: BasketballTemplate,
};

export function createTemplate(
  sport: string,
  match: MatchInfo,
  players: SportPlayerPool,
  scoreEvents: ScoreEvent[],
): { sport: string; duration: number; generate(): CommentaryEvent[] } {
  const TemplateClass = TEMPLATE_MAP[sport];

  if (!TemplateClass) {
    throw new Error(`No template found for sport: ${sport}`);
  }

  return new TemplateClass(match, players, scoreEvents);
}

export function getTemplateDuration(sport: Sport): number {
  const TemplateClass = TEMPLATE_MAP[sport];

  if (!TemplateClass) {
    throw new Error(`No template found for sport: ${sport}`);
  }

  const dummyMatch: MatchInfo = {
    id: "",
    sport,
    homeTeam: "",
    awayTeam: "",
    startTime: new Date(),
    endTime: new Date(),
  };

  const dummyPlayers: SportPlayerPool = {
    home: { starting: [], substitutes: [] },
    away: { starting: [], substitutes: [] },
  };

  const template = new TemplateClass(dummyMatch, dummyPlayers, []);

  return template.duration;
}
