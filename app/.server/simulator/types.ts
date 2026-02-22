export type ScorePrediction = {
  home: number;
  away: number;
};

export type ScoreEvent = {
  minute: number;
  scoreDelta: { home: number; away: number };
};

export type TeamSquad = {
  starting: string[];
  substitutes: string[];
};

export type SportPlayerPool = {
  home: TeamSquad;
  away: TeamSquad;
};

export type MatchInfo = {
  id: string;
  sport: Sport;
  homeTeam: string;
  awayTeam: string;
  startTime: Date;
  endTime: Date;
};

export type CommentaryEvent = {
  minute: number;
  sequence: number;
  period: string | null;
  eventType: string;
  team: string | null;
  actor: string | null;
  message: string;
  tags: string[];
  scoreDelta?: { home: number; away: number };
};

export type FootballExtraTime = {
  firstHalf: number;
  secondHalf: number;
};

export type SportConfig = {
  duration: number;
  periods: string[];
  eventTypes: string[];
  scoreRange: { min: number; max: number };
  squadSize: { starting: number; substitutes: number };
};

export type SimulationStats = {
  running: boolean;
  speed: number;
  activeMatches: number;
};

export type Sport = "football" | "cricket" | "basketball";
