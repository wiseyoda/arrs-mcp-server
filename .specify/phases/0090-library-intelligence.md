# Phase 0090: Library Intelligence (Stateless)

**Status**: Not Started
**Branch**: `0090-library-intelligence`
**Estimated Scope**: Medium (cross-provider tools, no persistent state)

---

## Goals

1. Single flexible `library_audit` tool for all consistency/orphan/quality analysis
2. Batch `library_sync` tool to act on audit findings
3. Smart `space_planner` with scoring algorithm for cleanup decisions
4. Basic `watch_analytics` for viewing statistics
5. Enhance existing Plex cleanup tools (no duplicates)

---

## Scope

### In Scope

- Stateless consistency analysis via unified audit tool
- Orphan detection across all services
- Incomplete collection detection
- Quality routing validation (4K mismatches)
- Batch sync operations with confirmation
- Smart space planning with value scoring
- Basic watch analytics
- Enhancement of existing `plex_watched_old` and `plex_unwatched` tools
- Uses provider registry from Phase 0080

### Out of Scope

- Undo capability (stateless - no audit log)
- Persistent rules (no database)
- Automatic remediation (always manual confirmation)
- File-level operations (moving files between libraries)
- Advanced analytics (time-of-day, seasonal patterns)

---

## Deliverables

### 1. Library Audit Tool (Unified)

Single tool replaces 5+ separate tools from original design.

| Parameter | Description |
|-----------|-------------|
| `check: "all"` | Full consistency report (default) |
| `check: "orphans"` | Plex items not tracked in Sonarr/Radarr |
| `check: "missing"` | Sonarr/Radarr items not in Plex |
| `check: "downloads"` | Downloads that never imported |
| `check: "quality"` | 4K content in wrong Radarr instance |
| `check: "collections"` | Incomplete TMDB collections in library |
| `check: "ended"` | Ended/completed series for review |

**Requires**: Plex + (Sonarr or Radarr), varies by check type

**Example - Full audit:**
```
User: "Are my libraries in sync?"

library_audit()

Response:
Library Audit Report
====================

Plex ↔ Radarr Sync:
  Movies in both: 423
  In Plex only (orphans): 12
  In Radarr only (not imported): 5

Plex ↔ Sonarr Sync:
  Series in both: 156
  In Plex only (orphans): 3
  In Sonarr only (not imported): 2

Downloads:
  Completed but not imported: 4
  Failed imports: 2

Quality Routing:
  4K content in HD Radarr: 2
  HD content in 4K Radarr: 0

Collections:
  Incomplete collections found: 8
  Total missing movies: 23

Ended Series:
  Fully watched, ended: 12
  Potential cleanup: 156 GB

Run with specific check for details:
  library_audit(check: "orphans")
  library_audit(check: "collections")
```

**Example - Orphans detail:**
```
library_audit(check: "orphans")

Response:
Plex Orphans (15 items, 186.5 GB)

Movies (12):
  [plex:12345] Avatar (2009) - 4.2 GB - IMDB: tt0499549
  [plex:12346] Titanic (1997) - 3.8 GB - IMDB: tt0120338
  ...

TV Shows (3):
  [plex:23456] The Office (US) - 45.2 GB - TVDB: 73244
  ...

To sync these to Sonarr/Radarr:
  library_sync(type: "orphans", confirm: true)
```

**Example - Collections:**
```
library_audit(check: "collections")

Response:
Incomplete Collections (8 found)

Back to the Future Collection (2/3 movies)
  ✓ Back to the Future (1985)
  ✓ Back to the Future Part II (1989)
  ✗ Back to the Future Part III (1990) - TMDB: 196

The Matrix Collection (3/4 movies)
  ✓ The Matrix (1999)
  ✓ The Matrix Reloaded (2003)
  ✓ The Matrix Revolutions (2003)
  ✗ The Matrix Resurrections (2021) - TMDB: 624860

... (6 more collections)

Total missing: 23 movies
To add missing movies: Use movie_add() with TMDB IDs shown
```

### 2. Library Sync Tool (Batch Operations)

Batch operations with dry-run preview and explicit confirmation.

