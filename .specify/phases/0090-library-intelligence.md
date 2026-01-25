# Phase 0090: Library Intelligence

**Status**: Not Started
**Branch**: `0090-library-intelligence`
**Estimated Scope**: Medium (builds on state foundation)

---

## Goals

1. Cross-service consistency checks (Plex vs Sonarr/Radarr)
2. Orphan detection (content without tracking, downloads without imports)
3. Quality mismatches (4K in wrong library, wrong instance routing)
4. Smart cleanup rules with dry-run → confirm → execute flow
5. Bulk operations with preview and undo capability
6. Enhanced storage forecasting with recommendations

---

## Scope

### In Scope

- Consistency analysis tools
- Orphan detection across all services
- Quality routing validation
- Configurable cleanup rules execution
- Bulk delete/archive with confirmation
- Integration with state foundation (undo capability)

### Out of Scope

- Automatic remediation (always confirm)
- File-level operations (moving files between libraries)
- Duplicate resolution (detection only, manual resolution)

---

## Deliverables

### 1. Consistency Analysis Tools

| Tool | Description |
|------|-------------|
| `consistency_check` | Full cross-service consistency report |
| `consistency_plex_orphans` | Plex items not tracked in Sonarr/Radarr |
| `consistency_arr_missing` | Sonarr/Radarr items not in Plex |
| `consistency_download_orphans` | Downloads that never imported |
| `consistency_quality` | Quality mismatches and routing issues |

### 2. Smart Cleanup Tools

| Tool | Description |
|------|-------------|
| `cleanup_preview` | Dry-run of cleanup based on criteria |
| `cleanup_execute` | Execute cleanup with confirmation |
| `cleanup_rules_run` | Run all enabled cleanup rules |
| `cleanup_recommendations` | AI-powered cleanup suggestions |

### 3. Bulk Operation Tools

| Tool | Description |
|------|-------------|
| `bulk_delete` | Delete multiple items with preview |
| `bulk_upgrade` | Trigger quality upgrades for multiple items |
| `bulk_refresh` | Refresh metadata for multiple items |
| `bulk_rename` | Rename files for multiple items |

### 4. Example Workflows

**Cross-service consistency check:**
```typescript
// User: "Are my libraries in sync?"
consistency_check()
// Response:
// Library Consistency Report
//
// Plex ↔ Radarr Sync:
//   Movies in both: 423
//   In Plex only (orphans): 12
//   In Radarr only (not imported): 5
//
// Plex ↔ Sonarr Sync:
//   Series in both: 156
//   In Plex only (orphans): 3
//   In Sonarr only (not imported): 2
//
// Download Orphans:
//   Completed but not imported: 4
//   Failed imports: 2
//
// Quality Issues:
//   4K content in HD library: 2
//   HD content in 4K library: 0
//
// Run specific checks for details:
//   consistency_plex_orphans()
//   consistency_download_orphans()
//   consistency_quality()
```

**Find and fix orphans:**
```typescript
// User: "Show me what's in Plex but not tracked"
consistency_plex_orphans()
// Response:
// Plex Orphans (15 items, 186.5 GB)
//
// Movies (12):
// [plex:12345] Avatar (2009) - 4.2 GB - Not in Radarr
// [plex:12346] Titanic (1997) - 3.8 GB - Not in Radarr
// ...
//
// TV Shows (3):
// [plex:23456] The Office (US) - 45.2 GB - Not in Sonarr
// ...
//
// Options:
// 1. Add to Sonarr/Radarr to track: Use movie_add/tv_add
// 2. Remove from Plex: Use plex_delete({ rating_keys: [...] })
// 3. Investigate: These may be intentionally manual additions

// User: "Add Avatar to Radarr so it's tracked"
movie_add({ title: 'Avatar', year: 2009, search: false })
// Response:
// Added "Avatar (2009)" to Radarr (ID: 789)
// Search disabled - using existing file in Plex library.
```

**Smart cleanup with preview:**
```typescript
// User: "What cleanup can I safely do?"
cleanup_recommendations()
// Response:
// Cleanup Recommendations
//
// High Confidence (safe to remove):
//   Watched movies 180+ days ago: 28 movies, 312 GB
//   Ended series, fully watched: 8 series, 156 GB
//   Failed downloads (7+ days): 5 items
//
// Medium Confidence (review recommended):
//   Unwatched movies 365+ days: 15 movies, 178 GB
//   Partially watched, abandoned: 6 items, 45 GB
//
// Total potential savings: 691 GB
//
// Preview any category:
//   cleanup_preview({ category: 'watched_old_movies', days: 180 })

cleanup_preview({ category: 'watched_old_movies', days: 180 })
// Response:
// Cleanup Preview: Watched Movies (180+ days)
//
// 28 movies would be removed (312 GB):
//
// [radarr:101] Avengers: Endgame - Watched 245 days ago - 4.2 GB
// [radarr:102] John Wick 3 - Watched 312 days ago - 3.8 GB
// [radarr:103] Joker - Watched 198 days ago - 5.1 GB
// ...
//
// Ready to proceed?
//   cleanup_execute({ category: 'watched_old_movies', days: 180, confirm: true })

cleanup_execute({ category: 'watched_old_movies', days: 180, confirm: true })
// Response:
// Cleanup Executed: Watched Movies (180+ days)
//
// Removed 28 movies (312 GB freed):
// - Removed from Radarr with files deleted
// - Action logged (can undo within 30 days)
//
// Note: Actual disk space freed after filesystem sync.
```

