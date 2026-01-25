# Phase 0090: Library Intelligence (Stateless)

**Status**: Not Started
**Branch**: `0090-library-intelligence`
**Estimated Scope**: Medium (cross-provider tools, no persistent state)

---

## Goals

1. Cross-service consistency checks (Plex vs Sonarr/Radarr)
2. Orphan detection (content in Plex not tracked, downloads not imported)
3. Quality mismatch detection (4K in wrong library)
4. Smart cleanup suggestions with dry-run previews
5. Bulk operation previews (no undo - just careful confirmation)

---

## Scope

### In Scope

- Stateless consistency analysis tools
- Orphan detection across all services
- Quality routing validation
- Cleanup preview (dry-run) tools
- Bulk operation preview and confirm flow
- Uses provider registry from Phase 0080

### Out of Scope

- Undo capability (stateless - no audit log)
- Persistent rules (no database)
- Automatic remediation (always manual confirmation)
- File-level operations (moving files between libraries)

---

## Deliverables

### 1. Consistency Analysis Tools

| Tool | Description | Requires |
|------|-------------|----------|
| `library_consistency` | Full cross-service consistency report | Plex + (Sonarr or Radarr) |
| `library_plex_orphans` | Plex items not tracked in Sonarr/Radarr | Plex + (Sonarr or Radarr) |
| `library_arr_missing` | Sonarr/Radarr items not in Plex | Plex + (Sonarr or Radarr) |
| `library_download_orphans` | Downloads that never imported | Sabnzbd + (Sonarr or Radarr) |
| `library_quality_check` | Quality mismatches and routing issues | Radarr + Radarr4k |

### 2. Smart Cleanup Tools

| Tool | Description | Requires |
|------|-------------|----------|
| `cleanup_suggestions` | AI-friendly cleanup recommendations | Plex + (Sonarr or Radarr) |
| `cleanup_watched_old` | Preview old watched content for removal | Plex + (Sonarr or Radarr) |
| `cleanup_unwatched_old` | Preview old unwatched content for removal | Plex + (Sonarr or Radarr) |
| `cleanup_ended_series` | Preview ended/completed series | Plex + Sonarr |

### 3. Example Workflows

**Cross-service consistency check:**
```
User: "Are my libraries in sync?"

library_consistency()

Response:
Library Consistency Report

Plex ↔ Radarr Sync:
  Movies in both: 423
  In Plex only (orphans): 12
  In Radarr only (not imported): 5

Plex ↔ Sonarr Sync:
  Series in both: 156
  In Plex only (orphans): 3
  In Sonarr only (not imported): 2

Download Status:
  Completed but not imported: 4
  Failed imports: 2

Quality Issues:
  4K content in HD Radarr: 2
  HD content in 4K Radarr: 0

Run specific checks for details:
  library_plex_orphans() - see Plex-only items
  library_download_orphans() - see stuck downloads
  library_quality_check() - see quality issues
```

**Find and resolve orphans:**
```
User: "Show me what's in Plex but not tracked"

library_plex_orphans()

Response:
Plex Orphans (15 items, 186.5 GB)

Movies (12):
  [plex:12345] Avatar (2009) - 4.2 GB - Not in Radarr
  [plex:12346] Titanic (1997) - 3.8 GB - Not in Radarr
  ...

TV Shows (3):
  [plex:23456] The Office (US) - 45.2 GB - Not in Sonarr
  ...

Options:
  1. Add to Sonarr/Radarr to track: movie_add() / tv_add()
  2. Remove from Plex: plex_delete()
  3. Leave as-is (manually managed content)
```

**Smart cleanup preview:**
```
User: "What can I safely clean up?"

cleanup_suggestions()

Response:
Cleanup Suggestions

High Confidence (watched, old):
  28 movies watched 180+ days ago (312 GB)
  8 ended series, fully watched (156 GB)

Medium Confidence (unwatched, old):
  15 movies unwatched 365+ days (178 GB)
  4 series with no recent episodes watched (89 GB)

Low Confidence (review carefully):
  3 movies rated highly but unwatched (22 GB)

Total potential savings: 757 GB

Preview any category:
  cleanup_watched_old({ min_days: 180 })
  cleanup_unwatched_old({ min_days: 365 })
  cleanup_ended_series()
```

