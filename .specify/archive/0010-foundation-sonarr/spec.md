# Feature Specification: Foundation + Sonarr

**Feature Branch**: `0010-foundation-sonarr`
**Created**: 2025-01-24
**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 - Search and Add TV Shows (Priority: P1)

A user wants to add a TV show to their Sonarr library through natural language. They say "Add Breaking Bad" and Claude searches for the show, confirms the match, and adds it with sensible defaults.

**Why this priority**: This is the primary use case - adding content is the most frequent operation.

**Independent Test**: Can be tested by searching for and adding a TV show, verifying it appears in Sonarr.

**Acceptance Scenarios**:

1. **Given** Sonarr is running, **When** user says "add breaking bad", **Then** Claude uses tv_search to find matches, confirms with user if ambiguous, and uses tv_add to add the show with all episodes monitored.
2. **Given** a show search returns multiple results, **When** Claude presents options, **Then** user can select the correct one and it gets added.
3. **Given** a show is already in the library, **When** user tries to add it, **Then** Claude reports it already exists.

---

### User Story 2 - View Library Status (Priority: P1)

A user wants to see what TV shows are in their library and their download status. They ask "what shows do I have?" or "what's missing?"

**Why this priority**: Users frequently check library status to understand what's available.

**Independent Test**: Can be tested by listing shows and viewing episode status.

**Acceptance Scenarios**:

1. **Given** Sonarr has shows, **When** user asks to list shows, **Then** Claude returns a readable list with show names and basic status.
2. **Given** a specific show, **When** user asks about its episodes, **Then** Claude shows which episodes are downloaded, missing, or in queue.

---

### User Story 3 - Monitor Download Queue (Priority: P2)

A user wants to see what's currently downloading and check for problems. They ask "what's downloading?" or "check download status."

**Why this priority**: Users need visibility into active downloads to monitor progress and catch issues.

**Independent Test**: Can be tested by viewing the queue and verifying download information is displayed.

**Acceptance Scenarios**:

1. **Given** items are downloading, **When** user checks queue, **Then** Claude shows items with progress, ETA, and status.
2. **Given** queue has errors, **When** user checks queue, **Then** errors are highlighted.

---

### User Story 4 - Troubleshoot Stuck Imports (Priority: P2)

A user notices downloads aren't appearing in their library. They ask "something is stuck" or "fix import issues." Claude identifies stuck items and helps resolve them.

**Why this priority**: Stuck imports are a common problem that blocks the download workflow.

**Independent Test**: Can be tested by viewing stuck items and triggering a blacklist/re-search.

**Acceptance Scenarios**:

1. **Given** items are stuck importing, **When** user asks about stuck items, **Then** Claude lists them with details.
2. **Given** a stuck item, **When** user wants to fix it, **Then** Claude can blacklist and trigger a new search.

---

### User Story 5 - System Health Check (Priority: P2)

A user wants to verify all services are working. They ask "is everything working?" or "system health."

**Why this priority**: Health checks help users identify configuration or connection problems quickly.

**Independent Test**: Can be tested by running health check with Sonarr running and stopped.

**Acceptance Scenarios**:

1. **Given** Sonarr is healthy, **When** health check runs, **Then** status shows OK.
2. **Given** Sonarr is unreachable, **When** health check runs, **Then** status shows error with helpful message.

---

### User Story 6 - Get Help (Priority: P3)

A new user wants to know what they can do. They ask "what can you do?" or "help with media."

**Why this priority**: Helps users discover capabilities but not essential for core functionality.

**Independent Test**: Can be tested by calling media_help and verifying output.

**Acceptance Scenarios**:

1. **Given** any state, **When** user asks for help, **Then** Claude provides an overview of available tools and connected services.

---

### Edge Cases

- What happens when Sonarr is not configured (no URL/API key)?
- What happens when Sonarr returns an error (invalid API key)?
- What happens when a search returns no results?
- What happens when the network is unavailable?
- What happens when a series has thousands of episodes (display limits)?

