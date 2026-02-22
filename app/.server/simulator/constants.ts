import type { Sport, SportConfig } from "./types";

export const SPORT_CONFIG: Record<Sport, SportConfig> = {
  football: {
    duration: 90,
    periods: ["1st half", "2nd half"],
    eventTypes: [
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
    ],
    scoreRange: { min: 0, max: 5 },
    squadSize: { starting: 11, substitutes: 3 },
  },
  cricket: {
    duration: 20,
    periods: ["1st innings", "2nd innings"],
    eventTypes: [
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
    ],
    scoreRange: { min: 100, max: 250 },
    squadSize: { starting: 11, substitutes: 3 },
  },
  basketball: {
    duration: 48,
    periods: ["Q1", "Q2", "Q3", "Q4"],
    eventTypes: [
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
    ],
    scoreRange: { min: 80, max: 130 },
    squadSize: { starting: 5, substitutes: 7 },
  },
};

export const EXTRA_TIME_RANGES = {
  football: {
    firstHalf: { min: 0.5, max: 3 },
    secondHalf: { min: 1, max: 7 },
  },
};

export const OVERTIME_DURATION = 5;

export const MATCH_CREATION_DELAY_MS = 3500;

export const DEFAULT_SPEED_MULTIPLIER = 1;

export const BASE_DELAY_PER_MINUTE_MS = 1000;
