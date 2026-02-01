# arrs-mcp-server Development Guide

MCP server for managing media services (Sonarr, Radarr, Plex, SABnzbd, Overseerr, TMDB) through Claude. Built on `@modelcontextprotocol/sdk` with stdio transport. Only two runtime dependencies: `@modelcontextprotocol/sdk` and `zod`. Node.js 20+, TypeScript strict mode, ES Modules.

## Architecture

```
Claude Desktop / MCP Client
        |
    stdio transport (stdin/stdout = MCP protocol, stderr = logging)
        |
   McpServer (src/index.ts)
        |
   +----+----+----+----+----+----+
   |    |    |    |    |    |    |
 Sonarr Radarr Plex SABnzbd Overseerr TMDB   <-- Service Modules (conditionally registered)
   |    |    |    |    |    |    |
   +----+----+----+----+----+----+
        |              |
   HttpClient    ProviderRegistry          <-- Shared Infrastructure
   (shared/http)  (providers/)
        |
   ArrsError hierarchy                     <-- Error Handling
   (shared/errors)
```

Tools are organized in three tiers:
- **Semantic tools** (user-facing): `tv_search`, `movie_add`, `library_search` -- named for what the user wants to do
- **Admin tools** (service-specific): `sonarr_queue`, `radarr_profiles` -- prefixed with service name
- **System tools** (cross-service): `system_health`, `library_audit` -- always registered, use ProviderRegistry to check availability

## Core Principles

1. **Natural Language First** -- Tool names are semantic, optimized for Claude to select. Use `tv_search` not `sonarr_series_lookup`. Descriptions should tell Claude when and why to use the tool.

2. **Safety by Default** -- 4K instances require explicit opt-in. Destructive operations (`delete_files: true`) default to safe behavior. Always confirm before irreversible actions.

3. **Plugin Architecture** -- Each service is a self-contained module under `src/services/<name>/`. Adding a new service requires zero changes to existing service code. Only `src/index.ts` gets a new conditional registration block.

4. **Stateless Operation** -- No persistent state, no database, no cache. External services (Sonarr, Radarr, Plex) are the source of truth. Every tool call makes fresh API requests.

5. **Three-Tier Tool Design** -- Semantic tools for users, admin tools for service-specific operations, system tools for cross-service intelligence. This keeps the tool namespace organized and discoverable.

## Directory Structure

```
src/
├── index.ts                      # Entry point: config loading, tool registration, stdio transport
├── config.ts                     # Config loading: config.json + env vars, env takes precedence
├── providers/
│   ├── types.ts                  # ProviderName, ProviderCapability, ProviderStatus types
│   ├── registry.ts               # ProviderRegistry: detects configured services, capability queries
│   ├── errors.ts                 # ProviderNotConfiguredError with config instructions
│   └── index.ts                  # Barrel exports
├── services/
│   ├── sonarr/                   # Each service follows the 4-file pattern (see below)
│   │   ├── client.ts             # SonarrClient: typed API methods wrapping HttpClient
│   │   ├── tools.ts              # registerSonarrTools(): all MCP tool registrations
│   │   ├── types.ts              # TypeScript interfaces for Sonarr API entities
│   │   └── index.ts              # Barrel exports
│   ├── radarr/                   # Same 4-file pattern
│   ├── plex/                     # Same 4-file pattern
│   ├── sabnzbd/                  # Same 4-file pattern
│   ├── overseerr/                # Same 4-file pattern
│   └── tmdb/                     # Same 4-file pattern
├── shared/
│   ├── errors.ts                 # ArrsError, ApiError, NetworkError, ConfigError, formatErrorResponse
│   ├── http.ts                   # HttpClient: generic fetch wrapper with timeouts and typed errors
│   └── matching.ts               # Cross-service media matching (Plex <-> Sonarr/Radarr by ID/title)
└── tools/
    ├── index.ts                  # registerSystemTools(): registers all cross-service tools
    ├── system-health.ts          # system_health: aggregate health check across all services
    ├── downloads-status.ts       # downloads_status: unified download queue view
    ├── cleanup-analysis.ts       # cleanup_analysis: find space-saving opportunities
    ├── library-audit.ts          # library_audit: cross-reference Plex with Sonarr/Radarr
    ├── library-sync.ts           # library_sync: find sync gaps between services
    ├── media-help.ts             # media_help: contextual help for available tools
    ├── providers-status.ts       # providers_status: show configured/missing providers
    ├── space-planner.ts          # space_planner: disk space analysis and planning
    └── watch-analytics.ts        # watch_analytics: viewing history analysis
```

