# Feature Specification: Radarr Integration (Movies)

**Feature Branch**: `0020-radarr`
**Created**: 2026-01-25
**Status**: Complete
**Input**: Phase 0020 from ROADMAP - Add Radarr and Radarr4K support for movie management

---

## User Scenarios & Testing

### User Story 1 - Search and Add Movies (Priority: P1)

User wants to add a movie to their collection by searching for it by name.

**Why this priority**: Core functionality - without this, the module has no value. Enables the primary workflow of "Add Inception" natural language requests.

**Independent Test**: Can be fully tested by asking Claude "Add Inception" and verifying the movie appears in Radarr.

**Acceptance Scenarios**:

1. **Given** Radarr is configured, **When** user says "search for Inception", **Then** movie_search returns matching movies with title, year, and TMDB ID
2. **Given** search returns results, **When** user says "add the first one", **Then** movie_add adds the movie to Radarr with default HD quality
3. **Given** user says "add Inception in 4K", **When** Radarr4K is configured, **Then** movie_add routes to Radarr4K instance
4. **Given** movie already exists in library, **When** user tries to add it, **Then** system reports movie already exists (no duplicate)

---

### User Story 2 - Browse Movie Library (Priority: P1)

User wants to see their movie collection with ability to filter and sort.

**Why this priority**: Essential for library management - users need to see what they have.

**Independent Test**: Can be tested by running movie_list and verifying all movies appear with correct metadata.

**Acceptance Scenarios**:

1. **Given** user has movies in Radarr, **When** user says "list my movies", **Then** movie_list returns all movies sorted by title
2. **Given** user wants specific views, **When** user says "show missing movies", **Then** movie_list filters to only unwatched/missing files
3. **Given** user wants to find large files, **When** user says "list movies by size", **Then** movie_list sorts by disk size descending
4. **Given** large library, **When** user says "list 10 movies", **Then** movie_list respects limit parameter

---

### User Story 3 - Check Download Status (Priority: P2)

User wants to see what movies are downloading and their progress.

**Why this priority**: Important for monitoring but doesn't block core functionality.

**Independent Test**: Can be tested by triggering a download and running radarr_queue to see progress.

**Acceptance Scenarios**:

1. **Given** downloads are in progress, **When** user says "what's downloading in Radarr", **Then** radarr_queue shows all items with progress percentage and ETA
2. **Given** a download has errors, **When** user checks queue, **Then** error message is clearly displayed
3. **Given** both HD and 4K downloads active, **When** user checks downloads, **Then** both queues are shown (or filtered by quality)

---

### User Story 4 - Troubleshoot Problems (Priority: P2)

User wants to diagnose and fix stuck downloads or import issues.

**Why this priority**: Critical for operations but secondary to adding and browsing.

**Independent Test**: Can be tested by simulating a stuck import and using radarr_stuck to identify it.

**Acceptance Scenarios**:

1. **Given** items stuck in import state, **When** user says "what's stuck", **Then** radarr_stuck shows stuck items with reasons
2. **Given** bad release downloaded, **When** user says "blacklist this and try again", **Then** radarr_blacklist removes and re-searches
3. **Given** need to manually import, **When** user triggers import, **Then** radarr_import processes files in folder

---

### User Story 5 - Remove Movies (Priority: P3)

User wants to remove movies from their library.

**Why this priority**: Less common operation, but necessary for library management.

**Independent Test**: Can be tested by adding a movie, then removing it and verifying it's gone.

**Acceptance Scenarios**:

1. **Given** movie exists in library, **When** user says "delete The Matrix", **Then** movie_delete removes from Radarr
2. **Given** delete operation, **When** delete_files is true, **Then** physical files are also removed
3. **Given** movie in 4K library, **When** quality=4k specified, **Then** movie deleted from Radarr4K instance

---

### User Story 6 - Upgrade Quality (Priority: P3)

User wants to search for better quality versions of existing movies.

**Why this priority**: Enhancement feature, not essential for basic operations.

**Independent Test**: Can be tested by triggering upgrade search on a movie and verifying search starts.

**Acceptance Scenarios**:

1. **Given** movie exists with lower quality, **When** user says "upgrade Inception", **Then** movie_upgrade triggers search for better version
2. **Given** movie already at best quality, **When** upgrade requested, **Then** system reports cutoff already met

---

### Edge Cases

