import data from "./seed.json";

const GAME_DURATION = 90 * 60 * 1000; // 90 minutes in milliseconds

const MAX_MATCH_START_OFFSET = 5 * 60 * 1000; // 5 minutes in milliseconds

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getMatchTime() {
  const now = Date.now();

  const startTime = new Date(getRandomInt(now, now + MAX_MATCH_START_OFFSET));

  const endTime = new Date(startTime.getTime() + GAME_DURATION);

  return {
    startTime,
    endTime,
  };
}

export function getMatches() {
  return data.matches.map((m) => {
    return {
      sport: m.sport.toLowerCase(),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      ...getMatchTime(),
    };
  });
}

export function getCommentary() {
  return data.commentary;
}
