# Implementation Plan: Library Intelligence

**Branch**: `0090-library-intelligence` | **Date**: 2026-01-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/0090-library-intelligence/spec.md`

## Summary

Add stateless library intelligence tools for cross-service consistency analysis, batch sync operations, smart cleanup recommendations, and viewing analytics. Implementation follows the established `cleanup-analysis.ts` pattern for service aggregation with error isolation.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @modelcontextprotocol/sdk, zod for validation, native fetch
**Storage**: N/A - stateless operation, no database
**Testing**: Manual testing with Claude Desktop/Code (per constitution)
**Target Platform**: Node.js 20+ LTS
**Project Type**: Single MCP server project
**Performance Goals**: All tools complete in <30s for 1000+ item libraries
**Constraints**: Stateless (no caching between calls), HD-first quality defaults
**Scale/Scope**: Large media libraries (1000+ movies, 100+ TV series)

## Constitution Check

_GATE: Verified against `.specify/memory/constitution.md`_

| Principle | Status | Notes |
|-----------|--------|-------|
| Natural Language First | PASS | Tools use semantic names: `library_audit`, `library_sync`, `space_planner` |
| Safety by Default | PASS | `library_sync` defaults to dry-run (confirm=false), HD quality first |
| Plugin Architecture | PASS | New tools in `src/tools/` following existing patterns |
| Stateless Operation | PASS | No database, no caching, fresh data on each request |
| Two-Tier Tool Design | PASS | Core tools for common workflows, enhanced params for power users |

## Project Structure

### Documentation (this feature)

```text
specs/0090-library-intelligence/
├── discovery.md         # Codebase examination and decisions
├── spec.md              # Feature specification
├── plan.md              # This file
├── requirements.md      # Requirements checklist
├── tasks.md             # Task breakdown
└── checklists/
    ├── implementation.md
    └── verification.md
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── plex/
│   │   ├── client.ts    # Extend with matching/index methods
│   │   ├── tools.ts     # Enhance plex_watched_old, plex_unwatched
│   │   └── types.ts     # Add OrphanItem, etc.
│   ├── sonarr/
│   │   ├── client.ts    # Add series matching methods
│   │   └── types.ts
│   ├── radarr/
│   │   ├── client.ts    # Add movie matching methods
│   │   └── types.ts
│   └── tmdb/
│       └── client.ts    # Collection lookups for completeness check
├── tools/
│   ├── index.ts         # Register new tools
│   ├── library-audit.ts       # NEW: Unified audit tool
│   ├── library-sync.ts        # NEW: Batch sync operations
│   ├── space-planner.ts       # NEW: Smart cleanup recommendations
│   └── watch-analytics.ts     # NEW: Viewing statistics
├── shared/
│   └── matching.ts      # NEW: ID-based matching utilities
└── providers/
    └── registry.ts      # Use for service validation
```

**Structure Decision**: New tools added to `src/tools/` following existing `cleanup-analysis.ts` pattern. Shared matching utilities extracted to `src/shared/matching.ts` for reuse across tools.

## Implementation Approach

### Phase 1: Shared Infrastructure

1. **Matching Utilities** (`src/shared/matching.ts`)
   - `buildMovieIndex(movies)` - Map-based O(1) lookups by IMDB/TMDB/title+year
   - `buildSeriesIndex(series)` - Similar for TV series by TVDB/title+year
   - `matchMovie(plexItem, radarrMovie)` - ID-first, title+year fallback with ±1 year tolerance
   - `matchSeries(plexItem, sonarrSeries)` - Similar for TV

2. **Client Extensions**
   - PlexClient: `getAllMovies()`, `getAllSeries()` methods for complete library scan
   - RadarrClient: Already has `getAllMovies()`
   - SonarrClient: Already has `getAllSeries()`

### Phase 2: Library Audit Tool

1. **Tool Registration** (`src/tools/library-audit.ts`)
   - Zod schema for `check` parameter with enum validation
   - Service aggregation pattern from cleanup-analysis.ts
   - Per-check handler functions

2. **Check Implementations**
   - `auditOrphans()` - Plex items not in *arr
   - `auditMissing()` - *arr items not in Plex
   - `auditDownloads()` - Sabnzbd stuck items
   - `auditQuality()` - 4K routing issues (bidirectional)
   - `auditCollections()` - Incomplete TMDB collections
   - `auditEnded()` - Ended series review

### Phase 3: Library Sync Tool

1. **Dry-Run Mode** (default)
   - Build list of items to sync
   - Return preview without modification

2. **Execute Mode** (confirm=true)
   - Use `movie_add` / `tv_add` patterns
   - Per-item success/failure tracking
   - Summary report

### Phase 4: Space Planner Tool

1. **Data Collection**
   - Fetch all items with watch history from Plex
   - Include file sizes from Media array
   - Use stored ratings (critic/audience)

2. **Scoring Algorithm**
   ```typescript
   function calculateCleanupScore(item: PlexItem): number {
     const sizeGb = item.sizeBytes / (1024 * 1024 * 1024);
     const daysSinceWatched = daysSince(item.lastViewedAt);
     const rating = item.rating || 5.0; // Default to neutral
     const rewatchFactor = getRewatchFactor(item.genres); // 0.5-1.5
     return (sizeGb * daysSinceWatched) / (rating * rewatchFactor);
   }
   ```

3. **Results**
   - Sort by score descending
   - Running total until target_gb reached
   - Show score breakdown for each item

### Phase 5: Watch Analytics Tool

1. **Data Aggregation**
   - Query Plex for watch history
   - Aggregate by period (month/year/all)
   - Compute counts, durations, genres

2. **Statistics**
   - Total movies/episodes watched
   - Estimated watch time (via runtime metadata)
   - Most-watched content
   - Genre breakdown

### Phase 6: Enhanced Plex Tools

1. **plex_watched_old enhancements**
   - Add `show_size` parameter with totals
   - Add `sort: "size"` option
   - Add `ended_only` filter

2. **plex_unwatched enhancements**
   - Add `show_size` parameter with totals
   - Add `show_rating` parameter
   - Add `sort: "size"` option

## Error Handling Strategy

Following cleanup-analysis.ts pattern:

```typescript
const serviceStatus: ServiceStatus[] = [];

if (config.plex) {
  try {
    const plexClient = new PlexClient(config.plex);
    // ... operations
    serviceStatus.push({ name: "Plex", available: true });
  } catch (error) {
    serviceStatus.push({ name: "Plex", available: false, error: formatErrorResponse(error) });
  }
}

// Continue with other services even if one fails
```

## Performance Considerations

1. **Batch Processing**: Process items in chunks for large libraries
2. **Map-Based Indexes**: O(1) lookups instead of O(n) searches
3. **Parallel Fetches**: Use Promise.all for independent service calls
4. **Early Exit**: Stop processing when target_gb reached in space_planner

## Complexity Tracking

No constitution violations. All approaches follow established patterns.