| Parameter | Description |
|-----------|-------------|
| `type: "orphans"` | Add Plex orphans to Sonarr/Radarr |
| `type: "collection"` | Add missing collection movies (requires collection_id) |
| `confirm: false` | Dry-run preview (default) |
| `confirm: true` | Execute the sync |
| `collection_id` | TMDB collection ID (for type: "collection") |

**Example - Sync orphans:**
```
User: "Add those orphans to Radarr"

library_sync(type: "orphans")

Response:
Sync Preview (dry-run)

Would add to Radarr (12 movies):
  Avatar (2009) - TMDB: 19995
  Titanic (1997) - TMDB: 597
  ... (10 more)

Would add to Sonarr (3 series):
  The Office (US) - TVDB: 73244
  ... (2 more)

To execute: library_sync(type: "orphans", confirm: true)
```

```
library_sync(type: "orphans", confirm: true)

Response:
Sync Complete

Added to Radarr: 12 movies
  ✓ Avatar (2009)
  ✓ Titanic (1997)
  ... (10 more)

Added to Sonarr: 3 series
  ✓ The Office (US)
  ... (2 more)

Failed: 0
```

### 3. Space Planner Tool

Smart cleanup recommendations with value scoring.

| Parameter | Description |
|-----------|-------------|
| `target_gb` | How much space to free (required) |
| `type` | Filter: "movies", "shows", "all" (default: "all") |
| `exclude_favorites` | Skip highly-rated content (default: true) |

**Scoring Algorithm:**
```
cleanup_score = (file_size_gb × days_since_watched) / (rating × rewatch_factor)

Where:
- file_size_gb: Size in GB (bigger = higher score)
- days_since_watched: Days since last watch (older = higher score)
- rating: IMDB/TMDB rating 1-10 (higher rating = lower score, keeps good content)
- rewatch_factor: 1.0 for movies, 0.5 for rewatchable genres (comedy, kids),
                  1.5 for one-time genres (documentary, thriller)
```

Higher score = better deletion candidate.

**Example:**
```
User: "I need 100GB free, what should I delete?"

space_planner(target_gb: 100)

Response:
Space Planner - Target: 100 GB
==============================

Recommended Deletions (sorted by cleanup score):

#1 [radarr:201] Geostorm (2017) - Score: 847
   Size: 12.3 GB | Watched: 412 days ago | Rating: 5.3
   Why: Large file, low rating, watched long ago

#2 [radarr:202] The Meg (2018) - Score: 623
   Size: 8.7 GB | Watched: 389 days ago | Rating: 5.7
   Why: Medium file, below-average rating, old watch

#3 [radarr:203] Rampage (2018) - Score: 589
   Size: 9.1 GB | Watched: 356 days ago | Rating: 6.1
   Why: Medium file, average rating, moderately old

... (more items)

Running total: 98.4 GB (8 items)
Next item would exceed target.

To delete: Use movie_delete(movie_id, delete_files: true) for each
⚠️ Deletions are permanent. Review carefully.
```

### 4. Watch Analytics Tool

Basic viewing statistics without being invasive.

| Parameter | Description |
|-----------|-------------|
| `period` | Time period: "month", "year", "all" (default: "year") |
| `type` | Filter: "movies", "shows", "all" (default: "all") |

**Example:**
```
watch_analytics()

Response:
Watch Analytics (Past Year)
===========================

Overview:
  Movies watched: 142
  TV episodes watched: 847
  Total watch time: ~312 hours

Most Watched Movies:
  1. The Shawshank Redemption (4 views)
  2. Inception (3 views)
  3. The Dark Knight (3 views)

Most Watched Shows:
  1. The Office - 234 episodes
  2. Friends - 156 episodes
  3. Breaking Bad - 62 episodes

Genre Breakdown (Movies):
  Action: 28% (40 movies)
  Comedy: 22% (31 movies)
  Drama: 18% (26 movies)
  Sci-Fi: 15% (21 movies)
  Other: 17% (24 movies)

Watch Frequency:
  Average: 2.7 movies/week
  Peak month: December (18 movies)
  Slowest month: June (8 movies)
```

