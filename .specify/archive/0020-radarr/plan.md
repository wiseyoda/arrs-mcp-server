# Implementation Plan: Radarr Integration

**Branch**: `0020-radarr` | **Date**: 2026-01-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/0020-radarr/spec.md`

## Summary

Implement Radarr (HD) and Radarr4K movie management following the established patterns from Phase 0010 Sonarr. Create a self-contained service module at `src/services/radarr/` with API client, types, and MCP tool registrations. Add quality-based routing that defaults to HD for safety. Update cross-service tools to aggregate Radarr data.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @modelcontextprotocol/sdk, zod ^3.25, native fetch
**Storage**: N/A (stateless, queries Radarr API directly)
**Testing**: Manual testing with Claude Desktop/Code
**Target Platform**: Node.js 20+ LTS
**Project Type**: Single MCP server
**Performance Goals**: Tool responses within 30 seconds
**Constraints**: stdout reserved for MCP protocol, logging to stderr only

## Constitution Check

_GATE: Passed - Implementation follows all constitution principles_

| Principle | Compliance |
|-----------|------------|
| Natural Language First | Tools named semantically (movie_search, not radarr_lookup) |
| Safety by Default | Quality defaults to 'hd', 4K only on explicit request |
| Plugin Architecture | Self-contained in src/services/radarr/ |
| Stateless Operation | No caching, queries live API each call |
| Two-Tier Tools | Semantic tools for 80%, service-specific for admin |

## Project Structure

### Documentation (this feature)

```text
specs/0020-radarr/
├── discovery.md         # Codebase context and scope (complete)
├── spec.md              # Feature specification (complete)
├── requirements.md      # Requirements checklist (complete)
├── plan.md              # This file (complete)
├── tasks.md             # Task breakdown
└── checklists/
    ├── implementation.md
    └── verification.md
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── sonarr/          # Existing (Phase 0010)
│   │   ├── client.ts
│   │   ├── types.ts
│   │   ├── tools.ts
│   │   └── index.ts
│   └── radarr/          # NEW (this phase)
│       ├── client.ts    # RadarrClient class - API operations
│       ├── types.ts     # Movie, QueueItem, QualityProfile, etc.
│       ├── tools.ts     # MCP tool registrations
│       └── index.ts     # Barrel exports
├── tools/
│   ├── system-health.ts # UPDATE - add Radarr checks
│   ├── downloads-status.ts # UPDATE - add Radarr queue
│   └── index.ts
├── shared/
│   ├── http-client.ts   # Reuse existing
│   └── errors.ts        # Reuse existing
├── config.ts            # UPDATE - add radarr/radarr4k config
└── index.ts             # UPDATE - register Radarr tools
```

**Structure Decision**: Follow existing single-project structure with service modules. Radarr module mirrors Sonarr exactly.

## Technical Approach

### 1. Quality Routing Pattern

```typescript
// Central routing function for all Radarr tools
function getRadarrClient(
  quality: 'hd' | '4k' = 'hd',
  config: Config
): RadarrClient {
  if (quality === '4k') {
    if (!config.radarr4k) {
      throw new ArrsError('Radarr4K not configured. Cannot process 4K request.');
    }
    return new RadarrClient(config.radarr4k);
  }
  if (!config.radarr) {
    throw new ArrsError('Radarr not configured.');
  }
  return new RadarrClient(config.radarr);
}
```

### 2. API Client Structure

RadarrClient methods mirror SonarrClient patterns:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `searchMovies(query)` | GET /movie/lookup?term= | Search for movies |
| `getAllMovies()` | GET /movie | List library |
| `getMovie(id)` | GET /movie/{id} | Get single movie |
| `addMovie(request)` | POST /movie | Add to library |
| `deleteMovie(id, options)` | DELETE /movie/{id} | Remove from library |
| `getQueue()` | GET /queue | Download queue |
| `getQueueDetails()` | GET /queue/details | Detailed queue |
| `getQualityProfiles()` | GET /qualityprofile | List profiles |
| `getRootFolders()` | GET /rootfolder | List folders |
| `searchMovie(id)` | POST /command | Trigger search |
| `getHealth()` | GET /health | Health check |
| `getStuckItems()` | (derived) | Filter stuck queue items |

### 3. Type Definitions

Core types based on Radarr v3 API:

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

interface MovieLookup extends Movie {
  // Additional fields from lookup endpoint
  overview?: string;
  remotePoster?: string;
}

interface AddMovieRequest {
  tmdbId: number;
  rootFolderPath: string;
  qualityProfileId: number;
  monitored?: boolean;
  addOptions?: {
    searchForMovie?: boolean;
  };
}
```

