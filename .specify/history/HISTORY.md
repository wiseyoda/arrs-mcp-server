# Completed Phases

> Archive of completed development phases. Newest first.

---

## 0020 - radarr

**Completed**: 2026-01-25

# Phase 0020: Radarr (Movies)

**Status**: Not Started
**Branch**: `0020-radarr`
**Estimated Scope**: Medium (follows established patterns from Phase 0010)

---

## Goals

1. Build Radarr API client following the established service module pattern
2. Implement all Radarr semantic tools (movie_search, movie_add, movie_list, movie_upgrade, movie_delete)
3. Implement Radarr admin tools (queue, details, profiles, stuck, import, blacklist)
4. Add Radarr4K routing with safety-first defaults (HD unless explicitly requested)
5. Update cross-service tools (downloads_status, system_health) to include Radarr
6. Enhance movie_list with filtering/sorting/display options (like tv_list)

---

## Scope

### In Scope

- `src/services/radarr/` module (client.ts, types.ts, tools.ts, index.ts)
- All movie tools from api-standards.md
- Radarr4K routing via `quality` parameter
- Integration with existing cross-service tools
- Configuration schema for radarr and radarr4k

### Out of Scope

- Plex, Sabnzbd (Phase 0030, 0040)
- Overseerr integration (future consideration)
- Collection management (future enhancement)

---

## Deliverables

1. **Radarr API Client**
   - `src/services/radarr/client.ts` - API client with all methods
   - `src/services/radarr/types.ts` - TypeScript types for Radarr v3 API
   - `src/services/radarr/tools.ts` - MCP tool registrations
   - `src/services/radarr/index.ts` - Exports

2. **Semantic Tools (5)**
   - `movie_search` - Search for movies by name
   - `movie_add` - Add movie to library
   - `movie_list` - List all movies with filtering/sorting
   - `movie_upgrade` - Search for better quality version
   - `movie_delete` - Remove movie from library

3. **Admin Tools (6)**
   - `radarr_queue` - Download queue with progress/ETA/errors
   - `radarr_details` - Detailed info for one movie
   - `radarr_profiles` - List quality profiles
   - `radarr_stuck` - Stuck imports
   - `radarr_import` - Trigger manual import
   - `radarr_blacklist` - Blacklist and re-search

4. **Cross-Service Updates**
   - Update `downloads_status` to include Radarr queues
   - Update `system_health` to check Radarr connectivity

---

## Design Decisions (Inherited from Phase 0010)

### Technical Patterns

| Decision | Value | Rationale |
|----------|-------|-----------|
| HTTP Client | Native fetch | No external dependencies, sufficient for needs |
| Output Format | Simple text | Readable, token-efficient |
| Parameter Types | z.coerce.number() | MCP passes numbers as strings |
| Module Pattern | client/types/tools per service | Clean separation, testable |
| List Tools | Filtering + sorting + display options | User requested during Phase 0010 |

### Radarr4K Safety (Constitution Principle II)

```typescript
// Default: HD (regular Radarr) - SAFE
movie_search({ query: "inception" })  // quality defaults to 'hd'

// 4K only when explicitly requested
movie_search({ query: "inception", quality: "4k" })

// Implementation pattern
function getRadarrConfig(quality: 'hd' | '4k' = 'hd') {
  return quality === '4k' ? config.radarr4k : config.radarr;
}
```

**Trigger words for 4K**: "4K", "4k", "UHD", "2160p"

---

