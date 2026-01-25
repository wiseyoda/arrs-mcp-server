# API Standards

> **Agents**: Reference this for MCP tool design and API integration patterns.

**Last Updated**: 2026-01-24

## Tool Philosophy

> See [constitution.md](./constitution.md) Principle I (Natural Language First) and Principle V (Two-Tier Tool Design) for naming philosophy and rationale.

**Workflow Priority**:
1. Add content (search + add) - most frequent
2. Fix problems (stuck imports, blacklist, re-search)
3. Check status (queue, what's downloading)

---

## System & Help Tools

### Core

| Tool | Description | Parameters |
|------|-------------|------------|
| `media_help` | System overview for Claude. Returns: all available tools with descriptions, architecture explanation (Sonarr=TV shows, Radarr=Movies, Plex=Library, Sabnzbd=Downloads), and which services are connected. Claude can auto-call when unsure. | `topic?: string` |
| `downloads_status` | Unified view of all downloads. Sabnzbd queue + which items are tracked in Sonarr/Radarr. Highlights issues. | none |
| `system_health` | Health check across all services. Reports connection issues, stuck imports, failed downloads. | none |

---

## TV Show Tools (Sonarr)

### Semantic (User-Facing)

| Tool | Description | Parameters |
|------|-------------|------------|
| `tv_search` | Search for TV series by name. Smart pick if obvious match, otherwise shows options. | `query: string` |
| `tv_add` | Add a TV show. Default: monitor ALL episodes, search immediately, /tv folder. | `tvdb_id: number`, `monitor?: 'all' \| 'future' \| 'missing' \| 'none'`, `quality?: string`, `folder?: 'tv' \| 'kids'` |
| `tv_list` | List all TV shows (names + status) | `status?: 'continuing' \| 'ended' \| 'all'` |
| `tv_episodes` | Get episodes for a show - missing/available/downloaded status | `series_id: number` |
| `tv_search_missing` | Trigger search for missing episodes | `series_id?: number` |

### Service-Specific (Admin/Troubleshooting)

| Tool | Description | Parameters |
|------|-------------|------------|
| `sonarr_queue` | Sonarr download queue with progress, ETA, errors, stuck imports | none |
| `sonarr_details` | Detailed info for one series | `series_id: number` |
| `sonarr_delete` | Remove series from library | `series_id: number`, `delete_files?: boolean` |
| `sonarr_profiles` | List available quality profiles | none |
| `sonarr_folders` | List root folders (/tv, /kids) | none |
| `sonarr_stuck` | Get items stuck in "importing" state | none |
| `sonarr_import` | Trigger manual import for stuck items | `download_id: string` |
| `sonarr_blacklist` | Blacklist a release and optionally re-search | `download_id: string`, `search_again?: boolean` |
| `sonarr_calendar` | Upcoming episodes | `days?: number` |

---

## Movie Tools (Radarr)

### Semantic (User-Facing)

| Tool | Description | Parameters |
|------|-------------|------------|
| `movie_search` | Search for movies by name. Default: regular quality. Say "4K" for 4K. | `query: string`, `quality?: 'hd' \| '4k'` |
| `movie_add` | Add a movie. Default: monitor + search immediately. | `tmdb_id: number`, `quality?: 'hd' \| '4k'`, `monitor?: boolean` |
| `movie_list` | List all movies in collection | `quality?: 'hd' \| '4k'`, `status?: string` |
| `movie_upgrade` | Search for better quality version of existing movie | `movie_id: number`, `quality?: 'hd' \| '4k'` |
| `movie_delete` | Remove movie from library (cleanup space) | `movie_id: number`, `quality?: 'hd' \| '4k'`, `delete_files?: boolean` |

### Service-Specific (Admin/Troubleshooting)

| Tool | Description | Parameters |
|------|-------------|------------|
| `radarr_queue` | Radarr download queue with progress, ETA, errors | `quality?: 'hd' \| '4k'` |
| `radarr_details` | Detailed info for one movie | `movie_id: number`, `quality?: 'hd' \| '4k'` |
| `radarr_profiles` | List available quality profiles | `quality?: 'hd' \| '4k'` |
| `radarr_stuck` | Get items stuck in "importing" state | `quality?: 'hd' \| '4k'` |
| `radarr_import` | Trigger manual import for stuck items | `download_id: string`, `quality?: 'hd' \| '4k'` |
| `radarr_blacklist` | Blacklist a release and optionally re-search | `download_id: string`, `quality?: 'hd' \| '4k'`, `search_again?: boolean` |

**Note**: `quality` defaults to `'hd'` (regular Radarr). Use `'4k'` only when user explicitly requests 4K/UHD/2160p. Routes to Radarr4K instance.

---

## Library Tools (Plex)

### Semantic (User-Facing)

| Tool | Description | Parameters |
|------|-------------|------------|
| `library_list` | List all Plex libraries (Movies, TV Shows, Kids Shows, Movies (4K)) | none |
| `library_search` | Search library - "Do I have...?" Results always show which library. | `query: string`, `library?: string` |
| `library_watched` | Get watched/unwatched status for content | `title: string` |

### Service-Specific (Admin/Maintenance)

| Tool | Description | Parameters |
|------|-------------|------------|
| `plex_delete` | Delete media from Plex (deletes files!) | `rating_key: number`, `confirm?: boolean` |
| `plex_unwatched` | Content unwatched for N days (cleanup candidates) | `days: number`, `library?: string` |
| `plex_watched_old` | Watched content older than N days (cleanup candidates) | `days: number`, `library?: string` |
| `plex_recent` | Recently added content | `limit?: number`, `library?: string` |
| `plex_refresh` | Trigger library scan (rarely needed) | `library?: string` |

---

## Download Tools (Sabnzbd)

### Semantic (User-Facing)

| Tool | Description | Parameters |
|------|-------------|------------|
| `downloads_queue` | Current download queue with full details | none |
| `downloads_history` | Download history (status, size, time, source, errors) | `limit?: number` |
| `downloads_pause` | Pause all downloads | none |
| `downloads_resume` | Resume all downloads | none |
| `downloads_speed` | Set download speed limit | `speed: number \| 'unlimited'` |

### Service-Specific (Admin/Troubleshooting)

| Tool | Description | Parameters |
|------|-------------|------------|
| `sabnzbd_delete` | Remove item from queue | `nzo_id: string` |
| `sabnzbd_failed` | Get failed downloads for investigation | none |
| `sabnzbd_retry` | Retry a failed download | `nzo_id: string` |
| `sabnzbd_priority` | Change item priority in queue | `nzo_id: string`, `position: number \| 'top' \| 'bottom'` |
| `sabnzbd_categories` | List download categories | none |
| `sabnzbd_pause_item` | Pause a specific item | `nzo_id: string` |
| `sabnzbd_resume_item` | Resume a specific item | `nzo_id: string` |

---

## Response Patterns

### Queue Response (Unified)

```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify({
      sabnzbd: {
        speed: "25 MB/s",
        items: [
          {
            title: "Show.S01E05.720p",
            progress: "45%",
            eta: "2 hours",
            tracked_in: "sonarr",  // or "radarr", "radarr4k", null
            status: "downloading"
          }
        ]
      },
      issues: [
        { service: "sonarr", type: "stuck_import", count: 2 },
        { service: "radarr", type: "failed_search", count: 1 }
      ]
    }, null, 2)
  }]
}
```

### Add Confirmation

```typescript
{
  content: [{
    type: "text",
    text: "Added 'Breaking Bad' to Sonarr:\n" +
          "- Quality: 1080p\n" +
          "- Folder: /tv/\n" +
          "- Monitoring: All episodes\n" +
          "- Search started for 62 missing episodes"
  }]
}
```

### Health Check Response

```typescript
{
  content: [{
    type: "text",
    text: JSON.stringify({
      overall: "warning",  // "ok", "warning", "error"
      services: {
        sonarr: { status: "ok", issues: [] },
        radarr: { status: "warning", issues: ["2 stuck imports"] },
        radarr4k: { status: "ok", issues: [] },
        plex: { status: "ok", issues: [] },
        sabnzbd: { status: "ok", issues: [] }
      }
    }, null, 2)
  }]
}
```

### Error Response

```typescript
{
  content: [{
    type: "text",
    text: "Unable to connect to Sonarr. Please verify:\n" +
          "- The service is running\n" +
          "- The URL is correct\n" +
          "- The API key is valid"
  }]
}
```

---

## API Integration Notes

### Sonarr/Radarr API

- Base URL + `/api/v3/` for all endpoints
- API key via `X-Api-Key` header
- Search endpoint: `/series/lookup?term={query}` (Sonarr) / `/movie/lookup?term={query}` (Radarr)
- Add endpoint: POST `/series` / POST `/movie`
- Queue endpoint: `/queue`
- Queue details: `/queue/details`

**Radarr Lookup Endpoints** (learned in Phase 0020):
| Endpoint | Returns | Notes |
|----------|---------|-------|
| `/movie/lookup?term={query}` | Array | Text search |
| `/movie/lookup/imdb?imdbId={id}` | **Single object** | Wrap in array! |
| `/movie/lookup/tmdb?tmdbId={id}` | **Single object** | Wrap in array! |

**Queue Item States**:
```typescript
trackedDownloadState:
  | "downloading"    // Active download
  | "importPending"  // Waiting to import
  | "importBlocked"  // BLOCKED - needs attention!
  | "importing"      // Currently importing
  | "imported"       // Done
  | "failedPending"  // Failed, pending retry

trackedDownloadStatus:
  | "ok"       // No issues
  | "warning"  // Has warnings
  | "error"    // Has errors
```

**DELETE Endpoints**: Return empty body (no JSON). Handle gracefully.

### Plex API

- Token via `X-Plex-Token` header or `?X-Plex-Token=` query param
- Libraries: `/library/sections`
- Search: `/search?query={query}`
- Watch history: `/status/sessions/history/all`

### Sabnzbd API

- API key via `apikey=` query parameter
- All operations via `/api?mode={mode}&apikey={key}&output=json`
- Queue: `?mode=queue`
- History: `?mode=history`
- Pause: `?mode=pause`
- Resume: `?mode=resume`
- Delete: `?mode=queue&name=delete&value={nzo_id}`
- Retry: `?mode=retry&value={nzo_id}`

---

## Radarr4k Handling

```typescript
// Default behavior (regular Radarr) - SAFE
movie_search({ query: "inception" })  // quality defaults to 'hd'

// Explicit 4K request - ONLY when user says "4K"
movie_search({ query: "inception", quality: "4k" })

// Implementation
function getRadarrConfig(quality: 'hd' | '4k' = 'hd') {
  return quality === '4k'
    ? { url: config.radarr4k.url, apiKey: config.radarr4k.apiKey }
    : { url: config.radarr.url, apiKey: config.radarr.apiKey };
}
```

**Important**: `quality` defaults to `'hd'`. Only use `'4k'` when user explicitly mentions "4K", "4k", "UHD", or "2160p".

---

## Workflow Examples

### "Add Breaking Bad"
1. `tv_search({ query: "breaking bad" })` - find the show
2. Smart pick: Breaking Bad (2008) is obvious match, or ask if ambiguous
3. `tv_add({ tvdb_id: 81189 })` - add with defaults (all episodes, /tv folder)
4. Response: "Added Breaking Bad to TV Shows. Monitoring all 62 episodes. Search started."

### "What's downloading?"
1. `downloads_status()` - unified view
2. Shows Sabnzbd queue with cross-references to Sonarr/Radarr
3. Highlights any issues (stuck imports, failed downloads)

### "Something is stuck"
1. `system_health()` - identify the problem
2. `sonarr_stuck()` - see what's stuck in Sonarr
3. `sonarr_blacklist({ download_id, search_again: true })` - blacklist + re-search

### "Get Inception in 4K"
1. `movie_search({ query: "inception", quality: "4k" })` - routes to Radarr4K
2. `movie_add({ tmdb_id: 27205, quality: "4k" })` - add to Radarr4K
3. Response: "Added Inception (4K) to Movies (4K). Search started."

### "Do I have The Office?"
1. `library_search({ query: "the office" })` - search Plex
2. Response: "Found in TV Shows library: The Office (US) - 201 episodes, 180 watched"

### "What can you do?"
1. `media_help()` - Claude auto-calls or user requests
2. Response: Full system overview + tool catalog + connected services