## Key Patterns

### Service Module Pattern (4-file structure)

Every service under `src/services/<name>/` has exactly four files:

**client.ts** -- API client class. Wraps `HttpClient`, provides typed methods per API endpoint. Constructor takes a `ServiceConfig` (url + apiKey) or service-specific config. All HTTP details are encapsulated here.

```typescript
export class SonarrClient {
  private http: HttpClient;

  constructor(config: ServiceConfig) {
    this.http = new HttpClient({
      baseUrl: `${config.url}/api/v3`,
      headers: { "X-Api-Key": config.apiKey },
      serviceName: "Sonarr",
    });
  }

  async searchSeries(query: string): Promise<SeriesLookup[]> {
    return this.http.get<SeriesLookup[]>(
      `/series/lookup?term=${encodeURIComponent(query)}`,
    );
  }
}
```

**tools.ts** -- Tool registration function. Exports a single `registerXxxTools(server, config)` function. Creates the client internally, registers all tools for this service. Groups tools by tier with comment headers.

```typescript
export function registerSonarrTools(server: McpServer, config: Config): void {
  if (!config.sonarr) {
    console.error("Sonarr not configured, skipping tool registration");
    return;
  }

  const client = new SonarrClient(config.sonarr);

  // ============================================================
  // Semantic Tools (User-Facing)
  // ============================================================

  server.tool(
    "tv_search",
    "Search for TV series by name to find TVDB IDs for adding",
    { query: z.string().describe("Series name to search for") },
    async ({ query }) => {
      try {
        const results = await client.searchSeries(query);
        return { content: [{ type: "text", text: formatResults(results) }] };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );
}
```

**types.ts** -- TypeScript interfaces matching the external API's JSON responses. No runtime code, only type definitions.

**index.ts** -- Barrel exports. Always the same pattern:
```typescript
export { SonarrClient } from "./client.js";
export { registerSonarrTools } from "./tools.js";
export * from "./types.js";
```

### Tool Registration

In `src/index.ts`, each service is conditionally registered based on config:

```typescript
const config = loadConfig();
const registry = new ProviderRegistry(config);

if (config.sonarr) registerSonarrTools(server, config);
if (config.radarr || config.radarr4k) registerRadarrTools(server, config);
if (config.plex) registerPlexTools(server, config);
if (config.sabnzbd) registerSabnzbdTools(server, config);
if (config.overseerr) registerOverseerrTools(server, config);
if (config.tmdb) registerTmdbTools(server, config);
registerSystemTools(server, config, registry);  // Always registered
```

### Error Handling

Errors are **never thrown to the MCP framework**. Every tool catch block returns errors as tool responses:

```typescript
try {
  const result = await client.doSomething();
  return { content: [{ type: "text", text: formatResult(result) }] };
} catch (error) {
  return {
    content: [{ type: "text", text: formatErrorResponse(error) }],
    isError: true,
  };
}
```

The error hierarchy:
- `ArrsError` -- base class, has `toUserMessage()` for Claude-friendly output
  - `ApiError` -- HTTP errors (401, 404, 500, etc.), includes service name and status code mapping
  - `NetworkError` -- connection failures, timeouts
  - `ConfigError` -- missing or invalid configuration
  - `ProviderNotConfiguredError` -- specific provider not configured, includes setup instructions

`formatErrorResponse()` in `src/shared/errors.ts` is the universal converter: handles `ArrsError` subclasses, plain `Error`, and unknown types.

### Cross-Service Tools

Tools in `src/tools/` span multiple services. They receive the `ProviderRegistry` and use it to check which services are available before making calls:

```typescript
export function registerLibraryAuditTool(
  server: McpServer,
  config: Config,
  registry: ProviderRegistry,
): void {
  server.tool("library_audit", "...", { ... }, async (params) => {
    // Check required providers are configured
    registry.requireProviders("plex");  // Throws ProviderNotConfiguredError if missing
    // ... use multiple service clients
  });
}
```

### Provider System

`ProviderRegistry` (`src/providers/registry.ts`) detects configured services at startup and provides a read-only query layer:

- `isConfigured(provider)` -- check a single provider
- `getConfigured()` -- list all configured providers
- `getMissing()` -- list unconfigured providers
- `requireProviders(...providers)` -- throw if any are missing
- `getCapabilities(provider)` -- get capability list for a provider
- `getFullState()` -- complete registry state with cross-provider features