- What happens when Radarr is configured but Radarr4K is not, and user requests 4K? → Error message explaining 4K not configured
- What happens when movie search returns no results? → Clear message "No movies found matching query"
- What happens when Radarr is unreachable? → User-friendly connection error with troubleshooting hints
- What happens when quality profiles or root folders are missing? → Report configuration issue to user
- What happens when user searches with IMDB ID directly? → Support imdb:tt1375666 format

---

## Requirements

### Functional Requirements - Core Module

- **FR-001**: System MUST provide RadarrClient class that implements all Radarr v3 API operations
- **FR-002**: System MUST use shared HttpClient with X-Api-Key authentication header
- **FR-003**: System MUST support both `radarr` and `radarr4k` configuration with independent URL/apiKey
- **FR-004**: System MUST default quality parameter to 'hd' when not specified (Constitution Principle II)
- **FR-005**: System MUST only route to Radarr4K when quality='4k' is explicitly provided

### Functional Requirements - Semantic Tools

- **FR-010**: movie_search MUST search movies by name and return results with title, year, TMDB ID
- **FR-011**: movie_search MUST support searching by IMDB ID (imdb:ttXXXXXXX format)
- **FR-012**: movie_add MUST add movie to library with configurable quality profile and root folder
- **FR-013**: movie_add MUST trigger automatic search after adding if requested
- **FR-014**: movie_add MUST check for existing movie and report duplicate instead of adding
- **FR-015**: movie_list MUST support filtering by: status, genre, missing_only, unmonitored_only
- **FR-016**: movie_list MUST support sorting by: title, size, added, year, rating
- **FR-017**: movie_list MUST support display options: show_size, show_rating, show_runtime, show_added
- **FR-018**: movie_list MUST support limit parameter to cap results
- **FR-019**: movie_upgrade MUST trigger search for better quality version of existing movie
- **FR-020**: movie_delete MUST remove movie from library with optional delete_files parameter

### Functional Requirements - Admin Tools

- **FR-030**: radarr_queue MUST show all download queue items with progress, ETA, and status
- **FR-031**: radarr_queue MUST highlight items with errors or warnings
- **FR-032**: radarr_details MUST show complete information for a single movie by ID or name
- **FR-033**: radarr_profiles MUST list all available quality profiles with their IDs
- **FR-034**: radarr_folders MUST list all available root folders with free space
- **FR-035**: radarr_stuck MUST identify items in importPending, warning, or error state
- **FR-036**: radarr_import MUST trigger manual import scan for a movie path
- **FR-037**: radarr_blacklist MUST blacklist a queue item and optionally re-search

### Functional Requirements - Cross-Service Integration

- **FR-040**: downloads_status MUST include Radarr queue items alongside Sonarr
- **FR-041**: system_health MUST check Radarr connectivity and report issues
- **FR-042**: system_health MUST include Radarr stuck items in health report

### Non-Functional Requirements

- **NFR-001**: All tools MUST return user-friendly error messages (not raw API errors)
- **NFR-002**: All tools MUST complete within 30 second timeout
- **NFR-003**: Module MUST be self-contained in src/services/radarr/ directory
- **NFR-004**: Module MUST NOT affect Sonarr or other service modules
- **NFR-005**: All logging MUST go to stderr (stdout reserved for MCP protocol)

### Key Entities

- **Movie**: Media entity with id, title, year, tmdbId, imdbId, status, hasFile, monitored, path, qualityProfileId, sizeOnDisk
- **QueueItem**: Download queue entry with id, movieId, progress, status, eta, errorMessage
- **QualityProfile**: Named quality configuration with id, name, cutoff, upgradeAllowed
- **RootFolder**: Storage location with id, path, freeSpace

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 5 semantic tools (movie_search, movie_add, movie_list, movie_upgrade, movie_delete) work correctly
- **SC-002**: All 6 admin tools (radarr_queue, radarr_details, radarr_profiles, radarr_stuck, radarr_import, radarr_blacklist) work correctly
- **SC-003**: movie_add with no quality parameter routes to HD Radarr (safety default)
- **SC-004**: movie_add with quality='4k' routes to Radarr4K instance
- **SC-005**: movie_list supports all filtering and sorting options from tv_list
- **SC-006**: downloads_status aggregates both Sonarr and Radarr queues
- **SC-007**: system_health checks both Sonarr and Radarr connectivity
- **SC-008**: TypeScript compiles with no errors in strict mode
- **SC-009**: All error scenarios return user-friendly messages

---

## Non-Goals

- Plex integration (Phase 0030)
- Sabnzbd integration (Phase 0040)
- Overseerr integration (not in roadmap)
- Collection management (future enhancement)
- Custom list support (not in phase scope)
- Watch history tracking (Plex domain)
