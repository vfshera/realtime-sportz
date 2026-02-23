# AGENTS.md - Coding Guidelines for Sportz

## Project Overview

React Router v7 (framework mode) application with real-time WebSocket capabilities for live sports match data. Uses Bun, TypeScript, Drizzle ORM (SQLite), Tailwind CSS v4, and Hono server.

## Build & Development Commands

```bash
# Development
bun dev                    # Start development server

# Production
bun build                  # Build for production
bun start                  # Start production server

# Code Quality
bun run typecheck          # Run TypeScript type checking
bun run lint               # Run ESLint
bun run lint:fix           # Run ESLint with auto-fix
bun run format             # Format code with Prettier

# Database
bun run db:studio          # Open Drizzle Studio
bun run db:generate        # Generate migration files
bun run db:migrate         # Run migrations
bun run db:setup           # Generate and run migrations
```

**Note:** No test suite exists yet. If adding tests, use Bun's built-in test runner: `bun test` or `bun test path/to/file.test.ts` for single tests.

## Technology Stack

- **Framework:** React Router v7 (framework mode, SSR enabled)
- **Runtime:** Bun
- **Language:** TypeScript 5.9 (strict mode)
- **Server:** Hono with react-router-hono-server
- **Database:** SQLite via Drizzle ORM
- **Styling:** Tailwind CSS v4 with custom theme
- **Validation:** Zod + drizzle-zod
- **Package Manager:** Bun

## Import Conventions

### Import Order (enforced by Prettier)

1. Route module types: `^.*\.\/\+types\/.*$`
2. React: `^react$`
3. React Router: `^react-router$`
4. Third-party modules: `<THIRD_PARTY_MODULES>`
5. Server-only code: `^~.*\.server.*$`
6. Client-only code: `^~.*\.client.*$`
7. Path aliases: `^~.*$`
8. Relative imports: `^[./]`
9. Type imports: `^import type`
10. Other: `^.+$`

### Type Imports

Always use `type` keyword for type-only imports:

```typescript
import type { Route } from "./+types/root";
import { type CSSProperties, useState } from "react";
import type { Match } from "~/.server/db/schema";
```

### Path Aliases

- `~/` maps to `./app/` - use for all app imports
- `$/` maps to `./` - use for server context, root-level files

## Code Style Guidelines

### Formatting (Prettier + ESLint)

- **Quotes:** Double quotes (`"`)
- **Semicolons:** Always required
- **Line width:** Default Prettier (80 chars)
- **Trailing commas:** Default Prettier behavior

### Padding Between Statements

ESLint enforces blank lines between:

- Variable declarations and subsequent code
- Functions and subsequent declarations
- Types/classes/blocks and subsequent code
- Before `return` and `export` statements

Example:

```typescript
const data = await fetchData();

const processed = transform(data);

return processed;
```

### Naming Conventions

- **Components:** PascalCase (e.g., `HomePage`, `MatchCard`)
- **Functions/Variables:** camelCase (e.g., `getMatches`, `isLoading`)
- **Types/Interfaces:** PascalCase (e.g., `MatchStatus`, `RouteParams`)
- **Constants:** UPPER_SNAKE_CASE for true constants (e.g., `MATCH_STATUS`)
- **Database tables:** snake_case in schema (e.g., `home_team`)
- **File names:** camelCase for utilities, PascalCase for components
- **useEffect callbacks:** Named functions with verb + noun pattern (e.g., `setupEventListeners`, `subscribeToSelectedMatch`). Improves readability and debug call stack traces.

### Server/Client Code Splitting

- Place server-only code in `.server/` directories
- Place client-only code in `.client/` directories
- Import order reflects this: `.server` imports before `.client`

Example structure:

```
app/
  .server/
    db/
      schema/
      utils/
    simulator/
  routes/
  components/
  utils/
```

## Error Handling

### React Router Error Boundaries

Always export an `ErrorBoundary` component in route files:

```typescript
import { isRouteErrorResponse, useRouteError } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();

  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details = error.status === 404
      ? "The requested page could not be found."
      : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && <pre>{stack}</pre>}
    </main>
  );
}
```

### Console Usage

- `console.log` triggers warnings - use sparingly
- Remove debug logs before committing
- Use `console.error` for actual errors

## React Router Framework Patterns

### Route Module Types

Auto-generated types from `.react-router/types/` provide type safety:

```typescript
import type { Route } from "./+types/my-route";

// Available types:
// Route.LoaderArgs, Route.ActionArgs, Route.ComponentProps
// Route.ErrorBoundaryProps, Route.MetaArgs, Route.ClientLoaderArgs
```

### Route Module Exports

| Export          | Purpose                    | Runs On |
| --------------- | -------------------------- | ------- |
| `default`       | Route component            | Client  |
| `loader`        | Load data before render    | Server  |
| `clientLoader`  | Load data on client        | Client  |
| `action`        | Handle form mutations      | Server  |
| `clientAction`  | Handle mutations on client | Client  |
| `ErrorBoundary` | Render on errors           | Client  |
| `meta`          | Add meta tags              | Both    |
| `links`         | Add `<link>` elements      | Both    |

### Forms & Mutations

**Search forms** - use `<Form method="get">`, NOT `onSubmit`:

```tsx
// ✅ Correct
<Form method="get">
  <input name="q" />
</Form>
```

**Inline mutations** - use `useFetcher`, NOT `<Form>` (avoids navigation):

```tsx
const fetcher = useFetcher<typeof action>();
<fetcher.Form method="post" action={`/favorites/${id}`}>
  <button>{optimistic ? "★" : "☆"}</button>
</fetcher.Form>;
```

### Type-Safe URLs

Use the `href` utility for type-safe path generation:

```tsx
import { href } from "react-router";

<Link to={href("/products/:id", { id: "abc123" })} />;
```

### Meta Function

**Use `loaderData`, not `data`** - the `data` parameter is deprecated:

```tsx
export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData.match.name }];
}
```

## TypeScript Guidelines

### Strict Mode Enabled

- Always define explicit return types for public functions
- Use `satisfies` for configuration objects
- Leverage Drizzle's type inference: `typeof table.$inferSelect`

### Example Patterns

```typescript
// Route loader with typed context
export async function loader({ context }: Route.LoaderArgs) {
  const { db } = context.get(appContext);
  // ...
}

// Database types
export type Match = typeof matches.$inferSelect;
export type NewMatch = Omit<typeof matches.$inferInsert, DefaultOmit>;
```

## Database (Drizzle)

### Schema Conventions

- Use `sqliteTable` for table definitions
- Column names: snake_case
- Use `primaryKeyCuid2` for IDs
- Include `timestamps` spread for createdAt/updatedAt
- Add check constraints for enums

```typescript
export const matches = sqliteTable(
  "matches",
  {
    id: primaryKeyCuid2,
    sport: text("sport").notNull(),
    status: text("status").notNull().$type<MatchStatus>().default("scheduled"),
    ...timestamps,
  },
  (t) => [check("status_check", sql`...`)],
);
```

## Styling (Tailwind CSS v4)

### Custom Theme

Located in `app/app.css`:

- Fonts: Manrope (primary), Space Mono (monospace)
- Colors: yellow (#ffe033), dark (#1a1a1a), blue (#b3e5fc)
- Custom animations: slide-down, slide-up, fade-in, slide-left

### Utility Functions

Use `cn()` from `~/utils/styling` for conditional class merging:

```typescript
import { cn } from "~/utils/styling";

className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)}
```

## WebSocket Guidelines

- Use `WebSocketProvider` context for WebSocket state
- Subscribe/unsubscribe to match IDs via context methods
- Handle connection status via `isConnected` flag

## Environment Variables

Server variables in `app/env.server.ts`:

- Use `env` for server-only variables
- Use `clientEnv` for variables exposed to client
- Access via context: `context.get(appContext).env`

## Git Workflow

Lefthook runs on pre-commit:

- Prettier formatting on staged files
- ESLint --fix on staged files

Always ensure linting passes before committing.

## Service Layer Architecture

### Overview

Business logic is encapsulated in services located in `app/.server/services/`. Services handle database operations, WebSocket broadcasting, and return typed errors using neverthrow.

### Service Structure

```
app/.server/services/
├── errors.ts          # Service error types
├── match.service.ts   # Match business logic
├── commentary.service.ts # Commentary business logic
└── index.ts          # Service exports
```

### Service Pattern

Services return `ResultAsync<T, ServiceError>` instead of throwing:

```typescript
import { ResultAsync, errAsync, okAsync } from "neverthrow";

export class MatchService {
  async create(data: NewMatch): ResultAsync<Match, ServiceError> {
    return ResultAsync.fromPromise(
      db.insert(matches).values(data).returning(),
      (e) => databaseError(e instanceof Error ? e.message : String(e)),
    ).andThen(([match]) => {
      pubsub.broadcast(match.id, { type: "match.created", payload: match });
      return okAsync(match);
    });
  }
}
```

### Error Types

Services define typed errors:

```typescript
export type ServiceError =
  | { type: "NOT_FOUND"; resource: string; id: string }
  | { type: "DATABASE_ERROR"; message: string };
```

### Usage in Routes

```typescript
import { matchService } from "~/.server/services";
import { resultToResponse } from "~/utils/api.server";

export async function action({ request }: Route.ActionArgs) {
  const result = await matchService.create(data);
  return resultToResponse(result, { success: 201 });
}
```

### Service Conventions

1. **Return Types**: Always return `ResultAsync<T, ServiceError>` for async operations
2. **Error Handling**: Use `ResultAsync.fromPromise()` to catch DB errors
3. **Broadcasting**: Services handle WebSocket broadcasts after successful DB operations
4. **Validation**: Services assume validated input (validation happens in routes)
5. **Singleton**: Export singleton instance (e.g., `export const matchService = new MatchService()`)

## neverthrow Guidelines

### When to Use

- **Services**: All public async methods return `ResultAsync`
- **Simulator**: Domain-specific operations return `ResultAsync`
- **Routes**: Convert Results to HTTP responses

### Result Types

```typescript
import { ResultAsync, errAsync, okAsync } from "neverthrow";

// Success path
return okAsync(data);

// Error path
return errAsync({ type: "NOT_FOUND", resource: "Match", id });
```

### Chaining Operations

```typescript
return this.findById(id)
  .andThen(() => dbOperation())
  .andThen(([match]) => {
    pubsub.broadcast(id, { type: "updated", payload: match });
    return okAsync(match);
  });
```

### Converting to API Responses

```typescript
return result.match(
  (data) => data<ApiSuccess<T>>({ ok: true, data }),
  (error) => {
    console.error("Operation failed:", error); // Log details
    return data<ApiError>(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "Internal server error" },
      },
      { status: 500 },
    );
  },
);
```

### Error Handling Principles

1. **Services**: Return typed errors, never throw
2. **API Routes**: Log detailed errors, return generic 500 to client
3. **Simulator**: Log errors locally, continue operation (don't propagate from timers)
4. **Client**: Receives only generic error messages for security

## Common Pitfalls

1. Don't forget `type` keyword on type imports
2. Use `.server/` and `.client/` directories for code that should only run in one environment
3. React 19 is used - JSX transform is automatic, no need to import React
4. Route types are auto-generated in `.react-router/types/`
5. Always run `typecheck` before committing - it generates route types
6. ErrorBoundary uses `useRouteError()` hook, not `error` prop
7. **Service errors**: Log detailed errors server-side, return generic messages to client
8. **neverthrow**: Don't forget to handle both `ok` and `err` cases with `.match()`
9. **ResultAsync**: Use `ResultAsync.fromPromise()` for DB operations, not try/catch