### 5. Enhanced Existing Tools

**`plex_watched_old` enhancements:**
- Add `show_size: true` parameter for size totals
- Add `sort: "size"` option to find largest watched items
- Add `ended_only: true` filter for ended series
- Show running total of potential space savings

**`plex_unwatched` enhancements:**
- Add `show_size: true` parameter for size totals
- Add `show_rating: true` to help identify hidden gems
- Add `sort: "size"` option
- Show running total of potential space savings

---

## Matching Logic

### ID-Based Matching (Preferred)

```typescript
// Match by IMDB ID first, then TMDB/TVDB ID, then title+year
function matchMovie(plexMovie: PlexMovie, radarrMovie: RadarrMovie): boolean {
  // IMDB ID match (most reliable)
  if (plexMovie.imdbId && radarrMovie.imdbId) {
    return plexMovie.imdbId === radarrMovie.imdbId;
  }

  // TMDB ID match
  if (plexMovie.tmdbId && radarrMovie.tmdbId) {
    return plexMovie.tmdbId === radarrMovie.tmdbId;
  }

  // Fallback: title + year (fuzzy)
  return normalizeTitle(plexMovie.title) === normalizeTitle(radarrMovie.title)
    && Math.abs(plexMovie.year - radarrMovie.year) <= 1;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^the/, '');
}
```

### Performance Considerations

For large libraries (1000+ items):
1. Build indexes for O(1) lookups
2. Process in batches
3. Cache results during single audit run

```typescript
async function buildMatchIndex(movies: Movie[]): Promise<Map<string, Movie>> {
  const index = new Map<string, Movie>();
  for (const movie of movies) {
    if (movie.imdbId) index.set(`imdb:${movie.imdbId}`, movie);
    if (movie.tmdbId) index.set(`tmdb:${movie.tmdbId}`, movie);
    index.set(`title:${normalizeTitle(movie.title)}:${movie.year}`, movie);
  }
  return index;
}
```

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Single audit tool | `library_audit` with `check` param | Reduces tool count, easier discovery |
| Batch operations | `library_sync` with confirm | Actionable findings, not just reports |
| Space scoring | Formula-based | Objective, explainable recommendations |
| Analytics scope | Basic stats only | Useful without being creepy |
| Existing tools | Enhance, don't duplicate | Avoid confusion, maintain consistency |
| State | Stateless | No database, no sync issues |
| Undo | Not supported | Explicit confirmation is safer |

---

## Verification Gate

**Gate 9** - Library Intelligence:

- [ ] `library_audit()` shows accurate full report
- [ ] `library_audit(check: "orphans")` finds known orphan content
- [ ] `library_audit(check: "missing")` finds content not in Plex
- [ ] `library_audit(check: "downloads")` finds stuck downloads
- [ ] `library_audit(check: "quality")` detects misrouted 4K content
- [ ] `library_audit(check: "collections")` finds incomplete collections
- [ ] `library_sync(type: "orphans")` preview is accurate
- [ ] `library_sync(type: "orphans", confirm: true)` adds items correctly
- [ ] `space_planner` scoring produces sensible rankings
- [ ] `watch_analytics` stats are accurate
- [ ] Enhanced `plex_watched_old` shows size totals
- [ ] Enhanced `plex_unwatched` shows size and rating
- [ ] Tools error clearly when required providers missing
- [ ] Large library performance acceptable (1000+ items < 30s)

---

## Dependencies

- Phase 0080 (provider-cleanup) must be complete ✓
- Provider registry available ✓
- Cross-provider utilities available ✓

---

## Testing Checklist

- [ ] Test `library_audit` with known orphans
- [ ] Test `library_audit` with clean library (no issues)
- [ ] Test `library_audit(check: "collections")` accuracy
- [ ] Test `library_sync` dry-run vs confirm behavior
- [ ] Test `space_planner` scoring logic
- [ ] Test `watch_analytics` with various watch histories
- [ ] Test enhanced Plex tools with size/rating display
- [ ] Test with empty libraries (graceful handling)
- [ ] Test with large libraries (performance)
- [ ] Test with missing providers (clear error messages)