### HttpClient

`HttpClient` (`src/shared/http.ts`) wraps native `fetch` with:
- `AbortController` timeouts (default 30s)
- Automatic JSON parsing with empty body handling (DELETE endpoints)
- HTTP status mapping to `ApiError`
- Connection failures mapped to `NetworkError`
- Service name propagated for contextual error messages

## Code Conventions

### Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `downloads-status.ts` |
| Classes | PascalCase | `SonarrClient` |
| Functions | camelCase | `registerSonarrTools` |
| Constants | SCREAMING_SNAKE_CASE | `PROVIDER_DEFINITIONS` |
| MCP tool names | snake_case, semantic prefix | `tv_search`, `movie_add` |
| MCP tool params | snake_case | `series_id`, `delete_files` |

### Imports
- Use `.js` extension for all local imports (Node16 module resolution)
- Use `import type { }` for type-only imports
- Barrel imports from `index.ts` when crossing module boundaries

### Zod Parameters
Always use `z.coerce.number()` and `z.coerce.boolean()` for MCP tool parameters. MCP transports send all values as strings, so coercion is required:

```typescript
series_id: z.coerce.number().describe("Sonarr series ID"),
delete_files: z.coerce.boolean().optional().describe("Also delete files"),
```

### Tool Responses
All tool responses use the same shape. Response text is plain text formatted for Claude to relay to users, not JSON:

```typescript
return {
  content: [{ type: "text", text: "Human-readable response text" }],
};
// Or on error:
return {
  content: [{ type: "text", text: formatErrorResponse(error) }],
  isError: true,
};
```

### Logging
All logging goes to `stderr` via `console.error()`. `stdout` is reserved exclusively for the MCP protocol. Never use `console.log()`.

### Entity IDs in Output
Always include entity IDs (series ID, movie ID, queue ID) in tool output so users can chain tool calls.

## Adding a New Tool

To add a new tool to an existing service (e.g., adding a new Sonarr tool):

1. **Add client method** in `src/services/sonarr/client.ts`:
   ```typescript
   async getHistory(page: number = 1): Promise<HistoryPage> {
     return this.http.get<HistoryPage>(`/history?page=${page}`);
   }
   ```

2. **Add types** in `src/services/sonarr/types.ts` if needed:
   ```typescript
   export interface HistoryPage {
     page: number;
     records: HistoryRecord[];
   }
   ```

3. **Register the tool** in `src/services/sonarr/tools.ts`, inside `registerSonarrTools()`:
   ```typescript
   server.tool(
     "sonarr_history",  // snake_case, service prefix for admin tools
     "Show recent download history in Sonarr",  // Description for Claude
     {
       page: z.coerce.number().optional().describe("Page number. Default: 1"),
     },
     async ({ page }) => {
       try {
         const history = await client.getHistory(page);
         const formatted = history.records
           .map((r) => `${r.date} - ${r.eventType}: ${r.sourceTitle}`)
           .join("\n");
         return {
           content: [{ type: "text", text: `Recent history:\n\n${formatted}` }],
         };
       } catch (error) {
         return {
           content: [{ type: "text", text: formatErrorResponse(error) }],
           isError: true,
         };
       }
     },
   );
   ```

4. **Verify** -- run `pnpm typecheck` and `pnpm lint`.

To add a new **cross-service tool** in `src/tools/`:

1. Create `src/tools/my-new-tool.ts` following the pattern of existing tools
2. Export a `registerMyNewTool(server, config, registry)` function
3. Register it in `src/tools/index.ts` inside `registerSystemTools()`
4. Use `registry.requireProviders()` to validate provider availability

## Adding a New Service

To add an entirely new service (e.g., Lidarr for music):

1. **Create the directory**: `src/services/lidarr/`

2. **Create types.ts** -- define TypeScript interfaces for the API entities:
   ```typescript
   export interface Artist {
     id: number;
     artistName: string;
     // ...
   }
   ```

3. **Create client.ts** -- implement the API client:
   ```typescript
   import { HttpClient } from "../../shared/http.js";
   import type { ServiceConfig } from "../../config.js";
   import type { Artist } from "./types.js";

   export class LidarrClient {
     private http: HttpClient;

     constructor(config: ServiceConfig) {
       this.http = new HttpClient({
         baseUrl: `${config.url}/api/v1`,
         headers: { "X-Api-Key": config.apiKey },
         serviceName: "Lidarr",
       });
     }

     async searchArtist(query: string): Promise<Artist[]> {
       return this.http.get<Artist[]>(
         `/artist/lookup?term=${encodeURIComponent(query)}`,
       );
     }
   }
   ```

