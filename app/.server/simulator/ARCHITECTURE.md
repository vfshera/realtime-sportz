# Simulator Architecture

## Overview

The simulator is a class-based system for generating realistic match data with real-time commentary, score updates, and status transitions. It uses sport-specific templates to create unique match experiences.

---

## Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SimulationManager                                │
│  (Singleton - orchestrates entire simulation)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  - #running: boolean                                                     │
│  - #speedMultiplier: number                                              │
│  - #timers: Set<NodeJS.Timeout>                                          │
│  - #predictions: Map<string, ScorePrediction>                            │
│  - #matchSimulators: Map<string, MatchSimulator>                         │
├─────────────────────────────────────────────────────────────────────────┤
│  + start(): Promise<void>                                                │
│  + stop(): void                                                          │
│  + restart(): Promise<void>                                              │
│  + setSpeed(speed: number): void                                         │
│  + getStats(): SimulationStats                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ creates
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           MatchSimulator                                 │
│  (One instance per match - handles match lifecycle)                     │
├─────────────────────────────────────────────────────────────────────────┤
│  - #matchId: string                                                      │
│  - #match: MatchInfo                                                     │
│  - #players: SportPlayerPool                                             │
│  - #template: CommentaryTemplate                                         │
│  - #scoreDistributor: ScoreDistributor                                   │
│  - #events: CommentaryEvent[]                                            │
│  - #timers: Set<NodeJS.Timeout>                                          │
│  - #status: MatchStatus                                                  │
│  - #currentScore: { home: number; away: number }                         │
├─────────────────────────────────────────────────────────────────────────┤
│  + initialize(): Promise<void>                                           │
│  + start(): void                                                         │
│  + stop(): void                                                          │
│  + getPrediction(): ScorePrediction                                      │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ uses               │ uses               │ uses
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ CommentaryTemplate│  │ ScoreDistributor │  │ PlayerPoolManager│
│   (abstract)      │  │                  │  │                  │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ #match           │  │ #sport           │  │ #pools: Map      │
│ #players         │  │ #duration        │  ├──────────────────┤
│ #scoreEvents     │  │ #predictedHome   │  │ +getPool()       │
├──────────────────┤  │ #predictedAway   │  │ +getSubstitutes()│
│ +generate()      │  ├──────────────────┤  └──────────────────┘
│ #getRandomPlayer │  │ +prediction      │
│ #formatMinute()  │  │ +distribute()    │
└──────────────────┘  │ #generatePred()  │
         ▲            └──────────────────┘
         │
         │ extends
    ┌────┴────┬────────────┐
    │         │            │
┌───┴────┐ ┌──┴────┐ ┌─────┴───┐
│Football│ │Cricket│ │Basketball│
│Template│ │Template│ │Template │
└────────┘ └───────┘ └─────────┘
```

---

## File Structure

```
app/.server/simulator/
├── index.ts                 # Public API - exports simulation singleton
├── SimulationManager.ts     # Main orchestrator class
├── MatchSimulator.ts        # Per-match simulation handler
├── ScoreDistributor.ts      # Score prediction & distribution logic
├── PlayerPoolManager.ts     # Team squad management
├── types.ts                 # Shared type definitions
├── constants.ts             # Sport-specific constants (durations, score ranges)
├── ARCHITECTURE.md          # This file
│
├── templates/
│   ├── index.ts             # TemplateFactory + exports
│   ├── base.ts              # CommentaryTemplate abstract class
│   ├── football.ts          # FootballTemplate (90min + extra time)
│   ├── cricket.ts           # CricketTemplate (T20, 20 overs)
│   └── basketball.ts        # BasketballTemplate (48min + overtime)
│
└── data/
    ├── players.ts           # Team squad definitions (starting XI + subs)
    └── events.ts            # Event type definitions per sport
```

---

## Class Responsibilities

### SimulationManager

The singleton orchestrator that manages the entire simulation lifecycle.

**Responsibilities:**

- Start/stop/restart simulation
- Manage simulation speed
- Track all timers for cleanup
- Create and manage MatchSimulator instances
- Store score predictions

**API:**

```typescript
class SimulationManager {
  get running(): boolean;
  get speed(): number;

