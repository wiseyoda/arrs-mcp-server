# Feature Specification: Polish & Extended Features

**Feature Branch**: `0050-polish-extended`
**Created**: 2026-01-25
**Status**: Draft
**Input**: Phase document and api-standards.md Extended tier requirements

---

## User Scenarios & Testing

### User Story 1 - Extended Sonarr/Radarr Tools (Priority: P1)

As a user, I want additional administrative tools for Sonarr and Radarr to manage file naming, metadata refresh, and content discovery.

**Why this priority**: These are core *arr service enhancements that complete the Extended tier toolset. Most requested by power users.

**Independent Test**: Can be tested by calling each new tool with valid parameters and verifying expected behavior.

**Acceptance Scenarios**:

1. **Given** a series exists in Sonarr, **When** `sonarr_rename({ series_id: 123 })` is called, **Then** episode files are renamed according to naming rules
2. **Given** a series exists, **When** `sonarr_refresh({ series_id: 123 })` is called, **Then** metadata is refreshed from TVDB
3. **Given** Sonarr is configured, **When** `sonarr_upcoming({ days: 14 })` is called, **Then** detailed upcoming episodes for next 14 days are returned
4. **Given** a movie exists in Radarr, **When** `radarr_rename({ movie_id: 456 })` is called, **Then** movie files are renamed according to naming rules
5. **Given** a movie exists, **When** `radarr_refresh({ movie_id: 456 })` is called, **Then** metadata is refreshed from TMDB
6. **Given** Radarr is configured, **When** `radarr_discover()` is called, **Then** recommended movies from Radarr's discovery are returned

---

### User Story 2 - Extended Plex Tools (Priority: P2)

As a user, I want tools to manage Plex collections, find duplicate files, and optimize the database.

**Why this priority**: Plex management tools for cleanup and organization. Builds on existing Plex integration.

**Independent Test**: Can be tested by calling each new tool and verifying Plex API responses.

**Acceptance Scenarios**:

1. **Given** Plex has collections, **When** `plex_collections({ library?: string })` is called, **Then** all collections with item counts are returned
2. **Given** Plex library has duplicate files, **When** `plex_duplicates({ library?: string })` is called, **Then** duplicate media items with file sizes are returned
3. **Given** Plex is configured, **When** `plex_optimize()` is called, **Then** database optimization is triggered and status is returned

---

### User Story 3 - Extended Sabnzbd Tools (Priority: P3)

As a user, I want tools to check quota status and system warnings from Sabnzbd.

**Why this priority**: Completes the Sabnzbd Extended tier. Lower priority as these are administrative.

**Independent Test**: Can be tested by calling tools and verifying Sabnzbd API responses.

**Acceptance Scenarios**:

1. **Given** Sabnzbd is configured, **When** `sabnzbd_quota()` is called, **Then** quota usage and limits are returned
2. **Given** Sabnzbd has warnings, **When** `sabnzbd_warnings()` is called, **Then** all system warnings are returned

---

### User Story 4 - Unified Cleanup Workflow (Priority: P4)

As a user, I want a single tool that analyzes cleanup opportunities across all services.

**Why this priority**: High-value cross-service feature but depends on existing tools working correctly.

**Independent Test**: Can be tested by calling `cleanup_analysis()` and verifying it aggregates data from Plex, Sonarr, and Radarr.

**Acceptance Scenarios**:

1. **Given** all services are connected, **When** `cleanup_analysis()` is called, **Then** a comprehensive report is returned with:
   - Unwatched movies (365+ days) with total size
   - Watched movies ready to delete (180+ days) with total size
   - Ended series with no recent episodes
   - Duplicate files across libraries
   - Failed downloads requiring attention
   - Total potential space savings

---

### User Story 5 - Enhanced System Health (Priority: P5)

As a user, I want verbose health checks with detailed service information.

**Why this priority**: Extends existing system_health with additional detail.

**Independent Test**: Can be tested by calling `system_health({ verbose: true })` and verifying detailed output.

**Acceptance Scenarios**:

1. **Given** all services are connected, **When** `system_health({ verbose: true })` is called, **Then** detailed info is returned including:
   - Version numbers for each service
   - Library counts (shows, movies, episodes)
   - Queue status with counts
   - Stuck import counts
   - Recent activity

---

### User Story 6 - Enhanced Help System (Priority: P6)

As a user, I want comprehensive help with tool catalog, workflow examples, and connected service status.

**Why this priority**: Documentation/discovery feature. Important but not core functionality.

**Independent Test**: Can be tested by calling `media_help()` and `media_help({ topic: X })` for each topic.

**Acceptance Scenarios**:

1. **Given** services are configured, **When** `media_help()` is called, **Then** response includes:
   - List of connected services with status
   - Quick start examples
   - Link to topic-specific help
2. **Given** user wants cleanup help, **When** `media_help({ topic: 'cleanup' })` is called, **Then** cleanup tools and workflows are explained

---

### User Story 7 - Large Library Pagination (Priority: P7)

As a user, I want to page through large libraries without hitting token limits.

**Why this priority**: Performance optimization for large installations.