4. **Create tools.ts** -- register MCP tools:
   ```typescript
   import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
   import { z } from "zod";
   import type { Config } from "../../config.js";
   import { LidarrClient } from "./client.js";
   import { formatErrorResponse } from "../../shared/errors.js";

   export function registerLidarrTools(server: McpServer, config: Config): void {
     if (!config.lidarr) {
       console.error("Lidarr not configured, skipping tool registration");
       return;
     }

     const client = new LidarrClient(config.lidarr);

     server.tool(
       "music_search",  // Semantic name, not "lidarr_artist_lookup"
       "Search for music artists by name",
       { query: z.string().describe("Artist name to search for") },
       async ({ query }) => {
         try {
           const results = await client.searchArtist(query);
           const formatted = results.map((a) => a.artistName).join("\n");
           return { content: [{ type: "text", text: formatted }] };
         } catch (error) {
           return {
             content: [{ type: "text", text: formatErrorResponse(error) }],
             isError: true,
           };
         }
       },
     );
   }
   ```

5. **Create index.ts** -- barrel exports:
   ```typescript
   export { LidarrClient } from "./client.js";
   export { registerLidarrTools } from "./tools.js";
   export * from "./types.js";
   ```

6. **Add config support** in `src/config.ts`:
   - Add `lidarr?: ServiceConfig` to the `Config` interface
   - Add env var loading in `getEnvConfig()` for `LIDARR_URL` and `LIDARR_API_KEY`
   - Add validation in `validateConfig()`

7. **Register in index.ts** (`src/index.ts`):
   ```typescript
   import { registerLidarrTools } from "./services/lidarr/tools.js";
   // ...
   if (config.lidarr) registerLidarrTools(server, config);
   ```

8. **Add to provider registry** in `src/providers/`:
   - Add `"lidarr"` to the `ProviderName` type in `types.ts`
   - Add Lidarr definition in `PROVIDER_DEFINITIONS` in `registry.ts`
   - Add detection logic in `detectConfiguredProviders()` in `registry.ts`
   - Add config info in `PROVIDER_CONFIG_INFO` in `errors.ts`

9. **Verify**: `pnpm typecheck && pnpm lint`

## Build & Development

```bash
pnpm build       # TypeScript compilation -> dist/
pnpm dev         # tsc --watch for development
pnpm start       # Run the compiled server
pnpm typecheck   # Type check without emitting (tsc --noEmit)
pnpm lint        # ESLint
pnpm format      # Prettier
```

Quality gates before committing:
- `pnpm typecheck` passes with no errors
- `pnpm lint` is clean
- `pnpm format` has been run
- No secrets in code

## Common Pitfalls

**MCP parameter types are strings.** MCP transports serialize everything as strings. Use `z.coerce.number()` and `z.coerce.boolean()`, never plain `z.number()` or `z.boolean()` for tool parameters.

**Never throw errors to the MCP framework.** Always catch in the tool handler and return `{ content: [...], isError: true }`. Uncaught errors crash the server.

**Never use console.log().** stdout is the MCP protocol channel. All logging must use `console.error()` which writes to stderr.

**Import extensions are required.** Always use `.js` in import paths (`import { foo } from "./bar.js"`), even though source files are `.ts`. This is required by Node16 module resolution.

**Empty response bodies.** Sonarr/Radarr DELETE endpoints return empty bodies. `HttpClient` handles this, but if you bypass it, calling `.json()` on an empty response throws.

**Tool names are permanent.** Once a tool name is published, clients may depend on it. Use semantic names (`tv_search`) for user-facing tools and service-prefixed names (`sonarr_queue`) for admin tools.

**Config merging.** Environment variables take precedence over `config.json`. Both are optional but at least one service must be configured or the server refuses to start.

**Radarr 4K is a separate instance.** It has its own URL, API key, and config (`radarr4k`). The `RadarrClient` accepts a display name parameter to distinguish them in error messages.

**Cross-service tools must check providers.** Always use `registry.requireProviders()` or `registry.isConfigured()` before creating service clients in cross-service tools. Missing providers should produce helpful error messages, not crashes.