**Cleanup with explicit confirmation:**
```
User: "Show me the watched movies over 180 days"

cleanup_watched_old({ min_days: 180 })

Response:
Watched Movies (180+ days) - 28 items, 312 GB

[radarr:101] Avengers: Endgame - Watched 245 days ago - 4.2 GB
[radarr:102] John Wick 3 - Watched 312 days ago - 3.8 GB
[radarr:103] Joker - Watched 198 days ago - 5.1 GB
...

To remove these, use radarr_delete() with each ID.
Example: radarr_delete({ id: 101, delete_files: true })

⚠️ Deletions are permanent. There is no undo.
```

### 4. Quality Mismatch Detection

```
User: "Check my 4K library routing"

library_quality_check()

Response:
Quality Library Check

4K Content in HD Radarr (wrong library):
  [radarr:201] Dune (2021) - 2160p - 45.2 GB
    → Should be in Radarr4k
  [radarr:202] Oppenheimer (2023) - 2160p - 52.1 GB
    → Should be in Radarr4k

HD Content in 4K Radarr:
  None found ✓

Recommendations:
  1. Delete from Radarr (wrong instance)
  2. Add to Radarr4k (correct instance)
  3. Let Radarr4k search for the 4K version
```

---

## Matching Logic

### ID-Based Matching (Preferred)

```typescript
// Match by IMDB ID first, then TMDB ID, then title+year
function matchMovie(plexMovie: PlexMovie, radarrMovie: RadarrMovie): boolean {
  // IMDB ID match
  if (plexMovie.imdbId && radarrMovie.imdbId) {
    return plexMovie.imdbId === radarrMovie.imdbId;
  }

  // TMDB ID match
  if (plexMovie.tmdbId && radarrMovie.tmdbId) {
    return plexMovie.tmdbId === radarrMovie.tmdbId;
  }

  // Fallback: title + year
  return normalizeTitle(plexMovie.title) === normalizeTitle(radarrMovie.title)
    && plexMovie.year === radarrMovie.year;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^the/, '');
}
```

### Performance Considerations

For large libraries:
1. Build indexes for O(1) lookups
2. Process in batches
3. Stream results for very large result sets

```typescript
async function findOrphans(): Promise<OrphanResult[]> {
  const [plexMovies, radarrMovies] = await Promise.all([
    plexClient.getAllMovies(),
    radarrClient.getAllMovies(),
  ]);

  // Build lookup index
  const radarrIndex = new Map<string, RadarrMovie>();
  for (const movie of radarrMovies) {
    if (movie.imdbId) radarrIndex.set(`imdb:${movie.imdbId}`, movie);
    if (movie.tmdbId) radarrIndex.set(`tmdb:${movie.tmdbId}`, movie);
    radarrIndex.set(`title:${normalizeTitle(movie.title)}:${movie.year}`, movie);
  }

  // Find orphans
  return plexMovies.filter(movie => !isInIndex(movie, radarrIndex));
}
```

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| State | Stateless | No database, no sync issues, no complexity |
| Undo | Not supported | Explicit confirmation is safer than undo |
| Matching | ID-based priority | Most reliable, falls back to title+year |
| Bulk ops | Preview only | Actual deletion via existing tools |
| Thresholds | Configurable | Different users have different needs |

---

## Verification Gate

**Gate 9** - Library Intelligence:

- [ ] `library_consistency` shows accurate counts
- [ ] `library_plex_orphans` finds known orphan content
- [ ] `library_arr_missing` finds content not in Plex
- [ ] `library_download_orphans` finds stuck downloads
- [ ] `library_quality_check` detects misrouted 4K content
- [ ] `cleanup_suggestions` provides useful recommendations
- [ ] `cleanup_watched_old` preview is accurate
- [ ] Tools error clearly when required providers missing
- [ ] Large library performance is acceptable (1000+ items)

---

## Dependencies

- Phase 0080 (provider-cleanup) must be complete
- Provider registry available
- Cross-provider utilities available

---

## Testing Checklist

- [ ] Test with known orphans (manually add to Plex without Radarr)
- [ ] Test with clean library (no orphans)
- [ ] Test download orphan detection
- [ ] Test quality mismatch detection
- [ ] Test cleanup preview accuracy
- [ ] Test with empty libraries
- [ ] Test with large libraries (1000+ items)
- [ ] Test with missing providers (graceful error)
