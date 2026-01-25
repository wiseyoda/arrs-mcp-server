# Completed Phases

> Archive of completed development phases. Newest first.

---

## 0050 - polish-extended

**Completed**: 2026-01-25

# Phase 0050: Polish & Extended Features

**Status**: Not Started
**Branch**: `0050-polish-extended`
**Estimated Scope**: Medium (refinement and edge cases)

---

## Goals

1. Implement all Extended tier tools from api-standards.md
2. Add unified cleanup workflows across services
3. Polish error messages and edge case handling
4. Add comprehensive media_help with tool catalog
5. Performance optimization for large libraries
6. Documentation updates and final testing

---

## Scope

### In Scope

- Extended tools not implemented in previous phases
- Cross-service cleanup workflows
- Enhanced error messages
- Large library pagination/limits
- README polish and examples
- End-to-end workflow testing

### Out of Scope

- New services (Overseerr, Tautulli, etc.)
- Web UI
- Automated testing infrastructure
- CI/CD pipeline

---

## Deliverables

### 1. Extended Tools

**Sonarr Extended:**
- `sonarr_rename` - Rename episode files
- `sonarr_refresh` - Refresh series metadata
- `sonarr_upcoming` - More detailed upcoming view

**Radarr Extended:**
- `radarr_rename` - Rename movie files
- `radarr_refresh` - Refresh movie metadata
- `radarr_discover` - Discovery/recommendations

**Plex Extended:**
- `plex_collections` - List/manage collections
- `plex_duplicates` - Find duplicate files
- `plex_optimize` - Optimize database

**Sabnzbd Extended:**
- `sabnzbd_quota` - Quota status
- `sabnzbd_warnings` - System warnings

### 2. Unified Workflows

**Cleanup Assistant:**

```typescript
// Comprehensive cleanup analysis
cleanup_analysis()

// Response:
// Cleanup Analysis
//
// Unwatched Movies (365+ days): 15 items, 156.2 GB
// Watched Movies (180+ days): 8 items, 89.3 GB
// Ended Series (no recent episodes): 5 series, 234.5 GB
// Duplicate Files: 3 items, 45.2 GB
// Failed Downloads: 2 items (retry or blacklist)
//
// Total potential savings: 525.2 GB
//
// Use specific tools to investigate each category.
```

**Health Dashboard:**

```typescript
// Enhanced system_health
system_health({ verbose: true })

// Response:
// System Health: WARNING
//
// Sonarr: OK
//   Version: 4.0.13.2932
//   Shows: 160 | Episodes: 12,345
//   Queue: Empty | Stuck: 0
//
// Radarr: OK
//   Version: 5.18.4.9674
//   Movies: 450 | Downloaded: 423
//   Queue: 2 items | Stuck: 0
//
// Radarr4K: OK
//   Version: 5.18.4.9674
//   Movies: 85 | Downloaded: 82
//   Queue: 1 item | Stuck: 0
//
// Plex: OK
//   Libraries: 4
//   Movies: 508 | TV: 160 series
//   Recently Added: 12 items (7 days)
//
// Sabnzbd: WARNING
//   Queue: 3 items (25.5 MB/s)
//   Warnings: 1 (disk space low)
//
// Issues:
//   - Sabnzbd: Low disk space warning
```

### 3. Error Message Polish

Review and improve all error messages:

| Scenario | Before | After |
|----------|--------|-------|
| Invalid API key | "401 Unauthorized" | "Invalid Sonarr API key. Check your configuration." |
| Service down | "ECONNREFUSED" | "Cannot connect to Sonarr at http://... Is the service running?" |
| Movie not found | "Movie with ID 999 not found" | "No movie found with ID 999. Use movie_list to find valid IDs." |
| 4K not configured | "radarr4k.url is undefined" | "Radarr4K is not configured. Add radarr4k settings or use quality: 'hd'" |

### 4. Large Library Handling

For libraries with thousands of items:

**Pagination:**
```typescript
tv_list({ limit: 50, offset: 100 })
movie_list({ limit: 50, offset: 100 })
```