**Bulk operations:**
```typescript
// User: "Delete all movies rated below 5.0"
bulk_delete({
  type: 'movie',
  filter: { rating_lt: 5.0 },
  preview: true
})
// Response:
// Bulk Delete Preview: Movies with rating < 5.0
//
// 8 movies would be deleted (67.2 GB):
//
// [radarr:201] Movie A - Rating: 4.2 - 8.5 GB
// [radarr:202] Movie B - Rating: 3.8 - 7.2 GB
// ...
//
// Confirm deletion:
//   bulk_delete({ type: 'movie', filter: { rating_lt: 5.0 }, confirm: true })

// User: "Yes, delete them"
bulk_delete({ type: 'movie', filter: { rating_lt: 5.0 }, confirm: true })
// Response:
// Bulk Delete Executed
//
// Deleted 8 movies (67.2 GB):
// - Movie A (removed)
// - Movie B (removed)
// ...
//
// Action logged as #156. Undo with: history_undo({ action_id: 156 })
```

---

## Consistency Detection Logic

### Plex Orphans

```typescript
// Find Plex items not in Sonarr/Radarr
async function findPlexOrphans() {
  const plexMovies = await plexClient.getAllMovies();
  const radarrMovies = await radarrClient.getAllMovies();

  // Match by IMDB ID, TMDB ID, or title+year
  const radarrIndex = buildIndex(radarrMovies);

  return plexMovies.filter(movie => !radarrIndex.has(movie));
}
```

### Download Orphans

```typescript
// Find completed downloads not in library
async function findDownloadOrphans() {
  const history = await sabnzbdClient.getHistory();
  const completed = history.filter(h => h.status === 'Completed');

  // Check if imported to Sonarr/Radarr
  const sonarrHistory = await sonarrClient.getHistory();
  const radarrHistory = await radarrClient.getHistory();

  return completed.filter(d => !wasImported(d, sonarrHistory, radarrHistory));
}
```

### Quality Mismatches

```typescript
// Find content in wrong quality library
async function findQualityMismatches() {
  const radarrMovies = await radarrClient.getAllMovies();
  const radarr4kMovies = await radarr4kClient.getAllMovies();

  const issues = [];

  // 4K content in HD Radarr
  for (const movie of radarrMovies) {
    if (movie.movieFile?.quality?.quality?.resolution >= 2160) {
      issues.push({ movie, issue: '4K in HD library' });
    }
  }

  // HD content in 4K Radarr
  for (const movie of radarr4kMovies) {
    if (movie.movieFile?.quality?.quality?.resolution < 2160) {
      issues.push({ movie, issue: 'HD in 4K library' });
    }
  }

  return issues;
}
```

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Matching strategy | IMDB > TMDB > title+year | Most reliable identification |
| Orphan threshold | 24 hours since import | Allow time for processing |
| Bulk limit | 100 items per operation | Prevent accidental mass deletion |
| Preview required | Always before bulk ops | Safety first |
| Undo logging | All bulk ops logged as single action | Easy reversal |

---

## Verification Gate

**Gate 9** - Library Intelligence:

- [ ] Consistency check identifies Plex orphans correctly
- [ ] Consistency check identifies Sonarr/Radarr orphans correctly
- [ ] Download orphans detection works
- [ ] Quality mismatch detection works
- [ ] Cleanup preview shows accurate counts
- [ ] Cleanup execute removes correct items
- [ ] Bulk delete preview is accurate
- [ ] Bulk delete creates undo record
- [ ] Undo restores bulk deleted items
- [ ] All operations require confirmation

---

## Dependencies

- Phase 0080 (state-foundation) must be complete
- Audit log infrastructure available
- Undo capability implemented

---

## Technical Notes

### Matching Algorithm

Use fuzzy matching for title comparison:
```typescript
function titlesMatch(a: string, b: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^the/, '');

  return normalize(a) === normalize(b);
}
```

### Performance Considerations

For large libraries:
1. Cache Plex/Sonarr/Radarr data with short TTL
2. Build indexes for O(1) lookups
3. Process in batches for bulk operations
4. Stream results for very large operations

### Audit Integration

All destructive operations must:
1. Log to audit_log before execution
2. Store enough detail for undo
3. Update action status after completion
4. Handle partial failures gracefully

---

## Testing Checklist

- [ ] Test with known orphans
- [ ] Test with no orphans (clean library)
- [ ] Test download orphan detection
- [ ] Test quality mismatch detection
- [ ] Test cleanup preview accuracy
- [ ] Test bulk delete with small set
- [ ] Test undo after bulk delete
- [ ] Test with empty libraries
- [ ] Test with very large libraries (1000+ items)
- [ ] Test partial failure handling