## Radarr API Reference

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v3/movie/lookup?term=` | GET | Search for movies |
| `/api/v3/movie` | GET | List all movies |
| `/api/v3/movie` | POST | Add movie |
| `/api/v3/movie/{id}` | DELETE | Delete movie |
| `/api/v3/queue` | GET | Download queue |
| `/api/v3/qualityprofile` | GET | Quality profiles |
| `/api/v3/rootfolder` | GET | Root folders |
| `/api/v3/command` | POST | Trigger commands |

### Authentication

- Header: `X-Api-Key: {apiKey}`
- Same pattern as Sonarr

### Key Types

```typescript
interface Movie {
  id: number;
  title: string;
  tmdbId: number;
  imdbId?: string;
  year: number;
  status: 'released' | 'inCinemas' | 'announced' | 'deleted';
  hasFile: boolean;
  monitored: boolean;
  path: string;
  qualityProfileId: number;
  sizeOnDisk: number;
  runtime: number;
  genres: string[];
  ratings: { imdb?: number; tmdb?: number; rottenTomatoes?: number };
  added: string;
}
```

---

## movie_list Enhancement

Following the pattern established for tv_list, movie_list should support:

**Filters:**
- `status`: released | inCinemas | announced | all
- `quality`: hd | 4k (routes to appropriate Radarr instance)
- `genre`: partial match filter
- `missing_only`: only movies without files
- `unmonitored_only`: only unmonitored movies

**Sorting:**
- `title`: A-Z (default)
- `size`: largest first
- `added`: newest first
- `year`: newest first
- `rating`: highest rated first

**Display Options:**
- `show_size`: disk size
- `show_rating`: IMDB/TMDB rating
- `show_runtime`: movie length
- `show_added`: date added
- `limit`: max results

---

## Verification Gate

Movie tools work correctly:

- [ ] `movie_search` finds movies by name
- [ ] `movie_add` adds with HD quality by default
- [ ] `movie_add` with `quality: '4k'` routes to Radarr4K
- [ ] `movie_list` shows all movies with filtering/sorting
- [ ] `movie_delete` removes movies correctly
- [ ] `radarr_queue` shows queue for both HD and 4K
- [ ] 4K routing ONLY happens with explicit request
- [ ] `downloads_status` includes Radarr queues
- [ ] `system_health` checks Radarr connectivity

---

## Dependencies

- Phase 0010 (Foundation + Sonarr) must be complete

---

## Technical Notes

### Dual Instance Configuration

```json
{
  "radarr": {
    "url": "http://localhost:7878",
    "apiKey": "..."
  },
  "radarr4k": {
    "url": "http://localhost:7879",
    "apiKey": "..."
  }
}
```

### Quality Parameter Pattern

Every tool that interacts with movies should accept `quality?: 'hd' | '4k'` parameter with `'hd'` as default. This ensures:

1. Safe default behavior
2. Explicit 4K routing when requested
3. Consistent interface across all movie tools


---

## 0010 - foundation-sonarr

**Completed**: 2026-01-25

# Phase 0010: Foundation + Sonarr

**Status**: Not Started
**Branch**: `0010-foundation-sonarr`
**Estimated Scope**: Medium (full MCP server setup + Sonarr integration)

---

## Goals

1. Create a working MCP server that connects to Claude Desktop and Claude Code
2. Implement configuration loading from JSON file and environment variables
3. Build Sonarr API client with proper error handling
4. Implement all Sonarr semantic tools (tv_search, tv_add, tv_list, tv_episodes, tv_search_missing)
5. Implement Sonarr admin tools (queue, details, delete, profiles, folders, stuck, import, blacklist, calendar)
6. Implement cross-service tools (downloads_status, system_health, media_help)
7. Create helpful documentation

---

## Scope

### In Scope

- TypeScript project setup with pnpm
- MCP SDK integration and stdio transport
- Configuration loading (config.json + env vars fallback)
- Sonarr v3 API client
- All Sonarr tools listed in ROADMAP Phase 1
- Cross-service utility tools
- Error handling with helpful messages
- README documentation

### Out of Scope

- Radarr, Plex, Sabnzbd (future phases)
- Web UI
- Authentication/authorization beyond API keys
- Automated testing (manual testing sufficient for MVP)

---

## Deliverables

1. **Project Setup**
   - `package.json` with dependencies
   - TypeScript configuration
   - Build scripts
   - `.gitignore`

2. **Configuration**
   - `config.example.json` template
   - Config loader supporting JSON + env vars
   - Type-safe config interface

3. **MCP Server**
   - Main server entry point
   - Tool registration
   - Error handling middleware

4. **Sonarr Integration**
   - `src/services/sonarr/client.ts` - API client
   - `src/services/sonarr/types.ts` - TypeScript types
   - `src/services/sonarr/tools.ts` - MCP tool definitions

5. **Cross-Service Tools**
   - `src/tools/downloads-status.ts`
   - `src/tools/system-health.ts`
   - `src/tools/media-help.ts`

6. **Documentation**
   - `README.md` with setup instructions
   - Claude Desktop configuration example
   - Claude Code configuration example

---

## Verification Gate

**USER GATE** - Requires user to verify:

- [ ] MCP server starts without errors (`pnpm start` or `node dist/index.js`)
- [ ] Works with Claude Desktop (add to config, restart, use tools)
- [ ] Works with Claude Code (add to settings, use tools)
- [ ] `tv_search` - Can search for a series by name
- [ ] `tv_add` - Can add a series with quality/monitor options
- [ ] `tv_list` - Can list all series with status
- [ ] `tv_episodes` - Can view episode status for a series
- [ ] `tv_search_missing` - Can trigger search for missing episodes
- [ ] `sonarr_queue` - Can see queue with progress, ETA, and errors
- [ ] `sonarr_stuck` - Can see and fix stuck imports
- [ ] `sonarr_blacklist` - Can blacklist release and re-search
- [ ] `system_health` - Health check reports issues correctly
- [ ] Error messages are helpful when things fail

---

## Dependencies

- None (first phase)

---

## Technical Notes

### MCP SDK Usage

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

### Sonarr API

- Base URL: `http://host:port/api/v3`
- Auth: `X-Api-Key` header
- Key endpoints:
  - `GET /series` - list all series
  - `POST /series` - add series
  - `GET /series/lookup?term=` - search
  - `GET /queue` - download queue
  - `GET /episode?seriesId=` - episodes for series
  - `POST /command` - trigger commands (search, import)

### Configuration Priority

1. Environment variables (for secrets)
2. `config.json` (for local dev)
3. Default values where sensible


---