  async start(): Promise<void>;
  stop(): void;
  async restart(): Promise<void>;
  setSpeed(speed: number): void;
  getStats(): { running: boolean; speed: number; activeMatches: number };
}
```

---

### MatchSimulator

Handles the lifecycle of a single match simulation.

**Responsibilities:**

- Generate events using sport template
- Schedule commentary events with timers
- Schedule status transitions
- Broadcast events via pubsub
- Track match-specific timers

**Lifecycle:**

```
1. initialize() - Generate prediction, get players, create template
2. start() - Schedule all events and status transitions
3. Events fire → broadcast to pubsub
4. Status transitions → broadcast match.updated/match.finished
5. stop() - Clear all timers
```

---

### CommentaryTemplate (Abstract)

Base class for sport-specific timeline generation.

**Responsibilities:**

- Define sport structure (duration, periods, event types)
- Generate timeline of commentary events
- Integrate score events into timeline
- Format event messages

**Subclasses:**
| Class | Duration | Extra Time | Notes |
|-------|----------|------------|-------|
| FootballTemplate | 90 min | 1st: 0.5-3min, 2nd: 1-7min | Goals = 1 point |
| CricketTemplate | 20 overs | None | Runs (1-6), Wickets |
| BasketballTemplate | 48 min | OT: 5min if tied | Points (1, 2, 3) |

---

### ScoreDistributor

Generates realistic score predictions and distributes scoring events across the match.

**Responsibilities:**

- Generate predicted final scores per sport
- Distribute scores across match duration
- Handle sport-specific scoring patterns

**Score Ranges:**
| Sport | Home Range | Away Range | Unit |
|-------|------------|------------|------|
| Football | 0-5 | 0-5 | Goals |
| Cricket | 100-250 | 100-250 | Runs |
| Basketball | 80-130 | 80-130 | Points |

---

### PlayerPoolManager

Manages team squads with starting players and substitutes.

**Responsibilities:**

- Load pre-defined team squads
- Generate random squads for unknown teams
- Provide player selection for events

**Squad Structure:**
| Sport | Starting | Substitutes |
|-------|----------|-------------|
| Football | 11 | 3 |
| Cricket | 11 | 3 |
| Basketball | 5 | 7 |

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           SIMULATION FLOW                                 │
└──────────────────────────────────────────────────────────────────────────┘

1. User triggers "Start Simulation"
   │
   ▼
2. SimulationManager.start()
   │
   ├── Load matches from seed data
   │
   └── For each match (with delay between):
       │
       ▼
3. Create MatchSimulator instance
   │
   ├── PlayerPoolManager.getPool(homeTeam, awayTeam)
   │   └── Returns SportPlayerPool { home: {starting, substitutes}, away: {...} }
   │
   ├── ScoreDistributor(sport, duration)
   │   └── Returns prediction + distributed score events
   │
   └── CommentaryTemplate.create(sport, match, players, scoreEvents)
       └── Returns FootballTemplate | CricketTemplate | BasketballTemplate
           │
           ▼
4. MatchSimulator.initialize()
   │
   └── template.generate()
       └── Returns CommentaryEvent[] (sorted by minute)
           │
           ▼
5. MatchSimulator.start()
   │
   ├── Insert match into DB
   ├── Broadcast "match.created"
   │
   └── Schedule events (speed-adjusted delays):
       │
       ├── At match start time:
       │   ├── Update status: "scheduled" → "live"
       │   └── Broadcast "match.updated"
       │
       ├── At each event minute:
       │   ├── Insert commentary into DB
       │   ├── If scoreDelta: update match score in DB
       │   └── Broadcast "commentary.created"
       │
       └── At match end time:
           ├── Update status: "live" → "finished"
           └── Broadcast "match.finished" with final stats

┌──────────────────────────────────────────────────────────────────────────┐
│                           SPEED ADJUSTMENT                                │
└──────────────────────────────────────────────────────────────────────────┘

Base: 1 match minute = 1 real second
With speed multiplier N: 1 match minute = 1/N real seconds

Examples:
- speed = 1:  90min match = 90 seconds
- speed = 2:  90min match = 45 seconds
- speed = 5:  90min match = 18 seconds
```