**Independent Test**: Can be tested by calling list tools with limit/offset parameters.

**Acceptance Scenarios**:

1. **Given** 1000+ items in library, **When** `movie_list({ limit: 100, offset: 200 })` is called, **Then** items 201-300 are returned
2. **Given** large library, **When** `tv_list({ summary: true })` is called, **Then** counts are returned without full item list
3. **Given** results exceed 500, **When** any list tool is called, **Then** warning suggests using filters

---

### User Story 8 - Error Message Polish (Priority: P8)

As a user, I want clear, actionable error messages that help me fix problems.

**Why this priority**: Quality of life improvement. Important for user experience.

**Independent Test**: Can be tested by triggering various error conditions and verifying message quality.

**Acceptance Scenarios**:

1. **Given** invalid API key, **When** any tool is called, **Then** message says "Invalid [Service] API key. Check your configuration."
2. **Given** service is down, **When** any tool is called, **Then** message says "Cannot connect to [Service] at [URL]. Is the service running?"
3. **Given** resource not found, **When** tool is called with invalid ID, **Then** message says "No [item] found with ID [X]. Use [list_tool] to find valid IDs."
4. **Given** Radarr4K not configured, **When** 4K tool is called, **Then** message says "Radarr4K is not configured. Add radarr4k settings or use quality: 'hd'"

---

### Edge Cases

- What happens when a service is down during cleanup_analysis()? (Continue with available services, note unavailable ones)
- How does system handle duplicate detection when files span multiple libraries? (Report per-library, not cross-library)
- What if rename operation fails mid-way? (Report partial success with failures listed)
- How to handle pagination when items are added/removed between requests? (Offset is best-effort, not guaranteed)

---

## Requirements

### Functional Requirements

**Extended Tools - Sonarr:**
- **FR-001**: System MUST implement `sonarr_rename` to rename episode files using Sonarr's naming rules
- **FR-002**: System MUST implement `sonarr_refresh` to refresh series metadata from TVDB
- **FR-003**: System MUST implement `sonarr_upcoming` with detailed upcoming episode view (beyond calendar)

**Extended Tools - Radarr:**
- **FR-004**: System MUST implement `radarr_rename` to rename movie files using Radarr's naming rules
- **FR-005**: System MUST implement `radarr_refresh` to refresh movie metadata from TMDB
- **FR-006**: System MUST implement `radarr_discover` to show Radarr's movie recommendations/discovery

**Extended Tools - Plex:**
- **FR-007**: System MUST implement `plex_collections` to list/manage Plex collections
- **FR-008**: System MUST implement `plex_duplicates` to find duplicate media files
- **FR-009**: System MUST implement `plex_optimize` to trigger Plex database optimization

**Extended Tools - Sabnzbd:**
- **FR-010**: System MUST implement `sabnzbd_quota` to show quota status
- **FR-011**: System MUST implement `sabnzbd_warnings` to show system warnings

**Unified Workflows:**
- **FR-012**: System MUST implement `cleanup_analysis` to aggregate cleanup opportunities across services
- **FR-013**: `cleanup_analysis` MUST include unwatched movies, watched old movies, ended series, duplicates, failed downloads
- **FR-014**: `cleanup_analysis` MUST calculate total potential space savings

**Enhanced Existing Tools:**
- **FR-015**: `system_health` MUST support `verbose: true` parameter for detailed output
- **FR-016**: `media_help` MUST show connected services with status
- **FR-017**: `media_help` MUST include comprehensive tool catalog by category
- **FR-018**: `media_help` MUST include workflow examples

**Pagination:**
- **FR-019**: All list tools MUST support `offset` parameter for pagination
- **FR-020**: All list tools MUST support `limit` parameter with default of 100
- **FR-021**: List tools MUST support `summary: true` for count-only responses
- **FR-022**: List tools MUST warn when results exceed 500 items

**Error Messages:**
- **FR-023**: Error messages MUST include the affected service name
- **FR-024**: Error messages MUST suggest actionable next steps
- **FR-025**: "Not found" errors MUST suggest the list tool to find valid IDs
- **FR-026**: Configuration errors MUST identify the missing/invalid setting

### Non-Functional Requirements

- **NFR-001**: All new tools MUST follow existing tool patterns (Zod schemas, error handling, response format)
- **NFR-002**: All new client methods MUST use existing HTTP client infrastructure
- **NFR-003**: Cross-service tools MUST use parallel execution (Promise.all) for efficiency
- **NFR-004**: Large library operations MUST not timeout (use pagination internally)
- **NFR-005**: All list outputs MUST include entity IDs for downstream tool calls

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 11 Extended tier tools from api-standards.md are implemented and functional
- **SC-002**: `cleanup_analysis()` returns comprehensive report in single call
- **SC-003**: `system_health({ verbose: true })` returns detailed service information
- **SC-004**: All list tools support limit/offset pagination
- **SC-005**: Error messages follow the improved format (service name + suggestion)
- **SC-006**: Large libraries (1000+ items) can be queried without timeout
- **SC-007**: README documentation is updated with all new tools
- **SC-008**: Works correctly with Claude Desktop and Claude Code
