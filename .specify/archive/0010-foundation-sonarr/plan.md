# Implementation Plan: Foundation + Sonarr

**Branch**: `0010-foundation-sonarr` | **Date**: 2025-01-24 | **Spec**: [spec.md](./spec.md)

## Summary

Build a TypeScript MCP server that integrates with Sonarr for TV show management. The server will use stdio transport to communicate with Claude Desktop and Claude Code, providing 17 tools for searching, adding, and managing TV shows through natural language.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @modelcontextprotocol/sdk, zod ^3.25
**Storage**: N/A (stateless - all data in Sonarr)
**Testing**: Manual testing against running Sonarr instance
**Target Platform**: Node.js 20+ LTS (macOS, Linux)
**Project Type**: Single CLI application
**Performance Goals**: Startup < 2 seconds, tool response < 5 seconds
**Constraints**: Stateless operation, no stdout except MCP protocol
**Scale/Scope**: Single-user local server, 17 tools

## Constitution Check

_GATE: Verified against .specify/memory/constitution.md_

| Principle | Status | Notes |
|-----------|--------|-------|
| Natural Language First | PASS | Semantic tool names (tv_search, tv_add) |
| Safety by Default | PASS | No destructive operations without explicit params |
| Plugin Architecture | PASS | Services in src/services/{name}/ |
| Stateless Operation | PASS | No caching, each request independent |
| Two-Tier Tool Design | PASS | Semantic + service-specific tools |

## Project Structure

### Documentation (this feature)

```text
specs/0010-foundation-sonarr/
├── discovery.md         # Codebase findings
├── spec.md              # Feature specification
├── requirements.md      # Requirements checklist
├── plan.md              # This file
├── tasks.md             # Task breakdown
└── checklists/
    ├── implementation.md
    └── verification.md
```

### Source Code (repository root)

```text
src/
├── index.ts                    # MCP server entry point
├── config.ts                   # Configuration loader
├── services/
│   └── sonarr/
│       ├── client.ts           # Sonarr API client
│       ├── types.ts            # TypeScript types for Sonarr
│       └── tools.ts            # MCP tool registrations
├── tools/
│   ├── downloads-status.ts     # Cross-service download status
│   ├── system-health.ts        # Cross-service health check
│   └── media-help.ts           # System overview tool
└── shared/
    ├── http.ts                 # HTTP utilities (fetch wrapper)
    └── errors.ts               # Error handling utilities

config.example.json             # Configuration template
package.json                    # Dependencies and scripts
tsconfig.json                   # TypeScript configuration
README.md                       # Setup and usage documentation
```

**Structure Decision**: Single project layout with service modules. Each service (Sonarr now, Radarr/Plex/Sabnzbd later) gets its own directory under `src/services/`.

---

## Implementation Phases

### Phase 1: Project Foundation

Setup the TypeScript project with all configuration and the basic MCP server that can start and respond to tool calls.

**Files**:
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript strict mode configuration
- `.gitignore` - Ignore node_modules, dist, config.json
- `src/index.ts` - MCP server entry point
- `src/config.ts` - Configuration loader

**Dependencies**:
```json
{
  "@modelcontextprotocol/sdk": "latest",
  "zod": "^3.25"
}
```

**Dev Dependencies**:
```json
{
  "typescript": "^5.0.0",
  "@types/node": "^20.0.0"
}
```

### Phase 2: Sonarr Client

Build the Sonarr API client with all necessary methods for the tools.

**Files**:
- `src/services/sonarr/types.ts` - TypeScript types
- `src/services/sonarr/client.ts` - API client class
- `src/shared/http.ts` - Fetch wrapper with error handling

**API Methods Needed**:
- `searchSeries(query: string)` - GET /series/lookup
- `getSeries(id: number)` - GET /series/{id}
- `getAllSeries()` - GET /series
- `addSeries(series: AddSeriesRequest)` - POST /series
- `deleteSeries(id: number, deleteFiles: boolean)` - DELETE /series/{id}
- `getEpisodes(seriesId: number)` - GET /episode
- `getQueue()` - GET /queue
- `getQueueDetails()` - GET /queue/details
- `getProfiles()` - GET /qualityprofile
- `getRootFolders()` - GET /rootfolder
- `getCalendar(start: Date, end: Date)` - GET /calendar
- `executeCommand(name: string, params: object)` - POST /command
- `deleteQueueItem(id: number, options: object)` - DELETE /queue/{id}
- `getHealth()` - GET /health

### Phase 3: Sonarr Tools

Register all 14 Sonarr-related MCP tools (5 semantic + 9 admin).

**Files**:
- `src/services/sonarr/tools.ts` - All tool registrations

**Tool Registration Pattern**:
```typescript
export function registerSonarrTools(server: McpServer, config: Config) {
  const client = new SonarrClient(config.sonarr);

  server.tool("tv_search", {
    description: "Search for TV series by name",
    inputSchema: { query: z.string().describe("Series name to search for") },
  }, async ({ query }) => {
    const results = await client.searchSeries(query);
    return { content: [{ type: "text", text: formatResults(results) }] };
  });

  // ... more tools
}
```

### Phase 4: Cross-Service Tools

Implement the three cross-service tools.

**Files**:
- `src/tools/downloads-status.ts` - Unified download view
- `src/tools/system-health.ts` - Health check
- `src/tools/media-help.ts` - System overview

For Phase 1, these tools only interact with Sonarr. Future phases add Radarr, Plex, Sabnzbd.

### Phase 5: Documentation

Create documentation for setup and usage.

**Files**:
- `README.md` - Complete setup guide
- `config.example.json` - Configuration template

---

## API Reference

### Sonarr v3 API

Base URL: `{SONARR_URL}/api/v3`
Auth: `X-Api-Key: {SONARR_API_KEY}`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/series/lookup?term={query}` | GET | Search for series |
| `/series` | GET | List all series |
| `/series` | POST | Add series |
| `/series/{id}` | GET | Get series details |
| `/series/{id}` | DELETE | Delete series |
| `/episode?seriesId={id}` | GET | Get episodes |
| `/queue` | GET | Download queue |
| `/queue/details` | GET | Detailed queue info |
| `/queue/{id}` | DELETE | Remove from queue |
| `/qualityprofile` | GET | List quality profiles |
| `/rootfolder` | GET | List root folders |
| `/calendar` | GET | Upcoming episodes |
| `/command` | POST | Execute command (search, import) |
| `/health` | GET | Health status |

---

## Error Handling Strategy

### Configuration Errors

```typescript
if (!config.sonarr?.url || !config.sonarr?.apiKey) {
  throw new Error(
    "Sonarr not configured. Set SONARR_URL and SONARR_API_KEY " +
    "environment variables or add sonarr config to config.json"
  );
}
```

### API Errors

```typescript
async function handleApiError(response: Response, service: string) {
  if (response.status === 401) {
    return `${service} authentication failed. Check your API key.`;
  }
  if (response.status === 404) {
    return `${service} resource not found.`;
  }
  if (!response.ok) {
    return `${service} error: ${response.statusText}`;
  }
}
```

### Network Errors

```typescript
try {
  const result = await client.getSeries();
} catch (error) {
  if (error.code === 'ECONNREFUSED') {
    return `Cannot connect to Sonarr. Is it running at ${config.sonarr.url}?`;
  }
  return `Network error: ${error.message}`;
}
```

---

## Complexity Tracking

No constitution violations. Project follows all established patterns:
- Single project structure (not exceeding 3 projects)
- No unnecessary abstractions
- Direct API calls (no repository pattern needed)
- Simple configuration (JSON + env vars)
