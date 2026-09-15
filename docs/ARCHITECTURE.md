# Architecture

## Overview

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
- **Semantic tools** (user-facing): `tv_search`, `movie_add`, `library_search` — named for what the user wants to do
- **Admin tools** (service-specific): `sonarr_queue`, `radarr_profiles` — prefixed with service name
- **System tools** (cross-service): `system_health`, `library_audit` — always registered, use ProviderRegistry to check availability

## Directory structure

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

## Key patterns

### Service module pattern (4-file structure)

Every service under `src/services/<name>/` has exactly four files:

**client.ts** — API client class. Wraps `HttpClient`, provides typed methods per API endpoint. Constructor takes a `ServiceConfig` (url + apiKey) or service-specific config. All HTTP details are encapsulated here.

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

**tools.ts** — Tool registration function. Exports a single `registerXxxTools(server, config)` function. Creates the client internally, registers all tools for this service. Groups tools by tier with comment headers.

```typescript
export function registerSonarrTools(server: McpServer, config: Config): void {
  if (!config.sonarr) {
    console.error("Sonarr not configured, skipping tool registration");
    return;
  }
  const client = new SonarrClient(config.sonarr);
  server.tool(
    "tv_search",
    "Search for TV series by name to find TVDB IDs for adding",
    { query: z.string().describe("Series name to search for") },
    async ({ query }) => {
      try {
        const results = await client.searchSeries(query);
        return { content: [{ type: "text", text: formatResults(results) }] };
      } catch (error) {
        return { content: [{ type: "text", text: formatErrorResponse(error) }], isError: true };
      }
    },
  );
}
```

**types.ts** — TypeScript interfaces matching the external API's JSON responses. No runtime code, only type definitions.

**index.ts** — Barrel exports, always the same pattern:
```typescript
export { SonarrClient } from "./client.js";
export { registerSonarrTools } from "./tools.js";
export * from "./types.js";
```

### Tool registration

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

### Error handling

Errors are **never thrown to the MCP framework**. Every tool catch block returns errors as tool responses:

```typescript
try {
  const result = await client.doSomething();
  return { content: [{ type: "text", text: formatResult(result) }] };
} catch (error) {
  return { content: [{ type: "text", text: formatErrorResponse(error) }], isError: true };
}
```

The error hierarchy:
- `ArrsError` — base class, has `toUserMessage()` for Claude-friendly output
  - `ApiError` — HTTP errors (401, 404, 500, etc.), includes service name and status code mapping
  - `NetworkError` — connection failures, timeouts
  - `ConfigError` — missing or invalid configuration
  - `ProviderNotConfiguredError` — specific provider not configured, includes setup instructions

`formatErrorResponse()` in `src/shared/errors.ts` is the universal converter: handles `ArrsError` subclasses, plain `Error`, and unknown types.

### Cross-service tools

Tools in `src/tools/` span multiple services. They receive the `ProviderRegistry` and use it to check which services are available before making calls:

```typescript
export function registerLibraryAuditTool(
  server: McpServer,
  config: Config,
  registry: ProviderRegistry,
): void {
  server.tool("library_audit", "...", { ... }, async (params) => {
    registry.requireProviders("plex");  // Throws ProviderNotConfiguredError if missing
    // ... use multiple service clients
  });
}
```

### Provider system

`ProviderRegistry` (`src/providers/registry.ts`) detects configured services at startup and provides a read-only query layer:
- `isConfigured(provider)` — check a single provider
- `getConfigured()` — list all configured providers
- `getMissing()` — list unconfigured providers
- `requireProviders(...providers)` — throw if any are missing
- `getCapabilities(provider)` — get capability list for a provider
- `getFullState()` — complete registry state with cross-provider features

### HttpClient

`HttpClient` (`src/shared/http.ts`) wraps native `fetch` with:
- `AbortController` timeouts (default 30s)
- Automatic JSON parsing with empty body handling (DELETE endpoints)
- HTTP status mapping to `ApiError`
- Connection failures mapped to `NetworkError`
- Service name propagated for contextual error messages

## Code conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `downloads-status.ts` |
| Classes | PascalCase | `SonarrClient` |
| Functions | camelCase | `registerSonarrTools` |
| Constants | SCREAMING_SNAKE_CASE | `PROVIDER_DEFINITIONS` |
| MCP tool names | snake_case, semantic prefix | `tv_search`, `movie_add` |
| MCP tool params | snake_case | `series_id`, `delete_files` |

- Use `.js` extension for all local imports (Node16 module resolution); `import type { }` for type-only imports; barrel imports from `index.ts` when crossing module boundaries.
- Always use `z.coerce.number()` / `z.coerce.boolean()` for MCP tool parameters — MCP transports send all values as strings.
- All tool responses use plain text formatted for Claude to relay to users, not JSON (see Error handling above for the shape).
- All logging goes to `stderr` via `console.error()`. Never `console.log()` — stdout is the MCP protocol channel.
- Always include entity IDs (series ID, movie ID, queue ID) in tool output so users can chain tool calls.