**Summary Mode:**
```typescript
tv_list({ summary: true })
// Response: "160 TV series (89 continuing, 71 ended). Use filters to narrow down."
```

**Smart Defaults:**
- Default limit of 100 for list operations
- Warn when results exceed 500
- Suggest filters for large result sets

### 5. media_help Enhancement

Comprehensive help system:

```typescript
media_help()
// Response:
// Media Management Server
//
// Connected Services:
//   - Sonarr (TV Shows) ✓
//   - Radarr (Movies) ✓
//   - Radarr4K (4K Movies) ✓
//   - Plex (Library) ✓
//   - Sabnzbd (Downloads) ✓
//
// Quick Start:
//   "Add Breaking Bad" → Search and add TV show
//   "Get Inception in 4K" → Search and add 4K movie
//   "What's downloading?" → Check download status
//   "Do I have The Office?" → Search Plex library
//
// For detailed help: media_help({ topic: 'tv' | 'movies' | 'library' | 'downloads' | 'cleanup' })

media_help({ topic: 'cleanup' })
// Response:
// Cleanup Tools
//
// Find Candidates:
//   plex_unwatched({ days: 365 }) - Movies not watched in a year
//   plex_watched_old({ days: 180 }) - Watched movies ready to delete
//   plex_duplicates() - Duplicate files wasting space
//
// Analysis:
//   cleanup_analysis() - Overview of all cleanup opportunities
//
// Delete (with confirmation):
//   plex_delete({ rating_key: 12345, confirm: true })
//   movie_delete({ movie_id: 123, delete_files: true })
//   sonarr_delete({ series_id: 456, delete_files: true })
```

---

## Design Decisions (Inherited)

### From Phase 0010

| Decision | Value |
|----------|-------|
| HTTP Client | Native fetch |
| Output Format | Simple text |
| Parameter Types | z.coerce.number() |
| List Tools | Filtering + sorting + display options |

### New Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Default Limit | 100 items | Prevent token overflow |
| Summary Mode | Available for all list tools | Quick counts without full data |
| Verbose Health | Optional detailed view | Balance between quick check and full status |

---

## Verification Gate

**USER GATE** - Complete end-to-end verification:

- [ ] All core workflows work smoothly:
  - [ ] "Add Breaking Bad" → searches, adds, reports
  - [ ] "Get Inception in 4K" → routes to Radarr4K correctly
  - [ ] "What's downloading?" → unified view with sources
  - [ ] "Something is stuck" → health check + fix workflow
  - [ ] "Do I have The Office?" → library search with context
- [ ] Large libraries handled gracefully (no timeouts, no token overflow)
- [ ] Error messages are actionable
- [ ] 4K routing is safe (never accidental)
- [ ] All extended tools work
- [ ] README is complete and accurate
- [ ] Works with Claude Desktop
- [ ] Works with Claude Code

---

## Dependencies

- Phase 0010 (Sonarr) must be complete
- Phase 0020 (Radarr) must be complete
- Phase 0030 (Plex) must be complete
- Phase 0040 (Sabnzbd) must be complete

---

## Technical Notes

### Performance Considerations

1. **Parallel API calls** where possible:
   ```typescript
   const [sonarr, radarr, plex, sabnzbd] = await Promise.all([
     sonarrClient.health(),
     radarrClient.health(),
     plexClient.health(),
     sabnzbdClient.health(),
   ]);
   ```

2. **Early termination** for large results:
   ```typescript
   if (results.length > MAX_RESULTS) {
     return {
       content: [{
         type: "text",
         text: `Found ${results.length} items. Showing first ${MAX_RESULTS}.\n` +
               `Use filters to narrow down: status, network, genre, etc.`
       }]
     };
   }
   ```

3. **Lazy loading** for cross-references:
   ```typescript
   // Don't fetch *arr queue data unless needed
   if (includeSource) {
     await loadArrReferences(downloads);
   }
   ```

### Testing Checklist

Before marking complete:

- [ ] Test each tool individually
- [ ] Test common workflows end-to-end
- [ ] Test with empty libraries
- [ ] Test with large libraries (100+ items)
- [ ] Test error scenarios (service down, bad config)
- [ ] Test 4K safety (verify no accidental 4K)
- [ ] Test with Claude Desktop
- [ ] Test with Claude Code
- [ ] Review all error messages
- [ ] Verify README accuracy


---

## 0040 - sabnzbd

**Completed**: 2026-01-25

# Phase 0040: Sabnzbd (Downloads)

**Status**: Not Started
**Branch**: `0040-sabnzbd`
**Estimated Scope**: Medium (simpler API, focus on queue management)

---

## Goals

1. Build Sabnzbd API client with query-parameter authentication
2. Implement download semantic tools (queue, history, pause, resume, speed)
3. Implement admin tools (delete, failed, retry, priority, categories)
4. Enhance downloads_status with full Sabnzbd integration
5. Enable cross-service download tracking (what's in Sabnzbd for which *arr)
6. Complete the unified download management experience

---

## Scope

### In Scope

- `src/services/sabnzbd/` module (client.ts, types.ts, tools.ts, index.ts)
- All download tools from api-standards.md
- Queue management (pause, resume, priority, delete)
- History and retry workflows
- Speed limiting
- Integration with *arr tracking

### Out of Scope

- NZB file uploads (use *arr for adding content)
- Sabnzbd configuration/settings
- Server administration
- RSS feed management

---

## Deliverables

1. **Sabnzbd API Client**
   - `src/services/sabnzbd/client.ts` - API client
   - `src/services/sabnzbd/types.ts` - TypeScript types
   - `src/services/sabnzbd/tools.ts` - MCP tool registrations
   - `src/services/sabnzbd/index.ts` - Exports

2. **Semantic Tools (5)**
   - `downloads_queue` - Current download queue with full details
   - `downloads_history` - Download history with status/size/time/errors
   - `downloads_pause` - Pause all downloads
   - `downloads_resume` - Resume all downloads
   - `downloads_speed` - Set speed limit

3. **Admin Tools (7)**
   - `sabnzbd_delete` - Remove item from queue
   - `sabnzbd_failed` - Get failed downloads for investigation
   - `sabnzbd_retry` - Retry a failed download
   - `sabnzbd_priority` - Change queue priority
   - `sabnzbd_categories` - List download categories
   - `sabnzbd_pause_item` - Pause specific item
   - `sabnzbd_resume_item` - Resume specific item

4. **Cross-Service Updates**
   - Full integration of `downloads_status` with Sabnzbd queue
   - Cross-reference downloads with Sonarr/Radarr (which *arr is this for?)

---

## Design Decisions (Inherited from Phase 0010)

### Technical Patterns

| Decision | Value | Rationale |
|----------|-------|-----------|
| HTTP Client | Native fetch | Consistent with other services |
| Output Format | Simple text | Readable, token-efficient |
| Parameter Types | z.coerce.number() | MCP passes numbers as strings |
| Module Pattern | client/types/tools per service | Clean separation |

### Sabnzbd-Specific Considerations

| Decision | Value | Rationale |
|----------|-------|-----------|
| Authentication | apikey query parameter | Sabnzbd API standard |
| Output Format | JSON | Request `output=json` |
| Cross-Reference | Match by title/nzo_id | Link to *arr sources |

---

## Sabnzbd API Reference

### Authentication

```typescript
// API key via query parameter
const url = `${baseUrl}/api?mode=${mode}&apikey=${apiKey}&output=json`;
```

### Key Modes (Endpoints)

| Mode | Description |
|------|-------------|
| `queue` | Get download queue |
| `history` | Get download history |
| `pause` | Pause all downloads |
| `resume` | Resume all downloads |
| `config` | Get speed limit and other settings |
| `speedlimit` | Set speed limit |
| `queue&name=delete&value=` | Delete from queue |
| `retry&value=` | Retry failed download |
| `queue&name=priority&value=&value2=` | Change priority |

### Key Types

```typescript
interface SabnzbdQueue {
  status: 'Downloading' | 'Paused' | 'Idle';
  speed: string;           // "25.5 M" (MB/s)
  timeleft: string;        // "2:30:45"
  mb: string;              // Total MB remaining
  mbleft: string;          // MB left for current item
  slots: SabnzbdQueueSlot[];
}

interface SabnzbdQueueSlot {
  nzo_id: string;          // Unique ID
  filename: string;        // Display name
  status: 'Downloading' | 'Queued' | 'Paused' | 'Verifying' | 'Extracting';
  mb: string;              // Total size
  mbleft: string;          // Remaining
  percentage: string;      // "45"
  timeleft: string;        // ETA
  cat: string;             // Category (tv, movies, etc.)
  priority: string;        // Priority level
}

interface SabnzbdHistorySlot {
  nzo_id: string;
  name: string;
  status: 'Completed' | 'Failed' | 'Queued';
  fail_message?: string;
  bytes: number;
  download_time: number;   // seconds
  completed: number;       // timestamp
  category: string;
  storage: string;         // Final path
}
```

---

## downloads_status Enhancement

This tool becomes the unified download view:

```text
Downloads Status

Speed: 25.5 MB/s | Queue: 3 items | ETA: 2:30:45

Queue:
  1. Show.S01E05.720p.WEB-DL [Sonarr] - 45% (1.2 GB / 2.7 GB) - ETA: 15m
  2. Movie.2024.1080p.BluRay [Radarr] - Queued (8.5 GB)
  3. Show.S01E06.720p.WEB-DL [Sonarr] - Queued (2.8 GB)

Issues:
  - Radarr: 2 stuck imports
  - Sonarr: 1 failed download

Recent Completions:
  - Movie.2023.1080p.BluRay - Completed 15m ago (12.3 GB)
```

### Cross-Reference Logic

To determine which *arr a download belongs to:

1. Check Sabnzbd category (often `tv`, `movies`, `movies-4k`)
2. Query Sonarr/Radarr queues for matching download IDs
3. Match by title if ID not found

```typescript
interface EnhancedDownload {
  nzo_id: string;
  title: string;
  progress: number;
  eta: string;
  status: string;
  size: number;
  source: 'sonarr' | 'radarr' | 'radarr4k' | 'unknown';
  issues?: string[];
}
```

---

## Queue Management Workflows

### "Pause downloads"

```typescript
downloads_pause()
// Response: "Downloads paused. 3 items in queue."
```

### "Resume downloads"

```typescript
downloads_resume()
// Response: "Downloads resumed. Speed: 25.5 MB/s"
```

### "Slow down downloads" / "Limit speed"

```typescript
downloads_speed({ speed: 10 })  // 10 MB/s
// Response: "Speed limit set to 10 MB/s"

downloads_speed({ speed: 'unlimited' })
// Response: "Speed limit removed"
```

### "Move X to top of queue"

```typescript
sabnzbd_priority({ nzo_id: 'abc123', position: 'top' })
// Response: "Moved 'Show.S01E05' to top of queue"
```

---

## Failed Download Handling

### Investigation

```typescript
sabnzbd_failed()
// Response:
// 2 failed downloads:
//
// 1. Show.S01E03.720p - Failed: "Incomplete download"
//    Category: tv | Size: 2.1 GB | Completed: 2024-01-15 10:30
//
// 2. Movie.2024.1080p - Failed: "Unpacking failed"
//    Category: movies | Size: 8.5 GB | Completed: 2024-01-15 09:15
```

### Retry

```typescript
sabnzbd_retry({ nzo_id: 'abc123' })
// Response: "Retrying 'Show.S01E03.720p'. Added to queue."
```

---

## Verification Gate

Download tools work correctly:

- [ ] `downloads_queue` shows current queue with details
- [ ] `downloads_history` shows history with status
- [ ] `downloads_pause` pauses all downloads
- [ ] `downloads_resume` resumes downloads
- [ ] `downloads_speed` sets speed limit correctly
- [ ] `sabnzbd_delete` removes items from queue
- [ ] `sabnzbd_failed` lists failed downloads
- [ ] `sabnzbd_retry` retries failed downloads
- [ ] `sabnzbd_priority` changes queue order
- [ ] `downloads_status` shows unified view with *arr cross-references
- [ ] `system_health` includes Sabnzbd status

---

## Dependencies

- Phase 0010 (Sonarr) must be complete
- Phase 0020 (Radarr) should be complete for full cross-reference

---

## Technical Notes

### Speed Parsing

Sabnzbd returns speed as string like "25.5 M". Parse for display:

```typescript
function formatSpeed(speed: string): string {
  // "25.5 M" -> "25.5 MB/s"
  return speed.replace(' M', ' MB/s').replace(' K', ' KB/s');
}
```

### Category Mapping

Common category-to-source mapping:

| Category | Likely Source |
|----------|---------------|
| `tv`, `sonarr` | Sonarr |
| `movies`, `radarr` | Radarr |
| `movies-4k`, `radarr4k` | Radarr4K |
| `audio`, `lidarr` | Lidarr (not supported) |

### NZO ID

The `nzo_id` is Sabnzbd's unique identifier for each download. Use it for:
- Delete operations
- Retry operations
- Priority changes
- Pause/resume individual items


---

## 0030 - plex

**Completed**: 2026-01-25

# Phase 0030: Plex (Library)

**Status**: Not Started
**Branch**: `0030-plex`
**Estimated Scope**: Medium (different API pattern than *arr apps)

---

## Goals

1. Build Plex API client with token-based authentication
2. Implement Plex semantic tools (library_list, library_search, library_watched)
3. Implement Plex admin tools (delete, unwatched, watched_old, recent, refresh)
4. Provide library-aware search ("Do I have...?" queries)
5. Enable watch status tracking and cleanup workflows
6. Update cross-service tools to include Plex

---

## Scope

### In Scope

- `src/services/plex/` module (client.ts, types.ts, tools.ts, index.ts)
- All library tools from api-standards.md
- Multi-library support (Movies, TV Shows, Kids Shows, Movies (4K))
- Watch status queries
- Cleanup candidate identification

### Out of Scope

- Sabnzbd (Phase 0040)
- Plex playback control
- Plex user management
- Plex sharing/permissions
- Tautulli integration

---

## Deliverables

1. **Plex API Client**
   - `src/services/plex/client.ts` - API client
   - `src/services/plex/types.ts` - TypeScript types for Plex API
   - `src/services/plex/tools.ts` - MCP tool registrations
   - `src/services/plex/index.ts` - Exports

2. **Semantic Tools (3)**
   - `library_list` - List all Plex libraries
   - `library_search` - Search across libraries ("Do I have...?")
   - `library_watched` - Get watched/unwatched status

3. **Admin Tools (5)**
   - `plex_delete` - Delete media from Plex (destructive!)
   - `plex_unwatched` - Find unwatched content (cleanup candidates)
   - `plex_watched_old` - Find old watched content (cleanup candidates)
   - `plex_recent` - Recently added content
   - `plex_refresh` - Trigger library scan

4. **Cross-Service Updates**
   - Update `system_health` to check Plex connectivity
   - Consider `library_search` in "do I have" workflows

---

## Design Decisions (Inherited from Phase 0010)

### Technical Patterns

| Decision | Value | Rationale |
|----------|-------|-----------|
| HTTP Client | Native fetch | Consistent with other services |
| Output Format | Simple text | Readable, token-efficient |
| Parameter Types | z.coerce.number() | MCP passes numbers as strings |
| Module Pattern | client/types/tools per service | Clean separation |

### Plex-Specific Considerations

| Decision | Value | Rationale |
|----------|-------|-----------|
| Authentication | X-Plex-Token header | Standard Plex auth method |
| Library Filtering | Always show which library | User needs context for results |
| Delete Confirmation | Require `confirm: true` | Destructive operation |

---

## Plex API Reference

### Authentication

```typescript
// Token via header (preferred)
headers: { 'X-Plex-Token': token }

// Or via query parameter
url: `${baseUrl}/library/sections?X-Plex-Token=${token}`
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/library/sections` | GET | List all libraries |
| `/library/sections/{id}/all` | GET | List all items in library |
| `/search?query=` | GET | Search across libraries |
| `/library/metadata/{id}` | GET | Item details |
| `/library/metadata/{id}` | DELETE | Delete item |
| `/library/sections/{id}/refresh` | GET | Trigger library scan |
| `/status/sessions/history/all` | GET | Watch history |

### Key Types

```typescript
interface PlexLibrary {
  key: string;        // Library ID
  title: string;      // "Movies", "TV Shows", etc.
  type: 'movie' | 'show' | 'artist' | 'photo';
  agent: string;
  scanner: string;
}

interface PlexMediaItem {
  ratingKey: string;  // Unique ID
  title: string;
  type: 'movie' | 'show' | 'season' | 'episode';
  year?: number;
  summary?: string;
  viewCount?: number;
  lastViewedAt?: number;
  addedAt: number;
  duration: number;   // milliseconds
  Media?: PlexMedia[];
}

interface PlexMedia {
  videoResolution: string;
  bitrate: number;
  Part: Array<{
    file: string;
    size: number;
  }>;
}
```

---

## library_search Enhancement

Following the pattern established for tv_list:

**Filters:**
- `library`: filter to specific library
- `type`: movie | show | episode
- `unwatched_only`: only unwatched content
- `year`: filter by release year

**Display Options:**
- `show_size`: disk size
- `show_watched`: watch count and last watched date
- `show_added`: date added to library
- `limit`: max results

**Response Format:**

```text
Found 3 results:

Movies:
  Inception (2010) - 4.2 GB, Watched 3 times (last: 2024-12-15)

TV Shows:
  The Office (US) - 201 episodes, 180 watched
  The Office (UK) - 14 episodes, Unwatched
```

---

## Cleanup Workflow Tools

### plex_unwatched

Find unwatched content older than N days (cleanup candidates):

```typescript
plex_unwatched({ days: 365, library: "Movies" })

// Response:
// 15 movies unwatched for 365+ days:
// - Movie Title (2020) - 8.5 GB - Added 2023-01-15
// - Movie Title 2 (2019) - 12.1 GB - Added 2022-06-20
// ...
// Total: 156.2 GB potential savings
```

### plex_watched_old

Find watched content you might want to remove:

```typescript
plex_watched_old({ days: 180, library: "Movies" })

// Response:
// 8 movies watched 180+ days ago:
// - Movie Title (2020) - 8.5 GB - Last watched 2024-03-15
// ...
// Total: 89.3 GB potential savings
```

---

## Safety Considerations

### plex_delete

This is a **destructive operation** that deletes actual files.

```typescript
// Requires explicit confirmation
plex_delete({ rating_key: 12345 })
// Error: "Delete requires confirmation. Use confirm: true to proceed."

plex_delete({ rating_key: 12345, confirm: true })
// Success: "Deleted 'Movie Title' (8.5 GB freed)"
```

---

## Verification Gate

Library tools work correctly:

- [ ] `library_list` shows all Plex libraries
- [ ] `library_search` finds content across libraries
- [ ] `library_search` shows which library results come from
- [ ] `library_watched` shows watch status correctly
- [ ] `plex_unwatched` finds cleanup candidates
- [ ] `plex_watched_old` finds old watched content
- [ ] `plex_delete` requires confirmation
- [ ] `plex_delete` actually deletes (test with dummy file)
- [ ] `plex_refresh` triggers library scan
- [ ] `system_health` includes Plex status

---

## Dependencies

- Phase 0020 (Radarr) should be complete for full media stack
- Can be developed in parallel with 0020 if needed

---

## Technical Notes

### XML vs JSON

Plex API returns XML by default. Add `Accept: application/json` header:

```typescript
const response = await fetch(url, {
  headers: {
    'Accept': 'application/json',
    'X-Plex-Token': token,
  },
});
```

### Rating Key vs Key

- `ratingKey`: Unique identifier for an item (use for delete, details)
- `key`: API endpoint path (e.g., `/library/metadata/12345`)

### Time Handling

Plex uses Unix timestamps for dates:
- `addedAt`: seconds since epoch
- `lastViewedAt`: seconds since epoch
- `duration`: milliseconds


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