---

## Message Types

### Server → Client Messages

| Type                 | Payload                | When                      |
| -------------------- | ---------------------- | ------------------------- |
| `welcome`            | `{ message: string }`  | On WebSocket connect      |
| `match.created`      | `MatchPayload`         | When match inserted to DB |
| `match.updated`      | `MatchUpdatedPayload`  | On status/score change    |
| `match.finished`     | `MatchFinishedPayload` | When match ends           |
| `commentary.created` | `CommentaryPayload`    | On each event             |
| `error`              | `ErrorPayload`         | On error                  |

### Payload Schemas

```typescript
interface MatchPayload {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: "scheduled" | "live" | "finished";
  homeScore: number;
  awayScore: number;
  startTime: Date;
  endTime: Date;
}

interface MatchUpdatedPayload {
  id: string;
  status: "scheduled" | "live" | "finished";
  homeScore: number;
  awayScore: number;
}

interface MatchFinishedPayload {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  sport: string;
}

interface CommentaryPayload {
  id: string;
  matchId: string;
  minute: number;
  sequence: number;
  period: string | null;
  eventType: string;
  team: string | null;
  actor: string | null;
  message: string;
  tags: string | null;
  metadata: Record<string, unknown>;
  scoreDelta?: { home: number; away: number };
}
```

---

## Sport-Specific Details

### Football

- **Duration:** 90 minutes (2 halves × 45 min)
- **Extra Time:**
  - 1st half: 0.5 - 3 minutes (added after 45')
  - 2nd half: 1 - 7 minutes (added after 90')
- **Scoring:** Goals = 1 point
- **Events:** kickoff, goal, shot, save, foul, yellow_card, red_card, substitution, corner, free_kick, penalty, var, halftime, fulltime
- **Score Distribution:** Goals tend to cluster near end of halves

### Cricket (T20)

- **Duration:** 20 overs (120 legal deliveries per innings)
- **Extra Time:** None
- **Scoring:**
  - Runs: 1, 2, 3, 4 (boundary), 6 (maximum)
  - Wickets: 10 max per innings
- **Events:** wicket, four, six, dot_ball, single, double, maiden_over, powerplay, innings_break
- **Score Distribution:** Runs spread across overs, wickets cluster in middle/late overs

### Basketball

- **Duration:** 48 minutes (4 quarters × 12 min)
- **Overtime:** 5 minutes if tied at end of Q4 (repeat until tie broken)
- **Scoring:**
  - Free throw: 1 point
  - Field goal: 2 points
  - Three-pointer: 3 points
- **Events:** tipoff, 2pt, 3pt, free_throw, rebound, assist, steal, block, turnover, timeout, foul, quarter_end, overtime
- **Score Distribution:** Relatively even across quarters

---

## Usage Examples

### Starting a Simulation

```typescript
import { simulation } from "~/.server/simulator";

// Start simulation
await simulation.start();

// Change speed
simulation.setSpeed(2);

// Stop simulation
simulation.stop();

// Restart (clear all data and start fresh)
await simulation.restart();
```

### Getting Simulation Stats

```typescript
const stats = simulation.getStats();
// { running: true, speed: 2, activeMatches: 5 }
```

### Accessing Predictions

```typescript
const prediction = matchSimulator.getPrediction();
// { home: 2, away: 1 }
```

---

## Testing Considerations

- Each class can be unit tested in isolation
- Mock pubsub for MatchSimulator tests
- Template classes can be tested with fixtures
- ScoreDistributor can be tested for distribution patterns

---

## Future Enhancements

1. **Configurable match duration** - Allow custom durations per sport
2. **Match events API** - Fetch specific match events
3. **Replay mode** - Replay a finished match's events
4. **Multi-server support** - Use Redis pubsub for horizontal scaling
5. **Admin dashboard** - UI for controlling simulation parameters
