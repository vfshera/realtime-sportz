# Sportz on WebSockets

Real-time sports commentary platform with sub-second updates via WebSockets.

## Why This Project?

I created this project to explore WebSocket implementation in a modern **React Router v7 (framework mode)** & **Hono** stack, inspired by the tutorial:

> **[WebSockets Crash Course: Build a Real-Time Sports Broadcast Engine (10ms Updates)](https://www.youtube.com/watch?v=pbOXOY78dNA)**  
> from [JavaScript Mastery](https://www.youtube.com/@javascriptmastery)

> The video demonstrated how to build a real-time sports data pipeline, and I wanted to adapt those concepts to a modern full-stack TypeScript architecture.

## Differences from Tutorial

While inspired by the JavaScript Mastery tutorial, I made several architectural changes:

| Aspect            | Tutorial                               | This Implementation                                                                                                    |
| ----------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Web Framework** | Express                                | [Hono](https://hono.dev/) - lightweight, TypeScript-first, excellent middleware support                                |
| **Security**      | Arcjet (bot protection, rate limiting) | Custom implementation in `server/security.ts` - full control over security logic                                       |
| **Database**      | PostgreSQL                             | [LibSQL](https://github.com/tursodatabase/libsql) (SQLite fork) with WAL mode - simpler setup, single file, edge-ready |

### Custom Security Implementation (`server/security.ts`)

Instead of using Arcjet, I built a custom security layer using Hono middleware and specialized packages:

**Bot Protection:**

- **Generic Bot Blocker:** Uses `isbot` to detect and block unknown scrapers/scanners, while allowing legitimate crawlers (Googlebot, Bingbot, etc.)
- **AI Bot Blocker:** Uses `@hono/ua-blocker` to specifically block GPTBot, Bytespider, CCBot, and other AI crawlers that ignore robots.txt
- **Auto-generated robots.txt:** Automatically serves proper robots.txt directives for all known AI bots

**Rate Limiting:**

- **HTTP Rate Limiter:** `httpLimiter` - 50 requests per 10 seconds (configurable via env vars)
- **WebSocket Connection Limiter:** `wsConnectionLimiter` - Limits connection attempts to prevent connection flooding
- **WebSocket Message Limiter:** `wsMessageLimiter` - 20 messages per 5 seconds, closes connection (code 1008) if exceeded

All rate limits use real IP detection and are fully configurable via environment variables in `.env`:

- `RATE_LIMIT_HTTP_WINDOW_SEC` / `RATE_LIMIT_HTTP_MAX_REQUESTS`
- `RATE_LIMIT_WS_CONNECTION_WINDOW_SEC` / `RATE_LIMIT_WS_MAX_CONNECTIONS`
- `RATE_LIMIT_WS_MESSAGE_WINDOW_SEC` / `RATE_LIMIT_WS_MAX_MESSAGES`

**Why custom implementation?**

- Full control over security logic and response handling
- No external service dependencies
- Hono-native middleware pattern integrates seamlessly
- Easier to customize rules per-route or per-use-case

## Tech Stack

- **Runtime:** Node.js
- **Package Manager:** Bun
- **Framework:** React Router v7 (framework mode)
- **Server:** Hono with WebSocket support via `react-router-hono-server`
- **Database:** SQLite with Drizzle ORM
- **Language:** TypeScript 5.9 (strict mode)
- **Styling:** Tailwind CSS v4
- **Validation:** Zod

## Features

- Real-time match commentary via WebSockets (10ms update target)
- Live match simulation for Football, Cricket, and Basketball
- Room-based pub/sub architecture for match subscriptions
- Type-safe WebSocket message validation
- Multi-sport event generation with realistic timing

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Ensure PUBLIC_APP_URL & DB_FILE_NAME are set in .env

# Run database migrations
bun run db:setup

# Start development server
bun dev
```

## Architecture Deep Dive

### Error Handling with neverthrow

This project uses [neverthrow](https://github.com/supermacro/neverthrow) for functional error handling instead of try/catch blocks. All service methods return `ResultAsync<T, ServiceError>`, providing:

- **Type safety:** Errors are part of the return type, not thrown
- **Explicit handling:** Callers must handle both success and error cases
- **Better composability:** Chain operations with `.andThen()` and `.map()`

Example from the commentary service:

```typescript
export class CommentaryService {
  create(data: NewCommentary): ResultAsync<Commentary, ServiceError> {
    return ResultAsync.fromPromise(
      db.insert(commentary).values(data).returning(),
      (e) => databaseError(e instanceof Error ? e.message : String(e)),
    ).andThen(([entry]) => {
      pubsub.broadcast(data.matchId, {
        type: "commentary.created",
        payload: entry,
      });
      return okAsync(entry);
    });
  }
}
```

### Match Simulation Engine

The simulator generates realistic match events using sport-specific templates:

- **Score Distribution:** Algorithm distributes predicted scores across match duration
- **Event Scheduling:** Events are scheduled using real-time delays with speed multiplier
- **Sport Templates:** Each sport (Football, Cricket, Basketball) has custom event generation logic
- **Player Pools:** Random player selection from realistic team rosters

Key features:

- Variable match duration with extra time simulation
- Realistic event timing (cricket uses fractional overs, football has halftime)
- Score tracking and match state transitions

### WebSocket Architecture

**Pub/Sub with Room-Based Subscriptions:**

```
Client                     Server
  |                          |
  |-- subscribe(matchId) --> |  Join match room
  |                          |
  |<-- commentary.created ---|  Real-time events
  |                          |
  |-- unsubscribe(matchId) ->|  Leave match room
```

**Message Flow:**

1. Client subscribes to match via WebSocket
2. Server maintains room registry (`matchId → Set<connections>`)
3. Simulator creates commentary → Service broadcasts to room
4. All subscribed clients receive event within ~10ms
5. Client unsubscribes when switching matches

**Validation:**
All WebSocket messages are validated with Zod schemas on both client and server:

- `serverMessageSchema` for incoming messages
- `clientMessageSchema` for outgoing messages
- Type-safe payload extraction with TypeScript

### Database Design

**Commentary Schema:**

```typescript
{
  id: string (CUID)
  matchId: string (foreign key)
  elapsedTime: number (seconds)
  sequence: number
  period: string | null
  eventType: string
  actor: string | null
  team: string | null
  message: string
  metadata: JSON
  tags: string | null
  createdAt: Date
  updatedAt: Date
}
```

**Design Decisions:**

- `elapsedTime` stores time in **seconds** (integer) instead of minutes to:
  - Support cricket's fractional overs without floating-point issues
  - Enable sub-minute precision for all sports
  - Maintain consistent integer format across the stack
- **Index:** Composite index on `(matchId, elapsedTime, sequence)` for efficient timeline queries
- **Relations:** Commentary belongs to Match (cascade delete)

### Project Structure

```
app/
├── .server/
│   ├── db/
│   │   ├── schema/        # Drizzle table definitions
│   │   └── utils.ts       # CUID, timestamp utilities
│   ├── services/          # Business logic with neverthrow
│   │   ├── commentary.service.ts
│   │   └── match.service.ts
│   └── simulator/         # Match simulation engine
│       ├── MatchSimulator.ts
│       ├── ScoreDistributor.ts
│       └── templates/     # Sport-specific generators
├── components/            # React components
├── providers.tsx          # WebSocket context
├── validations/
│   └── transport/         # Zod schemas for WS messages
└── routes/                # React Router routes

server/
└── websocket/
    ├── pubsub.ts          # Room-based pub/sub logic
    └── handler.ts         # WebSocket connection handler
```

## Development Commands

```bash
# Development
bun dev                    # Start dev server

# Database
bun run db:setup          # Generate and run migrations
bun run db:studio         # Open Drizzle Studio

# Code Quality
bun run typecheck         # TypeScript check
bun run lint              # ESLint
bun run lint:fix          # ESLint with auto-fix
bun run format            # Prettier formatting
```

## License

MIT