---

## Requirements

### Functional Requirements

**Project Setup**
- **FR-001**: System MUST be a TypeScript project using strict mode
- **FR-002**: System MUST use pnpm as the package manager
- **FR-003**: System MUST compile to ES modules for Node.js 20+

**Configuration**
- **FR-010**: System MUST load configuration from environment variables
- **FR-011**: System MUST load configuration from config.json as fallback
- **FR-012**: System MUST provide a config.example.json template
- **FR-013**: System MUST validate configuration at startup and report missing required values

**MCP Server**
- **FR-020**: System MUST implement MCP protocol using @modelcontextprotocol/sdk
- **FR-021**: System MUST use stdio transport for communication
- **FR-022**: System MUST NOT write to stdout except for MCP protocol messages
- **FR-023**: System MUST log debug information to stderr only

**TV Show Tools - Semantic**
- **FR-030**: `tv_search` MUST search Sonarr for TV series by name
- **FR-031**: `tv_add` MUST add a TV series to Sonarr with configurable monitoring options
- **FR-032**: `tv_list` MUST list all TV series with name and basic status
- **FR-033**: `tv_episodes` MUST show episode status (downloaded, missing, queued) for a series
- **FR-034**: `tv_search_missing` MUST trigger a search for missing episodes

**TV Show Tools - Admin**
- **FR-040**: `sonarr_queue` MUST show download queue with progress, ETA, and errors
- **FR-041**: `sonarr_details` MUST show detailed information for a single series
- **FR-042**: `sonarr_delete` MUST remove a series from Sonarr with optional file deletion
- **FR-043**: `sonarr_profiles` MUST list available quality profiles
- **FR-044**: `sonarr_folders` MUST list available root folders
- **FR-045**: `sonarr_stuck` MUST identify items stuck in importing state
- **FR-046**: `sonarr_import` MUST trigger manual import for a specific download
- **FR-047**: `sonarr_blacklist` MUST blacklist a release with optional re-search
- **FR-048**: `sonarr_calendar` MUST show upcoming episodes

**Cross-Service Tools**
- **FR-050**: `downloads_status` MUST show unified download status (Sonarr queue in Phase 1)
- **FR-051**: `system_health` MUST check Sonarr connectivity and report issues
- **FR-052**: `media_help` MUST provide an overview of available tools and services

**Error Handling**
- **FR-060**: System MUST return user-friendly error messages when operations fail
- **FR-061**: System MUST handle network timeouts gracefully
- **FR-062**: System MUST handle invalid API responses gracefully

### Key Entities

- **Series**: A TV show in Sonarr (id, title, tvdbId, status, path, monitored, episodeCount, episodeFileCount)
- **Episode**: An episode of a series (id, seriesId, seasonNumber, episodeNumber, title, hasFile, monitored)
- **QueueItem**: A download in progress (id, title, size, sizeleft, status, timeleft, trackedDownloadStatus)
- **QualityProfile**: A quality setting (id, name)
- **RootFolder**: A storage location (id, path, freeSpace)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: MCP server starts without errors with valid configuration
- **SC-002**: MCP server reports clear error when configuration is invalid/missing
- **SC-003**: All 5 semantic TV tools execute successfully against a running Sonarr instance
- **SC-004**: All 9 admin TV tools execute successfully against a running Sonarr instance
- **SC-005**: All 3 cross-service tools execute successfully
- **SC-006**: Server works correctly with Claude Desktop
- **SC-007**: Server works correctly with Claude Code
- **SC-008**: Error messages are actionable and help users fix problems

---

## Non-Functional Requirements

- **NFR-001**: System MUST be stateless - no caching or persistent state
- **NFR-002**: System MUST use native fetch for HTTP requests (no axios/got)
- **NFR-003**: System MUST use Zod v3 for schema validation (MCP SDK compatibility)
- **NFR-004**: Tool responses MUST use simple text format for readability
- **NFR-005**: System MUST have startup time under 2 seconds