### 4. Tool Registration Pattern

Follow Sonarr tools.ts structure:

1. Check config exists, early return if not
2. Instantiate client once
3. Define helper formatters at top
4. Register semantic tools first (movie_search, movie_add, etc.)
5. Register service-specific tools second (radarr_queue, etc.)
6. All tools use try/catch with formatErrorResponse

### 5. movie_list Implementation

Follow tv_list pattern with movie-specific filters:

```typescript
server.tool(
  "movie_list",
  "List all movies in your library with filtering and sorting options",
  {
    // Filters
    status: z.enum(["released", "inCinemas", "announced", "all"]).optional(),
    quality: z.enum(["hd", "4k"]).optional(),
    genre: z.string().optional(),
    missing_only: z.coerce.boolean().optional(),
    unmonitored_only: z.coerce.boolean().optional(),
    // Sorting
    sort: z.enum(["title", "size", "added", "year", "rating"]).optional(),
    limit: z.coerce.number().optional(),
    // Display options
    show_size: z.coerce.boolean().optional(),
    show_rating: z.coerce.boolean().optional(),
    show_runtime: z.coerce.boolean().optional(),
    show_added: z.coerce.boolean().optional(),
  },
  async (params) => { /* implementation */ }
);
```

### 6. Cross-Service Updates

**downloads_status.ts** changes:
- Add Radarr section after Sonarr
- Create RadarrClient if config.radarr exists
- Fetch queue and add to unified downloads array
- Source marked as "Radarr" or "Radarr4K"

**system_health.ts** changes:
- Add Radarr health check after Sonarr
- Create RadarrClient if config.radarr exists
- Call getHealth() and getStuckItems()
- Report connectivity issues and stuck items

### 7. Configuration Updates

**config.ts** additions:

```typescript
export interface Config {
  sonarr?: ServiceConfig;
  radarr?: ServiceConfig;    // NEW
  radarr4k?: ServiceConfig;  // NEW
  plex?: PlexConfig;
  sabnzbd?: ServiceConfig;
}

// Environment variable support
RADARR_URL, RADARR_API_KEY
RADARR4K_URL, RADARR4K_API_KEY
```

## Implementation Order

1. **Phase 1: Types & Client** (Foundation)
   - Create types.ts with all Radarr types
   - Create client.ts with RadarrClient class
   - Create index.ts with exports

2. **Phase 2: Configuration**
   - Update config.ts for radarr/radarr4k
   - Update validation and logging

3. **Phase 3: Semantic Tools**
   - movie_search
   - movie_add
   - movie_list (with full filtering/sorting)
   - movie_upgrade
   - movie_delete

4. **Phase 4: Admin Tools**
   - radarr_queue
   - radarr_details
   - radarr_profiles
   - radarr_folders
   - radarr_stuck
   - radarr_import
   - radarr_blacklist

5. **Phase 5: Integration**
   - Update downloads_status
   - Update system_health
   - Register tools in index.ts

6. **Phase 6: Testing & Polish**
   - Manual testing with Claude
   - Error message refinement
   - TypeScript strict compliance

## Complexity Tracking

No constitution violations - implementation follows all established patterns.
