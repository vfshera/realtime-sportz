import { SPORT_CONFIG } from "./constants";
import {
  ALL_TEAMS,
  BASKETBALL_TEAMS,
  CRICKET_TEAMS,
  FOOTBALL_TEAMS,
} from "./data/players";
import type { Sport, SportPlayerPool, TeamSquad } from "./types";

export class PlayerPoolManager {
  readonly #pools: Map<string, SportPlayerPool> = new Map();

  getPool(
    matchId: string,
    sport: Sport,
    homeTeam: string,
    awayTeam: string,
  ): SportPlayerPool {
    const key = matchId;

    const cached = this.#pools.get(key);

    if (cached) {
      return cached;
    }

    const pool = this.loadOrCreatePool(sport, homeTeam, awayTeam);
    this.#pools.set(key, pool);

    return pool;
  }

  clearPool(matchId: string): void {
    this.#pools.delete(matchId);
  }

  clearAll(): void {
    this.#pools.clear();
  }

  private loadOrCreatePool(
    sport: Sport,
    homeTeam: string,
    awayTeam: string,
  ): SportPlayerPool {
    const teamsMap = this.getTeamsMap(sport);

    const home = teamsMap[homeTeam] ?? this.generateRandomSquad(sport);

    const away = teamsMap[awayTeam] ?? this.generateRandomSquad(sport);

    return { home, away };
  }

  private getTeamsMap(sport: string): Record<string, TeamSquad> {
    switch (sport) {
      case "football":
        return FOOTBALL_TEAMS;
      case "cricket":
        return CRICKET_TEAMS;
      case "basketball":
        return BASKETBALL_TEAMS;
      default:
        return ALL_TEAMS;
    }
  }

  private generateRandomSquad(sport: Sport): TeamSquad {
    const config = SPORT_CONFIG[sport];

    if (!config) {
      return {
        starting: this.generateRandomNames(11),
        substitutes: this.generateRandomNames(3),
      };
    }

    return {
      starting: this.generateRandomNames(config.squadSize.starting),
      substitutes: this.generateRandomNames(config.squadSize.substitutes),
    };
  }

  private generateRandomNames(count: number): string[] {
    const firstNames = [
      "James",
      "Michael",
      "David",
      "John",
      "Robert",
      "William",
      "Carlos",
      "Luis",
      "Marco",
      "Ahmed",
      "Mohammed",
      "Wei",
      "Hiroshi",
      "Kenji",
      "Pierre",
      "Hans",
      "Sven",
      "Olaf",
      "Dmitri",
      "Ivan",
    ];

    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Silva",
      "Santos",
      "Mueller",
      "Schmidt",
      "Yamamoto",
      "Tanaka",
      "Petrov",
      "Kim",
      "Park",
      "Chen",
    ];

    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];

      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      names.push(`${first} ${last}`);
    }

    return names;
  }
}

export const playerPoolManager = new PlayerPoolManager();
