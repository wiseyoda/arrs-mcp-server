# Tool Catalog

arrs-mcp-server exposes 88 [MCP](https://modelcontextprotocol.io) tools that let Claude manage your media stack through natural conversation. You do not call these tools directly -- you describe what you want ("add Breaking Bad to Sonarr", "what's stuck in the download queue?") and Claude selects the right tool automatically.

This page documents every tool: what it does, what parameters it accepts, and what you might say to trigger it.

## Tool Tiers

Every tool belongs to one of three tiers:

| Tier | Purpose | Audience |
|------|---------|----------|
| **Semantic** | Natural language tools for everyday use. These are the ones you will interact with most. | Everyone |
| **Admin** | Service-specific operations for troubleshooting and management. More granular control over individual services. | Intermediate users |
| **Extended** | Advanced tools for power users. Deep analysis, cross-service intelligence, and bulk operations. | Power users |

Claude may use any tier at any time based on what you ask. The tiers are informational -- they help you understand the breadth of available functionality, not restrict access.

## How Tools and Services Work

Each tool requires one or more **services** (Sonarr, Radarr, Plex, etc.). When the server starts, it checks which services you have configured and only registers tools whose services are available. For example, if you have not configured Plex, the `library_search` tool will not appear.

A few tools (like `system_health` and `media_help`) are always available regardless of configuration.

For details on configuring services, see [Configuration Reference](configuration.md).

## Safety by Default

Several tools accept a `quality` parameter that selects between HD and 4K Radarr instances. This parameter **defaults to `hd`** so that casual requests like "add Inception" route to your standard library rather than your 4K library. You must explicitly say "in 4K" or set `quality: "4k"` to target the 4K instance.

Destructive operations (`plex_delete`, `sonarr_delete`, `movie_delete`, `overseerr_request_delete`) require explicit confirmation parameters and never auto-confirm.

---

## Quick Reference Table

All 88 tools at a glance. Click a tool name to jump to its detailed documentation.

| # | Tool | Service | Tier | Description |
|---|------|---------|------|-------------|
| 1 | [`tv_search`](#tv_search) | Sonarr | Semantic | Search for TV series by name |
| 2 | [`tv_add`](#tv_add) | Sonarr | Semantic | Add a TV series to Sonarr |
| 3 | [`tv_list`](#tv_list) | Sonarr | Semantic | List all TV series with filtering and sorting |
| 4 | [`tv_episodes`](#tv_episodes) | Sonarr | Semantic | Get episode status for a series |
| 5 | [`tv_search_missing`](#tv_search_missing) | Sonarr | Semantic | Trigger search for missing episodes |
| 6 | [`sonarr_queue`](#sonarr_queue) | Sonarr | Admin | Show download queue with progress and errors |
| 7 | [`sonarr_details`](#sonarr_details) | Sonarr | Admin | Get detailed info about a series |
| 8 | [`sonarr_delete`](#sonarr_delete) | Sonarr | Admin | Remove a series from Sonarr |
| 9 | [`sonarr_profiles`](#sonarr_profiles) | Sonarr | Admin | List available quality profiles |
| 10 | [`sonarr_folders`](#sonarr_folders) | Sonarr | Admin | List available root folders |
| 11 | [`sonarr_stuck`](#sonarr_stuck) | Sonarr | Admin | Find stuck or errored imports |
| 12 | [`sonarr_import`](#sonarr_import) | Sonarr | Admin | Trigger rescan for pending downloads |
| 13 | [`sonarr_blacklist`](#sonarr_blacklist) | Sonarr | Admin | Blacklist a release and optionally search again |
| 14 | [`sonarr_calendar`](#sonarr_calendar) | Sonarr | Admin | Show upcoming episodes |
| 15 | [`sonarr_rename`](#sonarr_rename) | Sonarr | Extended | Rename episode files using naming rules |
| 16 | [`sonarr_refresh`](#sonarr_refresh) | Sonarr | Extended | Refresh series metadata from TVDB |
| 17 | [`sonarr_upcoming`](#sonarr_upcoming) | Sonarr | Extended | Get detailed upcoming episodes |
| 18 | [`movie_search`](#movie_search) | Radarr | Semantic | Search for movies by name or IMDB ID |
| 19 | [`movie_add`](#movie_add) | Radarr | Semantic | Add a movie to Radarr |
| 20 | [`movie_list`](#movie_list) | Radarr | Semantic | List all movies with filtering and sorting |
| 21 | [`movie_upgrade`](#movie_upgrade) | Radarr | Semantic | Search for better quality of an existing movie |
| 22 | [`movie_delete`](#movie_delete) | Radarr | Semantic | Remove a movie from Radarr |
| 23 | [`radarr_queue`](#radarr_queue) | Radarr | Admin | Show download queue with progress and errors |
| 24 | [`radarr_details`](#radarr_details) | Radarr | Admin | Get detailed info about a movie |
| 25 | [`radarr_profiles`](#radarr_profiles) | Radarr | Admin | List available quality profiles |
| 26 | [`radarr_folders`](#radarr_folders) | Radarr | Admin | List available root folders |
| 27 | [`radarr_stuck`](#radarr_stuck) | Radarr | Admin | Find stuck or errored imports |
| 28 | [`radarr_import`](#radarr_import) | Radarr | Admin | Trigger rescan for pending downloads |
| 29 | [`radarr_blacklist`](#radarr_blacklist) | Radarr | Admin | Blacklist a release and optionally search again |
| 30 | [`radarr_rename`](#radarr_rename) | Radarr | Extended | Rename movie files using naming rules |
| 31 | [`radarr_refresh`](#radarr_refresh) | Radarr | Extended | Refresh movie metadata from TMDB |
| 32 | [`radarr_discover`](#radarr_discover) | Radarr | Extended | Get movie recommendations from Radarr |
| 33 | [`library_list`](#library_list) | Plex | Semantic | List all Plex libraries |
| 34 | [`library_search`](#library_search) | Plex | Semantic | Search across Plex libraries |
| 35 | [`library_watched`](#library_watched) | Plex | Semantic | Get watch status for library items |
| 36 | [`library_list_movies`](#library_list_movies) | Plex | Semantic | List movies with advanced filtering |
| 37 | [`plex_recent`](#plex_recent) | Plex | Admin | Show recently added content |
| 38 | [`plex_refresh`](#plex_refresh) | Plex | Admin | Trigger a library scan |
| 39 | [`plex_unwatched`](#plex_unwatched) | Plex | Admin | Find old unwatched content |
| 40 | [`plex_watched_old`](#plex_watched_old) | Plex | Admin | Find content watched long ago |
| 41 | [`plex_delete`](#plex_delete) | Plex | Admin | Permanently delete media from Plex |
| 42 | [`plex_collections`](#plex_collections) | Plex | Extended | List Plex collections |
| 43 | [`plex_duplicates`](#plex_duplicates) | Plex | Extended | Find duplicate items |
| 44 | [`plex_optimize`](#plex_optimize) | Plex | Extended | Optimize the Plex database |
| 45 | [`downloads_queue`](#downloads_queue) | SABnzbd | Semantic | View the download queue |
| 46 | [`downloads_history`](#downloads_history) | SABnzbd | Semantic | View recent download history |
| 47 | [`downloads_pause`](#downloads_pause) | SABnzbd | Semantic | Pause all downloads |
| 48 | [`downloads_resume`](#downloads_resume) | SABnzbd | Semantic | Resume all downloads |
| 49 | [`downloads_speed`](#downloads_speed) | SABnzbd | Semantic | Set download speed limit |
| 50 | [`sabnzbd_delete`](#sabnzbd_delete) | SABnzbd | Admin | Remove item from download queue |
| 51 | [`sabnzbd_failed`](#sabnzbd_failed) | SABnzbd | Admin | List failed downloads |
| 52 | [`sabnzbd_retry`](#sabnzbd_retry) | SABnzbd | Admin | Retry a failed download |
| 53 | [`sabnzbd_priority`](#sabnzbd_priority) | SABnzbd | Admin | Change queue item priority |
| 54 | [`sabnzbd_pause_item`](#sabnzbd_pause_item) | SABnzbd | Admin | Pause a specific download |
| 55 | [`sabnzbd_resume_item`](#sabnzbd_resume_item) | SABnzbd | Admin | Resume a specific paused download |
| 56 | [`sabnzbd_categories`](#sabnzbd_categories) | SABnzbd | Admin | List download categories |
| 57 | [`sabnzbd_quota`](#sabnzbd_quota) | SABnzbd | Extended | Show quota usage and limits |
| 58 | [`sabnzbd_warnings`](#sabnzbd_warnings) | SABnzbd | Extended | Show system warnings |
| 59 | [`request_list`](#request_list) | Overseerr | Semantic | List media requests |
| 60 | [`request_approve`](#request_approve) | Overseerr | Semantic | Approve a pending request |
| 61 | [`request_decline`](#request_decline) | Overseerr | Semantic | Decline a media request |
| 62 | [`overseerr_request_details`](#overseerr_request_details) | Overseerr | Admin | Get details about a request |
| 63 | [`overseerr_request_delete`](#overseerr_request_delete) | Overseerr | Admin | Delete a request |
| 64 | [`overseerr_users`](#overseerr_users) | Overseerr | Admin | List all users |
| 65 | [`overseerr_user_requests`](#overseerr_user_requests) | Overseerr | Admin | View a user's request history |
| 66 | [`overseerr_user_quota`](#overseerr_user_quota) | Overseerr | Admin | Check a user's quota |
| 67 | [`overseerr_issues`](#overseerr_issues) | Overseerr | Admin | List reported issues |
| 68 | [`overseerr_issue_details`](#overseerr_issue_details) | Overseerr | Admin | Get details about an issue |
| 69 | [`overseerr_issue_comment`](#overseerr_issue_comment) | Overseerr | Admin | Add a comment to an issue |
| 70 | [`overseerr_issue_resolve`](#overseerr_issue_resolve) | Overseerr | Admin | Mark an issue as resolved |
| 71 | [`overseerr_trending`](#overseerr_trending) | Overseerr | Admin | Get trending movies and TV shows |
| 72 | [`overseerr_upcoming`](#overseerr_upcoming) | Overseerr | Admin | Get upcoming movie releases |
| 73 | [`tmdb_collection`](#tmdb_collection) | TMDB | Admin | Look up a movie collection |
| 74 | [`tmdb_similar`](#tmdb_similar) | TMDB | Admin | Find similar movies |
| 75 | [`tmdb_recommendations`](#tmdb_recommendations) | TMDB | Admin | Get movie recommendations |
| 76 | [`tmdb_search`](#tmdb_search) | TMDB | Admin | Search TMDB for movies |
| 77 | [`collection_status`](#collection_status) | TMDB + Plex | Semantic | Check collection completion |
| 78 | [`collection_missing`](#collection_missing) | TMDB + Plex | Semantic | List missing collection movies |
| 79 | [`collection_add_missing`](#collection_add_missing) | TMDB + Plex + Radarr | Semantic | Add missing collection movies to Radarr |
| 80 | [`system_health`](#system_health) | Cross-Service | Admin | Check health of all services |
| 81 | [`providers_status`](#providers_status) | Cross-Service | Admin | List configured and missing providers |
| 82 | [`media_help`](#media_help) | None | Semantic | Get overview of tools and services |
| 83 | [`cleanup_analysis`](#cleanup_analysis) | Cross-Service | Admin | Analyze cleanup opportunities |
| 84 | [`downloads_status`](#downloads_status) | Cross-Service | Admin | Unified download status |
| 85 | [`library_audit`](#library_audit) | Cross-Service | Extended | Analyze library consistency |
| 86 | [`library_sync`](#library_sync) | Cross-Service | Extended | Sync Plex orphans to Sonarr/Radarr |
| 87 | [`space_planner`](#space_planner) | Plex | Extended | Smart cleanup recommendations |
| 88 | [`watch_analytics`](#watch_analytics) | Plex | Extended | Viewing statistics and insights |

---

## Sonarr Tools

Sonarr manages TV series: searching, downloading, organizing, and monitoring episodes. These 17 tools cover everything from adding a new show to renaming files.

**Provider required**: `sonarr`

### `tv_search`

Search for TV series by name to find TVDB IDs for adding. This is typically the first step before adding a show -- search to find the correct series, then pass the TVDB ID to `tv_add`.

**Provider**: sonarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Series name to search for |

**Example**: "Search for Breaking Bad on Sonarr"

**See also**: [`tv_add`](#tv_add) -- use the TVDB ID from search results to add a series.

---

### `tv_add`

Add a TV series to Sonarr. Use `tv_search` first to find the TVDB ID. By default, all episodes are monitored and a search starts immediately.

**Provider**: sonarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tvdb_id | number | Yes | TVDB ID of the series to add |
| monitor | enum: `all`, `future`, `missing`, `none` | No | Which episodes to monitor. Default: `all` |
| quality_profile | string | No | Quality profile name (see `sonarr_profiles` for options) |
| root_folder | string | No | Root folder path (see `sonarr_folders` for options) |
| search_now | boolean | No | Start searching for episodes immediately. Default: `true` |

**Example**: "Add Breaking Bad to Sonarr" or "Add The Bear but only monitor future episodes"

**See also**: [`tv_search`](#tv_search) -- find the TVDB ID first. [`sonarr_profiles`](#sonarr_profiles), [`sonarr_folders`](#sonarr_folders) -- list available options.

---

### `tv_list`

List all TV series in Sonarr with flexible filtering, sorting, and display options. Supports pagination for large libraries.

**Provider**: sonarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | enum: `continuing`, `ended`, `all` | No | Filter by series status. Default: `all` |
| network | string | No | Filter by network name (e.g., "HBO", "Netflix") |
| genre | string | No | Filter by genre (e.g., "Drama", "Comedy") |
| missing_only | boolean | No | Only show series with missing episodes |
| unmonitored_only | boolean | No | Only show unmonitored series |
| sort | enum: `title`, `size`, `added`, `percent` | No | Sort order. Default: `title` |
| limit | number | No | Maximum results to return. Default: `100` |
| offset | number | No | Skip results for pagination. Default: `0` |
| summary | boolean | No | Only return aggregate counts instead of full list |
| show_size | boolean | No | Include disk size in results |
| show_network | boolean | No | Include network name in results |
| show_runtime | boolean | No | Include episode runtime in results |
| show_added | boolean | No | Include date added in results |

**Example**: "List all HBO shows in Sonarr" or "Show me series with missing episodes, sorted by size"

---

### `tv_episodes`

Get episode status for a specific TV series. Shows which episodes are downloaded, missing, or monitored. Optionally filter to a single season.

**Provider**: sonarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| series_id | number | Yes | Sonarr series ID |
| season | number | No | Filter to a specific season number |

**Example**: "Show me the episode status for Breaking Bad" or "What episodes am I missing from season 3 of The Bear?"

**See also**: [`tv_search_missing`](#tv_search_missing) -- trigger a search for any missing episodes.

---

### `tv_search_missing`

Trigger a search for missing episodes. Can target a specific series or search across all monitored series.

**Provider**: sonarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| series_id | number | No | Sonarr series ID. Searches all monitored series if not specified |

**Example**: "Search for missing episodes of The Expanse" or "Search for all missing episodes"

**See also**: [`tv_episodes`](#tv_episodes) -- check which episodes are missing before searching.

---

### `sonarr_queue`

Show the Sonarr download queue with progress percentages, estimated time remaining, and any errors or warnings.

**Provider**: sonarr | **Tier**: Admin

No parameters.

**Example**: "What's downloading in Sonarr?" or "Show me the Sonarr queue"

**See also**: [`downloads_status`](#downloads_status) -- unified view across all download services.

---

### `sonarr_details`

Get detailed information about a specific TV series including seasons, episode counts, file sizes, quality profile, and monitoring status.

**Provider**: sonarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| series_id | number | Yes | Sonarr series ID |

**Example**: "Show me the full details for Breaking Bad in Sonarr"

---

### `sonarr_delete`

Remove a TV series from Sonarr. By default, the files on disk are kept. Set `delete_files` to true to also remove downloaded episode files permanently.

**Provider**: sonarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| series_id | number | Yes | Sonarr series ID |
| delete_files | boolean | No | Also delete episode files from disk. Default: `false` |

**Example**: "Remove Breaking Bad from Sonarr" or "Delete The Bear from Sonarr and remove the files"

---

### `sonarr_profiles`

List all available quality profiles in Sonarr. Useful when adding a new series to see which profiles are configured.

**Provider**: sonarr | **Tier**: Admin

No parameters.

**Example**: "What quality profiles are available in Sonarr?"

**See also**: [`tv_add`](#tv_add) -- use a profile name from this list when adding a series.

---

### `sonarr_folders`

List all available root folders in Sonarr with their free space. Useful when adding a new series to see where content can be stored.

**Provider**: sonarr | **Tier**: Admin

No parameters.

**Example**: "What root folders are set up in Sonarr?"

**See also**: [`tv_add`](#tv_add) -- use a folder path from this list when adding a series.

---

### `sonarr_stuck`

Find download queue items that are stuck in the importing state or have errors. Helps identify downloads that need manual intervention.

**Provider**: sonarr | **Tier**: Admin

No parameters.

**Example**: "Are there any stuck downloads in Sonarr?"

**See also**: [`sonarr_import`](#sonarr_import) -- trigger a rescan to attempt importing stuck items. [`sonarr_blacklist`](#sonarr_blacklist) -- blacklist a problematic release and search for a replacement.

---

### `sonarr_import`

Trigger a rescan to detect and import any pending downloads. Can target a specific series or rescan everything.

**Provider**: sonarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| series_id | number | No | Sonarr series ID. Rescans all if not specified |

**Example**: "Rescan Sonarr for pending imports" or "Trigger an import scan for Breaking Bad"

**See also**: [`sonarr_stuck`](#sonarr_stuck) -- check for stuck items first.

---

### `sonarr_blacklist`

Blacklist a problematic release from the queue so Sonarr will not download it again. Optionally triggers a new search for a replacement release.

**Provider**: sonarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| queue_id | number | Yes | Queue item ID to blacklist |
| search_again | boolean | No | Search for a replacement release. Default: `true` |

**Example**: "Blacklist that stuck download and search for a new one"

**See also**: [`sonarr_queue`](#sonarr_queue) -- find the queue item ID. [`sonarr_stuck`](#sonarr_stuck) -- identify problematic items.

---

### `sonarr_calendar`

Show upcoming episodes airing in the next N days. A quick way to see what is coming soon across all your monitored series.

**Provider**: sonarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Number of days to look ahead. Default: `7` |

**Example**: "What episodes are airing this week?" or "Show me the Sonarr calendar for the next 14 days"

**See also**: [`sonarr_upcoming`](#sonarr_upcoming) -- more detailed upcoming episode information.

---

### `sonarr_rename`

Rename all episode files for a series to match Sonarr's configured naming rules. Useful after changing naming formats or importing files with inconsistent names.

**Provider**: sonarr | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| series_id | number | Yes | Sonarr series ID |

**Example**: "Rename all episode files for Breaking Bad to match Sonarr's naming format"

---

### `sonarr_refresh`

Refresh series metadata from TVDB. Pulls the latest episode information, artwork, and series details.

**Provider**: sonarr | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| series_id | number | Yes | Sonarr series ID |

**Example**: "Refresh the metadata for The Bear from TVDB"

---

### `sonarr_upcoming`

Get detailed information about upcoming episodes for the next N days, including episode titles, air dates, and series details.

**Provider**: sonarr | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Number of days to look ahead. Default: `7` |

**Example**: "Give me detailed info about upcoming episodes this week"

**See also**: [`sonarr_calendar`](#sonarr_calendar) -- a more concise calendar view.

---

## Radarr Tools

Radarr manages movies: searching, downloading, organizing, and quality upgrades. These 15 tools include support for dual HD/4K instances. The `quality` parameter defaults to `hd` for safety -- you must explicitly request 4K.

**Provider required**: `radarr` (and optionally `radarr4k` for 4K support)

### `movie_search`

Search for movies by name to find TMDB IDs for adding. Also supports IMDB ID lookup using the `imdb:tt1234567` format.

**Provider**: radarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Movie name to search for, or `imdb:tt1234567` for IMDB ID lookup |
| quality | enum: `hd`, `4k` | No | Which Radarr instance to search. Default: `hd` |

**Example**: "Search for Inception" or "Look up imdb:tt0816692 on Radarr"

**See also**: [`movie_add`](#movie_add) -- use the TMDB ID from search results to add a movie.

---

### `movie_add`

Add a movie to Radarr. Use `movie_search` first to find the TMDB ID. The quality parameter defaults to `hd` so casual requests go to your standard library -- say "in 4K" explicitly to target the 4K instance.

**Provider**: radarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tmdb_id | number | Yes | TMDB ID of the movie to add |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` (safe default) |
| quality_profile | string | No | Quality profile name (see `radarr_profiles` for options) |
| root_folder | string | No | Root folder path (see `radarr_folders` for options) |
| search_now | boolean | No | Start searching for the movie immediately. Default: `true` |

**Example**: "Add Inception to Radarr" or "Add Dune Part Two in 4K"

**See also**: [`movie_search`](#movie_search) -- find the TMDB ID first. [`radarr_profiles`](#radarr_profiles), [`radarr_folders`](#radarr_folders) -- list available options.

---

### `movie_list`

List all movies in Radarr with flexible filtering, sorting, and display options. Supports pagination for large libraries.

**Provider**: radarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | enum: `released`, `inCinemas`, `announced`, `all` | No | Filter by release status. Default: `all` |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |
| genre | string | No | Filter by genre (e.g., "Action", "Comedy") |
| missing_only | boolean | No | Only show movies not yet downloaded |
| unmonitored_only | boolean | No | Only show unmonitored movies |
| sort | enum: `title`, `size`, `added`, `year`, `rating` | No | Sort order. Default: `title` |
| limit | number | No | Maximum results to return. Default: `100` |
| offset | number | No | Skip results for pagination. Default: `0` |
| summary | boolean | No | Only return aggregate counts |
| show_size | boolean | No | Include file size in results |
| show_rating | boolean | No | Include rating in results |
| show_runtime | boolean | No | Include runtime in results |
| show_added | boolean | No | Include date added in results |

**Example**: "List all missing movies in Radarr" or "Show my 4K movies sorted by size"

---

### `movie_upgrade`

Trigger a search for a better quality version of an existing movie. Useful when Radarr initially grabbed a lower quality release and you want an upgrade.

**Provider**: radarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| movie_id | number | Yes | Radarr movie ID |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "Search for a better quality version of Inception"

---

### `movie_delete`

Remove a movie from Radarr. By default, the file on disk is kept. Set `delete_files` to true to also remove the movie file permanently.

**Provider**: radarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| movie_id | number | Yes | Radarr movie ID |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |
| delete_files | boolean | No | Also delete movie file from disk. Default: `false` |

**Example**: "Remove Inception from Radarr" or "Delete The Room from Radarr and remove the file"

---

### `radarr_queue`

Show the Radarr download queue with progress percentages, estimated time remaining, and any errors or warnings.

**Provider**: radarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "What's downloading in Radarr?" or "Show the 4K Radarr queue"

**See also**: [`downloads_status`](#downloads_status) -- unified view across all download services.

---

### `radarr_details`

Get detailed information about a specific movie including file size, quality, ratings, and monitoring status.

**Provider**: radarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| movie_id | number | Yes | Radarr movie ID |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "Show me the full details for Inception in Radarr"

---

### `radarr_profiles`

List all available quality profiles in Radarr. Useful when adding a new movie to see which profiles are configured.

**Provider**: radarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "What quality profiles are available in Radarr?"

**See also**: [`movie_add`](#movie_add) -- use a profile name from this list when adding a movie.

---

### `radarr_folders`

List all available root folders in Radarr with their free space. Useful when adding a new movie to see where content can be stored.

**Provider**: radarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "What root folders are set up in Radarr?"

**See also**: [`movie_add`](#movie_add) -- use a folder path from this list when adding a movie.

---

### `radarr_stuck`

Find download queue items that are stuck in the importing state or have errors. Helps identify downloads that need manual intervention.

**Provider**: radarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "Are there any stuck downloads in Radarr?"

**See also**: [`radarr_import`](#radarr_import) -- trigger a rescan to attempt importing stuck items. [`radarr_blacklist`](#radarr_blacklist) -- blacklist a problematic release.

---

### `radarr_import`

Trigger a rescan to detect and import any pending movie downloads. Can target a specific movie or rescan everything.

**Provider**: radarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| movie_id | number | No | Radarr movie ID. Rescans all if not specified |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "Rescan Radarr for pending imports"

**See also**: [`radarr_stuck`](#radarr_stuck) -- check for stuck items first.

---

### `radarr_blacklist`

Blacklist a problematic release from the queue so Radarr will not download it again. Optionally triggers a new search for a replacement release.

**Provider**: radarr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| queue_id | number | Yes | Queue item ID to blacklist |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |
| search_again | boolean | No | Search for a replacement release. Default: `true` |

**Example**: "Blacklist that stuck Radarr download and search again"

**See also**: [`radarr_queue`](#radarr_queue) -- find the queue item ID. [`radarr_stuck`](#radarr_stuck) -- identify problematic items.

---

### `radarr_rename`

Rename movie files to match Radarr's configured naming rules. Useful after changing naming formats or importing files with inconsistent names.

**Provider**: radarr | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| movie_id | number | Yes | Radarr movie ID |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "Rename the Inception file to match Radarr's naming format"

---

### `radarr_refresh`

Refresh movie metadata from TMDB. Pulls the latest information, artwork, and details.

**Provider**: radarr | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| movie_id | number | Yes | Radarr movie ID |
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |

**Example**: "Refresh the metadata for Inception from TMDB"

---

### `radarr_discover`

Get movie recommendations from Radarr's built-in discovery feature. Shows popular and recommended movies that are not already in your library.

**Provider**: radarr | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| quality | enum: `hd`, `4k` | No | Which Radarr instance. Default: `hd` |
| limit | number | No | Maximum recommendations to return. Default: `20` |

**Example**: "Show me Radarr's movie recommendations" or "What movies does Radarr suggest?"

**See also**: [`tmdb_recommendations`](#tmdb_recommendations) -- TMDB-based recommendations for a specific movie. [`overseerr_trending`](#overseerr_trending) -- trending titles from Overseerr.

---

## Plex Tools

Plex is your media library: it stores, organizes, and streams your content. These 12 tools let you browse, search, analyze watch history, and manage your library.

**Provider required**: `plex`

### `library_list`

List all Plex libraries (Movies, TV Shows, Music, etc.) with item counts and storage information.

**Provider**: plex | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum results. Default: `100` |
| offset | number | No | Skip results for pagination. Default: `0` |
| summary | boolean | No | Only return aggregate counts |

**Example**: "What libraries do I have in Plex?" or "How many items are in each Plex library?"

---

### `library_search`

Search for content across all Plex libraries or within a specific library. Finds movies, shows, episodes, and other media by title.

**Provider**: plex | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search term |
| library | string | No | Filter to a specific library name (e.g., "Movies", "TV Shows") |
| limit | number | No | Maximum results. Default: `20` |
| offset | number | No | Skip results for pagination. Default: `0` |
| summary | boolean | No | Only return aggregate counts |

**Example**: "Search Plex for Inception" or "Find anything with 'Star Wars' in my TV Shows library"

---

### `library_watched`

Get the watch status for items in a specific Plex library. Shows what has been watched, what has not, and watch progress.

**Provider**: plex | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| library | string | Yes | Library name (e.g., "Movies", "TV Shows") |
| filter | enum: `all`, `watched`, `unwatched` | No | Filter by watch status. Default: `all` |
| limit | number | No | Maximum results. Default: `50` |

**Example**: "What movies haven't I watched yet?" or "Show my watched status for the Movies library"

---

### `library_list_movies`

List movies in Plex with advanced filtering, sorting, and display options. The most flexible way to explore your movie library with filters for genre, year, resolution, watch status, and more.

**Provider**: plex | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| library | string | No | Library name to search |
| genre | string | No | Filter by genre (e.g., "Action", "Sci-Fi") |
| content_rating | string | No | Filter by content rating (e.g., "PG-13", "R") |
| year | number | No | Filter by exact release year |
| year_min | number | No | Filter by minimum release year |
| year_max | number | No | Filter by maximum release year |
| country | string | No | Filter by country of origin |
| studio | string | No | Filter by studio name |
| director | string | No | Filter by director name |
| actor | string | No | Filter by actor name |
| resolution | enum: `4k`, `1080`, `720`, `sd` | No | Filter by video resolution |
| watched_only | boolean | No | Only show watched movies |
| unwatched_only | boolean | No | Only show unwatched movies |
| watched_since_days | number | No | Only show movies watched in the last N days |
| sort | enum: `title`, `rating`, `audience_rating`, `year`, `added`, `watched`, `size`, `duration` | No | Sort order |
| limit | number | No | Maximum results |
| show_rating | boolean | No | Include critic rating |
| show_audience_rating | boolean | No | Include audience rating |
| show_genre | boolean | No | Include genre tags |
| show_director | boolean | No | Include director name |
| show_runtime | boolean | No | Include runtime |
| show_size | boolean | No | Include file size |
| show_resolution | boolean | No | Include video resolution |
| show_added | boolean | No | Include date added |

**Example**: "Show me all 4K sci-fi movies in Plex" or "List unwatched movies from 2024 sorted by rating"

---

### `plex_recent`

Show recently added content in Plex. Great for seeing what new media has arrived in your library.

**Provider**: plex | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| library | string | No | Filter to a specific library |
| limit | number | No | Maximum results. Default: `20` |

**Example**: "What was recently added to Plex?" or "Show the last 10 movies added"

---

### `plex_refresh`

Trigger a library scan in Plex to detect new, changed, or removed files. Can target a specific library or scan everything.

**Provider**: plex | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| library | string | No | Library name to refresh. Refreshes all libraries if not specified |

**Example**: "Scan the Plex library for new content" or "Refresh the Movies library in Plex"

---

### `plex_unwatched`

Find unwatched content that has been in your library for a long time. Useful for identifying movies or shows you added but never got around to watching, which are candidates for cleanup.

**Provider**: plex | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Minimum age in days since added. Default: `365` |
| library | string | No | Filter to a specific library |
| limit | number | No | Maximum results. Default: `50` |
| show_size | boolean | No | Include file size. Default: `true` |
| show_rating | boolean | No | Include rating. Default: `false` |
| sort | enum: `size`, `added`, `title`, `rating` | No | Sort order. Default: `size` |

**Example**: "What movies have I had for over a year and never watched?" or "Show unwatched content older than 6 months, sorted by size"

**See also**: [`plex_delete`](#plex_delete) -- remove unwanted items. [`cleanup_analysis`](#cleanup_analysis) -- comprehensive cleanup recommendations.

---

### `plex_watched_old`

Find content you watched a long time ago. Useful for identifying movies or shows that you have already seen and might be ready to remove to free up space.

**Provider**: plex | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Minimum days since last watched. Default: `180` |
| library | string | No | Filter to a specific library |
| limit | number | No | Maximum results. Default: `50` |
| show_size | boolean | No | Include file size. Default: `true` |
| sort | enum: `watched`, `size`, `title` | No | Sort order. Default: `watched` |
| ended_only | boolean | No | Only show ended/cancelled TV series. Default: `false` |

**Example**: "What movies did I watch over 6 months ago?" or "Show me ended TV shows I watched a while back, sorted by size"

**See also**: [`plex_delete`](#plex_delete) -- remove unwanted items. [`cleanup_analysis`](#cleanup_analysis) -- comprehensive cleanup recommendations.

---

### `plex_delete`

Permanently delete media from Plex. This is destructive -- it removes the actual files from disk. Requires explicit confirmation.

**Provider**: plex | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| rating_key | string | Yes | Plex rating key (item ID) of the media to delete |
| confirm | boolean | No | Must be `true` to proceed with deletion |

**Example**: "Delete that old unwatched movie from Plex" (Claude will ask for confirmation before proceeding)

**See also**: [`plex_unwatched`](#plex_unwatched), [`plex_watched_old`](#plex_watched_old) -- find candidates for deletion.

---

### `plex_collections`

List collections in your Plex libraries. Shows collection names, item counts, and which library they belong to.

**Provider**: plex | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| library | string | No | Filter to a specific library |

**Example**: "What collections do I have in Plex?"

---

### `plex_duplicates`

Find duplicate items in your Plex libraries. Identifies movies or episodes that have multiple versions, which may be wasting disk space.

**Provider**: plex | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| library | string | No | Filter to a specific library |

**Example**: "Are there any duplicate movies in Plex?"

**See also**: [`cleanup_analysis`](#cleanup_analysis) -- includes duplicates as part of comprehensive cleanup recommendations.

---

### `plex_optimize`

Trigger Plex database optimization. This compacts the database and can improve performance, especially for large libraries.

**Provider**: plex | **Tier**: Extended

No parameters.

**Example**: "Optimize the Plex database"

---

## SABnzbd Tools

SABnzbd is a Usenet download client. These 14 tools let you monitor, control, and troubleshoot your downloads.

**Provider required**: `sabnzbd`

### `downloads_queue`

View the current SABnzbd download queue showing all active and queued downloads with progress, speed, and estimated completion times.

**Provider**: sabnzbd | **Tier**: Semantic

No parameters.

**Example**: "What's downloading right now?" or "Show me the download queue"

**See also**: [`downloads_status`](#downloads_status) -- unified view across all services. [`sonarr_queue`](#sonarr_queue), [`radarr_queue`](#radarr_queue) -- service-specific queues.

---

### `downloads_history`

View recent download history showing completed, failed, and in-progress downloads.

**Provider**: sabnzbd | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum history entries to show. Default: `20` |

**Example**: "Show my recent download history" or "What finished downloading recently?"

---

### `downloads_pause`

Pause all active SABnzbd downloads. Downloads remain in the queue but stop transferring data.

**Provider**: sabnzbd | **Tier**: Semantic

No parameters.

**Example**: "Pause all downloads" or "Stop downloading for now"

**See also**: [`downloads_resume`](#downloads_resume) -- resume paused downloads.

---

### `downloads_resume`

Resume all paused SABnzbd downloads. Restarts data transfer for all items in the queue.

**Provider**: sabnzbd | **Tier**: Semantic

No parameters.

**Example**: "Resume downloads" or "Start downloading again"

**See also**: [`downloads_pause`](#downloads_pause) -- pause downloads.

---

### `downloads_speed`

Set the SABnzbd download speed limit. You can set a specific limit in MB/s or remove the limit entirely for full-speed downloading.

**Provider**: sabnzbd | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| speed | number | No | Speed limit in MB/s |
| unlimited | boolean | No | Remove speed limit entirely |

**Example**: "Limit downloads to 50 MB/s" or "Remove the download speed limit"

---

### `sabnzbd_delete`

Remove a specific item from the SABnzbd download queue. The download is cancelled and removed.

**Provider**: sabnzbd | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nzo_id | string | Yes | SABnzbd queue item ID |

**Example**: "Remove that stuck download from the queue"

**See also**: [`downloads_queue`](#downloads_queue) -- find the item ID.

---

### `sabnzbd_failed`

List downloads that have failed. Shows error reasons and item IDs that can be used with `sabnzbd_retry` to attempt the download again.

**Provider**: sabnzbd | **Tier**: Admin

No parameters.

**Example**: "Are there any failed downloads?" or "Show me what failed"

**See also**: [`sabnzbd_retry`](#sabnzbd_retry) -- retry a failed download.

---

### `sabnzbd_retry`

Retry a previously failed download. SABnzbd will attempt to download the item again from scratch.

**Provider**: sabnzbd | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nzo_id | string | Yes | SABnzbd item ID of the failed download |

**Example**: "Retry that failed download"

**See also**: [`sabnzbd_failed`](#sabnzbd_failed) -- find the item ID of failed downloads.

---

### `sabnzbd_priority`

Change the priority of a download queue item. Higher priority items are downloaded before lower priority ones.

**Provider**: sabnzbd | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nzo_id | string | Yes | SABnzbd queue item ID |
| position | enum: `top`, `bottom`, `high`, `normal`, `low` | Yes | New priority level |

**Example**: "Move that download to the top of the queue" or "Set the priority of that item to high"

**See also**: [`downloads_queue`](#downloads_queue) -- find the item ID.

---

### `sabnzbd_pause_item`

Pause a specific item in the download queue without affecting other downloads. The item stays in the queue but stops transferring.

**Provider**: sabnzbd | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nzo_id | string | Yes | SABnzbd queue item ID |

**Example**: "Pause just that one download"

**See also**: [`sabnzbd_resume_item`](#sabnzbd_resume_item) -- resume a specific paused item. [`downloads_pause`](#downloads_pause) -- pause all downloads.

---

### `sabnzbd_resume_item`

Resume a specific paused item in the download queue without affecting other items.

**Provider**: sabnzbd | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| nzo_id | string | Yes | SABnzbd queue item ID |

**Example**: "Resume that paused download"

**See also**: [`sabnzbd_pause_item`](#sabnzbd_pause_item) -- pause a specific item. [`downloads_resume`](#downloads_resume) -- resume all downloads.

---

### `sabnzbd_categories`

List all configured download categories in SABnzbd. Categories control where downloads are saved and how they are processed.

**Provider**: sabnzbd | **Tier**: Admin

No parameters.

**Example**: "What download categories are configured in SABnzbd?"

---

### `sabnzbd_quota`

Show SABnzbd quota usage and limits. Displays how much data has been downloaded against any configured monthly or daily quotas.

**Provider**: sabnzbd | **Tier**: Extended

No parameters.

**Example**: "How much of my download quota have I used?" or "Show SABnzbd quota status"

---

### `sabnzbd_warnings`

Show SABnzbd system warnings and alerts. Useful for diagnosing connectivity, disk space, or configuration issues.

**Provider**: sabnzbd | **Tier**: Extended

No parameters.

**Example**: "Are there any SABnzbd warnings?" or "Show me SABnzbd system alerts"

---

## Overseerr Tools

Overseerr manages media requests from your users. These 14 tools let you approve or decline requests, manage users, handle issues, and discover trending content.

**Provider required**: `overseerr`

### `request_list`

List media requests with optional status filtering. Shows who requested what, when, and the current approval status.

**Provider**: overseerr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | enum: `pending`, `approved`, `available`, `declined`, `all` | No | Filter by request status. Default: `all` |
| limit | number | No | Maximum results. Default: `20` |

**Example**: "Show me pending requests" or "List all media requests"

**See also**: [`request_approve`](#request_approve), [`request_decline`](#request_decline) -- act on pending requests.

---

### `request_approve`

Approve a pending media request. Once approved, Sonarr or Radarr will begin searching for the requested content.

**Provider**: overseerr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| request_id | number | Yes | Request ID to approve |

**Example**: "Approve request 42" or "Approve that pending request for Inception"

**See also**: [`request_list`](#request_list) -- find request IDs. [`request_decline`](#request_decline) -- decline instead.

---

### `request_decline`

Decline a media request with an optional reason that is visible to the user who made the request.

**Provider**: overseerr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| request_id | number | Yes | Request ID to decline |
| reason | string | No | Reason for declining (max 500 characters) |

**Example**: "Decline request 42 because we already have it on Blu-ray"

**See also**: [`request_list`](#request_list) -- find request IDs. [`request_approve`](#request_approve) -- approve instead.

---

### `overseerr_request_details`

Get detailed information about a specific media request, including the requested media, who requested it, approval status, and timestamps.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| request_id | number | Yes | Request ID to look up |

**Example**: "Show me the details for request 42"

---

### `overseerr_request_delete`

Delete a media request entirely. This is a destructive operation and requires explicit confirmation.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| request_id | number | Yes | Request ID to delete |
| confirm | boolean | Yes | Must be `true` to proceed with deletion |

**Example**: "Delete request 42"

---

### `overseerr_users`

List all Overseerr users with their request counts, permissions, and account details.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum results. Default: `50` |

**Example**: "List all Overseerr users" or "Who has access to Overseerr?"

**See also**: [`overseerr_user_requests`](#overseerr_user_requests) -- see a specific user's requests. [`overseerr_user_quota`](#overseerr_user_quota) -- check a user's quota.

---

### `overseerr_user_requests`

View the request history for a specific Overseerr user. Shows all requests they have made and their current status.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | number | Yes | Overseerr user ID |

**Example**: "Show me what user 5 has requested"

**See also**: [`overseerr_users`](#overseerr_users) -- find user IDs.

---

### `overseerr_user_quota`

Check a specific user's request quota and limits. Shows how many requests they have used and how many remain.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | number | Yes | Overseerr user ID |

**Example**: "How many requests does user 5 have left?"

**See also**: [`overseerr_users`](#overseerr_users) -- find user IDs.

---

### `overseerr_issues`

List reported issues (problems with media quality, missing subtitles, playback errors, etc.) from Overseerr users.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | enum: `open`, `resolved`, `all` | No | Filter by issue status. Default: `all` |
| limit | number | No | Maximum results. Default: `20` |

**Example**: "Show me open issues in Overseerr" or "Are there any reported problems?"

**See also**: [`overseerr_issue_details`](#overseerr_issue_details) -- get full details on an issue. [`overseerr_issue_resolve`](#overseerr_issue_resolve) -- mark an issue as resolved.

---

### `overseerr_issue_details`

Get detailed information about a specific reported issue, including the media item, reporter, description, and any comments.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| issue_id | number | Yes | Issue ID to look up |

**Example**: "Show me the details on issue 7"

**See also**: [`overseerr_issues`](#overseerr_issues) -- find issue IDs. [`overseerr_issue_comment`](#overseerr_issue_comment) -- add a comment. [`overseerr_issue_resolve`](#overseerr_issue_resolve) -- resolve the issue.

---

### `overseerr_issue_comment`

Add a comment to an existing issue. Use this to provide updates, ask for more information, or document troubleshooting steps.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| issue_id | number | Yes | Issue ID to comment on |
| comment | string | Yes | Comment text (minimum 1 character) |

**Example**: "Add a comment to issue 7 saying the subtitle file has been replaced"

**See also**: [`overseerr_issue_details`](#overseerr_issue_details) -- view the issue first. [`overseerr_issue_resolve`](#overseerr_issue_resolve) -- resolve after commenting.

---

### `overseerr_issue_resolve`

Mark an issue as resolved. This closes the issue and notifies the reporter.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| issue_id | number | Yes | Issue ID to resolve |

**Example**: "Resolve issue 7"

**See also**: [`overseerr_issues`](#overseerr_issues) -- find issue IDs. [`overseerr_issue_comment`](#overseerr_issue_comment) -- add a note before resolving.

---

### `overseerr_trending`

Get trending movies and TV shows from Overseerr (sourced from TMDB data). Useful for discovering popular content your users might want.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | enum: `movie`, `tv`, `all` | No | Filter by media type. Default: `all` |
| limit | number | No | Maximum results. Default: `10` |

**Example**: "What's trending right now?" or "Show me trending TV shows"

**See also**: [`radarr_discover`](#radarr_discover) -- Radarr-specific recommendations. [`tmdb_recommendations`](#tmdb_recommendations) -- recommendations based on a specific title.

---

### `overseerr_upcoming`

Get upcoming movie releases from Overseerr. Shows movies that are announced or in production with expected release dates.

**Provider**: overseerr | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum results. Default: `10` |

**Example**: "What movies are coming out soon?" or "Show upcoming releases"

---

## TMDB Tools

TMDB (The Movie Database) provides movie metadata, collections, and recommendation data. These 7 tools split into two groups: direct TMDB lookups (Admin tier, require the `tmdb` provider) and collection management tools (Semantic tier, require `tmdb` + `plex` + optionally `radarr`).

### `tmdb_collection`

Look up a movie collection (franchise) by name or by TMDB collection ID. Returns all movies in the collection with release dates and overview.

**Provider**: tmdb | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | No | Collection name to search for (e.g., "Harry Potter") |
| collection_id | number | No | Direct lookup by TMDB collection ID |

At least one of `query` or `collection_id` must be provided.

**Example**: "Look up the Harry Potter collection" or "Find the Marvel Cinematic Universe collection"

**See also**: [`collection_status`](#collection_status) -- check how many you own. [`collection_missing`](#collection_missing) -- see what you are missing. [`collection_add_missing`](#collection_add_missing) -- add the missing ones.

---

### `tmdb_similar`

Find movies similar to a given title. Returns a list of movies that TMDB considers similar in genre, theme, or style. Optionally filters to only show movies not already in your Plex library.

**Provider**: tmdb | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tmdb_id | number | Yes | TMDB ID of the movie to find similar titles for |
| missing_only | boolean | No | Only show movies not in your Plex library. Default: `false` |
| limit | number | No | Maximum results. Default: `10` |

**Example**: "Show me movies similar to Inception" or "Find movies like Interstellar that I don't already have"

**See also**: [`tmdb_recommendations`](#tmdb_recommendations) -- TMDB recommendations (different algorithm). [`movie_add`](#movie_add) -- add any interesting results.

---

### `tmdb_recommendations`

Get movie recommendations based on a specific title. TMDB recommendations use a different algorithm than similar movies and often surface less obvious but well-matched titles.

**Provider**: tmdb | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tmdb_id | number | Yes | TMDB ID of the movie to get recommendations for |
| missing_only | boolean | No | Only show movies not in your Plex library. Default: `false` |
| limit | number | No | Maximum results. Default: `10` |

**Example**: "What does TMDB recommend based on Inception?" or "Get recommendations like The Dark Knight that I'm missing"

**See also**: [`tmdb_similar`](#tmdb_similar) -- similar movies (different algorithm). [`movie_add`](#movie_add) -- add any interesting results.

---

### `tmdb_search`

Search TMDB for movies by title. Returns basic movie information including TMDB IDs, release dates, and overviews. Useful for finding TMDB IDs without going through Radarr.

**Provider**: tmdb | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Movie title to search for |
| limit | number | No | Maximum results. Default: `10` |

**Example**: "Search TMDB for Inception" or "Find the TMDB ID for Dune"

---

### `collection_status`

Check how many movies from a specific franchise collection you already own in Plex. Shows a completion percentage and lists which movies you have and which you are missing.

**Provider**: tmdb + plex | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collection_id | number | Yes | TMDB collection ID |

**Example**: "How complete is my Harry Potter collection?" or "Do I have all the Lord of the Rings movies?"

**See also**: [`tmdb_collection`](#tmdb_collection) -- find the collection ID. [`collection_missing`](#collection_missing) -- list the missing movies. [`collection_add_missing`](#collection_add_missing) -- add them to Radarr.

---

### `collection_missing`

List all movies you are missing from a specific franchise collection. Compares the TMDB collection data against your Plex library.

**Provider**: tmdb + plex | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collection_id | number | Yes | TMDB collection ID |

**Example**: "What Harry Potter movies am I missing?" or "Which Lord of the Rings movies don't I have?"

**See also**: [`tmdb_collection`](#tmdb_collection) -- find the collection ID. [`collection_status`](#collection_status) -- see completion percentage. [`collection_add_missing`](#collection_add_missing) -- add the missing movies.

---

### `collection_add_missing`

Add missing movies from a franchise collection to Radarr so they will be downloaded. Can add all missing movies or a specific subset by TMDB ID. Requires confirmation to proceed.

**Provider**: tmdb + plex + radarr | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| collection_id | number | Yes | TMDB collection ID |
| confirm | boolean | Yes | Must be `true` to proceed with adding movies |
| tmdb_ids | string | No | Comma-separated TMDB IDs to add specific movies instead of all missing |

**Example**: "Add the missing Harry Potter movies to Radarr" or "Add just the first two missing Star Wars movies"

**See also**: [`collection_missing`](#collection_missing) -- see what is missing before adding. [`tmdb_collection`](#tmdb_collection) -- find the collection ID.

---

## Cross-Service Tools

These 5 tools work across multiple services or require no specific provider. They provide unified views and system-level information.

### `system_health`

Check the health status of all configured services. Reports connectivity, response times, and any errors for each service. Always available regardless of configuration.

**Provider**: cross-service (always registered) | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| verbose | boolean | No | Include detailed response information for each service |

**Example**: "Are all my services healthy?" or "Check the health of everything"

---

### `providers_status`

List all configured and missing providers with their capabilities. Shows which services are connected, which tools each provider enables, and what you would gain by adding missing services. Always available regardless of configuration.

**Provider**: cross-service (always registered) | **Tier**: Admin

No parameters.

**Example**: "What services are configured?" or "Which providers am I missing?"

---

### `media_help`

Get an overview of available tools and connected services. Can optionally focus on a specific topic area. This is a good starting point if you are new to the server. Always available regardless of configuration.

**Provider**: none (always registered) | **Tier**: Semantic

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| topic | enum: `sonarr`, `radarr`, `plex`, `sabnzbd`, `downloads`, `tools`, `cleanup`, `workflows` | No | Focus on a specific topic area |

**Example**: "What can you do with my media setup?" or "Help me understand the cleanup tools"

---

### `cleanup_analysis`

Analyze cleanup opportunities across all connected services. Identifies unwatched content, items watched long ago, duplicates, and other candidates for removal to free up disk space. Always available regardless of configuration (but provides more data with more services configured).

**Provider**: cross-service (always registered) | **Tier**: Admin

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| unwatched_days | number | No | Minimum days since added for unwatched content. Default: `365` |
| watched_days | number | No | Minimum days since watched for watched content. Default: `180` |
| limit_per_category | number | No | Maximum items per cleanup category. Default: `10` |

**Example**: "Analyze my library for cleanup opportunities" or "What can I delete to free up space?"

**See also**: [`plex_unwatched`](#plex_unwatched) -- dig deeper into unwatched content. [`plex_watched_old`](#plex_watched_old) -- dig deeper into old watched content. [`plex_duplicates`](#plex_duplicates) -- find duplicates.

---

### `downloads_status`

Get a unified download status across all configured services. Shows queue information from Sonarr, Radarr, and SABnzbd in a single view. Always available regardless of configuration.

**Provider**: cross-service (always registered) | **Tier**: Admin

No parameters.

**Example**: "What's the overall download status?" or "Show me everything that's downloading"

---

## Library Intelligence Tools

These 4 advanced tools provide deep analysis of your media library by cross-referencing data from multiple services. They are designed for power users who want to keep their library consistent, clean, and well-organized.

### `library_audit`

Analyze library consistency across Plex, Sonarr, and Radarr. Identifies orphaned files (in Plex but not tracked by Sonarr/Radarr), missing content (tracked but not downloaded), stalled downloads, quality mismatches, incomplete collections, and ended series still being monitored.

**Provider**: cross-service | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| check | enum: `all`, `orphans`, `missing`, `downloads`, `quality`, `collections`, `ended` | No | Which audit check to run. Default: `all` |

**Example**: "Audit my library for inconsistencies" or "Check for orphaned files in Plex" or "Find ended series that are still monitored"

**See also**: [`library_sync`](#library_sync) -- fix orphans by syncing them to Sonarr/Radarr.

---

### `library_sync`

Sync Plex orphans to Sonarr or Radarr so they are properly tracked, or sync missing movies from a collection. Runs in dry-run mode by default so you can preview changes before committing.

**Provider**: cross-service | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | enum: `orphans`, `collection` | Yes | What to sync: orphaned items or a collection |
| confirm | boolean | No | Set to `true` to execute the sync. Default: `false` (dry-run) |
| collection_id | number | No | TMDB collection ID (required when type is `collection`) |

**Example**: "Show me what orphans would be synced to Sonarr" or "Sync my Plex orphans to Radarr -- go ahead and do it"

**See also**: [`library_audit`](#library_audit) -- identify orphans first.

---

### `space_planner`

Get smart cleanup recommendations based on file size, watch history, ratings, and age. Tell it how much space you need to free and it will prioritize what to remove with the least impact on your library.

**Provider**: plex | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| target_gb | number | Yes | How many gigabytes of space you want to free up (must be positive) |
| type | enum: `all`, `movies`, `shows` | No | Limit recommendations to a media type. Default: `all` |
| exclude_favorites | boolean | No | Exclude highly-rated items from recommendations. Default: `false` |

**Example**: "I need to free up 200 GB, what should I delete?" or "Help me free 100 GB from movies only, but keep my favorites"

---

### `watch_analytics`

Get viewing statistics and insights about your media consumption. Shows what you have been watching, how much, and trends over time.

**Provider**: plex | **Tier**: Extended

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | enum: `month`, `year`, `all` | No | Time period to analyze. Default: `all` |
| type | enum: `all`, `movies`, `shows` | No | Filter by media type. Default: `all` |

**Example**: "Show me my watch statistics" or "How many movies did I watch this year?"

---

## Common Workflows

These are multi-step workflows that chain several tools together. Claude handles the chaining automatically -- you just describe what you want.

### Add a TV series

> "Add The Bear to Sonarr"

1. `tv_search` finds the series and its TVDB ID
2. `tv_add` adds it with your default quality profile

### Complete a movie franchise

> "I want all the Harry Potter movies"

1. `tmdb_collection` finds the collection by name
2. `collection_status` checks what you already own
3. `collection_missing` lists the gaps
4. `collection_add_missing` adds them to Radarr

### Find similar movies to grow your library

> "Find movies like Inception that I don't have yet"

1. `library_search` or `tmdb_search` finds the TMDB ID for Inception
2. `tmdb_similar` or `tmdb_recommendations` returns matches filtered to missing-only
3. `movie_add` adds any titles you choose

### Free up disk space

> "I need to free up 100 GB"

1. `space_planner` analyzes your library and recommends what to remove
2. `plex_delete` removes the items you approve (with confirmation)

### Triage download problems

> "Why isn't my download finishing?"

1. `downloads_status` shows overall queue health
2. `sonarr_stuck` or `radarr_stuck` identifies stuck items
3. `sonarr_blacklist` or `radarr_blacklist` removes bad releases and searches again

### Handle media requests

> "Approve all pending requests"

1. `request_list` with status `pending` shows what needs attention
2. `request_approve` or `request_decline` acts on each request

### Audit and clean your library

> "Is my library consistent?"

1. `library_audit` identifies orphans, missing items, and mismatches
2. `library_sync` fixes orphans by adding them to Sonarr/Radarr
3. `cleanup_analysis` finds cleanup opportunities across services
