# Coding Standards

> **Agents**: Follow these conventions for all code in this project.

**Last Updated**: 2026-01-24

## TypeScript Conventions

### General

- Strict mode enabled
- ES modules (`"type": "module"` in package.json)
- 2-space indentation
- 100 character line limit (soft)
- Trailing commas in multiline structures
- Explicit return types on exported functions

### Naming

| Item | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `downloads-status.ts` |
| Classes | PascalCase | `SonarrClient` |
| Functions | camelCase | `searchSeries` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_TIMEOUT` |
| Types/Interfaces | PascalCase | `SeriesInfo` |
| MCP Tools (Semantic) | verb_noun | `tv_search`, `movie_add` |
| MCP Tools (Service) | service_action | `sonarr_queue`, `radarr_stuck` |

### Tool Registration Pattern

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Tool with parameters
server.tool(
  "tv_search",
  "Search for TV series by name. Returns matching shows.",
  {
    query: z.string().describe("The series name to search for"),
  },
  async ({ query }) => {
    // Implementation
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// Tool without parameters
server.tool(
  "sonarr_queue",
  "Get Sonarr download queue with progress, ETA, errors, and stuck imports.",
  async () => {
    // Implementation
    return {
      content: [{ type: "text", text: result }],
    };
  }
);
```

**IMPORTANT**: Use `z.coerce.number()` and `z.coerce.boolean()` for numeric and boolean parameters because MCP passes all values as strings:

```typescript
// CORRECT - handles MCP string-to-number conversion
server.tool(
  "tv_episodes",
  "Get episodes for a series",
  {
    series_id: z.coerce.number().describe("Sonarr series ID"),
    season: z.coerce.number().optional().describe("Filter to specific season"),
  },
  async ({ series_id, season }) => { /* ... */ }
);

// WRONG - will fail with "Expected number, received string"
{
  series_id: z.number().describe("Sonarr series ID"),  // Don't do this!
}
```

### Service Module Pattern

Each service module exports:

```typescript
// services/sonarr/index.ts
export { registerSonarrTools } from "./tools.js";
export { SonarrClient } from "./client.js";
export type { Series, Episode, Queue } from "./types.js";
```

### Error Handling

```typescript
// Return user-friendly messages, log details to stderr
try {
  const result = await client.searchSeries(query);
  return formatSuccess(result);
} catch (error) {
  console.error("Sonarr API error:", error);
  return {
    content: [{
      type: "text",
      text: `Unable to search Sonarr. Please check that the service is running.`,
    }],
  };
}
```

### Response Formatting

```typescript
// Simple queries: human-readable text
function formatSeriesResult(series: Series[]): string {
  if (series.length === 0) {
    return "No series found matching your search.";
  }
  return series
    .map((s) => `${s.title} (${s.year}) - ${s.status}`)
    .join("\n");
}

// Complex data: structured for Claude to parse
function formatQueueDetails(queue: QueueItem[]): object {
  return {
    count: queue.length,
    items: queue.map((item) => ({
      title: item.title,
      status: item.status,
      progress: item.progress,
    })),
  };
}
```

## Tool Design Guidelines

### Semantic vs Service-Specific

**Semantic Tools** (user-facing, intuitive names):
- TV: `tv_search`, `tv_add`, `tv_list`, `tv_episodes`, `tv_search_missing`
- Movies: `movie_search`, `movie_add`, `movie_list`, `movie_upgrade`, `movie_delete`
- Library: `library_list`, `library_search`, `library_watched`
- Downloads: `downloads_status`, `downloads_queue`, `downloads_history`, `downloads_pause`, `downloads_resume`, `downloads_speed`
- System: `media_help`, `system_health`

**Service-Specific Tools** (admin/troubleshooting):
- Sonarr: `sonarr_queue`, `sonarr_details`, `sonarr_delete`, `sonarr_stuck`, `sonarr_blacklist`, etc.
- Radarr: `radarr_queue`, `radarr_details`, `radarr_stuck`, `radarr_blacklist`, etc.
- Plex: `plex_delete`, `plex_unwatched`, `plex_watched_old`, etc.
- Sabnzbd: `sabnzbd_delete`, `sabnzbd_failed`, `sabnzbd_retry`, etc.

See `api-standards.md` for the complete tool reference.

### Parameter Design

- Use descriptive names: `query` not `q`
- Include zod `.describe()` for all parameters
- Optional parameters have sensible defaults
- Movie tools accept `quality?: 'hd' | '4k'` (default: `'hd'`)

### Tool Descriptions

```typescript
// Good: explains what it does and when to use it
description: "Search for TV series by name. Smart pick if obvious match, otherwise shows options."

// Bad: too terse
description: "Search series"
```

## Code Organization

### Imports

```typescript
// 1. Node built-ins
import { readFile } from "node:fs/promises";

// 2. External packages
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// 3. Internal modules
import { SonarrClient } from "./client.js";
import type { Series } from "./types.js";
```

### File Structure

- One class/major function per file
- Types in separate `types.ts` file per service
- Shared utilities in `src/shared/`
- Keep files under 300 lines

## Testing

- Manual testing against production services
- Test read operations before write operations
- Verify tool responses are Claude-friendly
- Test both Claude Desktop and Code configurations

## Lessons Learned (Phase 0020)

### Entity IDs in Output

**ALWAYS include entity IDs** in list and add responses. Users need IDs to call other tools like `_details`, `_delete`, `_upgrade`.

```typescript
// CORRECT - shows ID for use with other tools
`[${movie.id}] ${movie.title} (${movie.year}) - ${status}`
// Output: [974] Kung Fury (2015) - Released, Missing

// WRONG - no way to reference this movie in other tools
`${movie.title} (${movie.year}) - ${status}`
// Output: Kung Fury (2015) - Released, Missing
```

Similarly, `_add` responses should include the created entity's ID:
```typescript
`Added "${movie.title}" to Radarr:\n` +
`- Movie ID: ${movie.id}\n` +  // Include this!
`- Folder: ${folderPath}\n`
```

### HTTP Empty Response Handling

DELETE and some POST endpoints may return empty bodies. The shared HTTP client handles this:

```typescript
// In shared/http.ts - handles empty responses gracefully
const text = await response.text();
const data = text ? (JSON.parse(text) as T) : (undefined as T);
```

### API Response Normalization

Some Radarr lookup endpoints return single objects, not arrays:
- `/movie/lookup?term=query` → returns array
- `/movie/lookup/imdb?imdbId=tt1234567` → returns **single object**
- `/movie/lookup/tmdb?tmdbId=12345` → returns **single object**

Always normalize to arrays in the client layer:
```typescript
// Wrap single-object responses in arrays for consistent handling
const result = await this.http.get<MovieLookup>(`/movie/lookup/imdb?...`);
return result ? [result] : [];
```

### Queue Item States

Queue items can have these `trackedDownloadState` values:
- `downloading` - actively downloading
- `importPending` - waiting to import
- `importBlocked` - blocked from importing (needs attention!)
- `importing` - currently importing
- `imported` - successfully imported
- `failedPending` - failed, pending retry

Always check for `importBlocked` in stuck item detection - it was missing initially.

## Git

- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Run `pnpm lint && pnpm build` before committing
- Never commit `config.json` or `.env` files
