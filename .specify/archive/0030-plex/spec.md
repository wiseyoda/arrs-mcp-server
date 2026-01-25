# Feature Specification: Plex Library Integration

**Feature Branch**: `0030-plex`
**Created**: 2025-01-25
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Library Search (Priority: P1)

As a user, I want to ask "Do I have [movie/show]?" and get an immediate answer with library context.

**Why this priority**: Core use case - users frequently want to check what's in their library before adding content via Sonarr/Radarr.

**Independent Test**: Can be fully tested by searching for known content (e.g., "Inception") and verifying it returns with library name and watch status.

**Acceptance Scenarios**:

1. **Given** Plex is configured, **When** I use `library_search` with query "Inception", **Then** I see the movie with its library (Movies), year, and watch status
2. **Given** multiple libraries exist, **When** I search for content, **Then** results are grouped by library with clear labels
3. **Given** search returns many results, **When** limit is specified, **Then** only that many results are returned

---

### User Story 2 - Watch Status Tracking (Priority: P1)

As a user, I want to see what I've watched and haven't watched to make decisions about my library.

**Why this priority**: Essential for cleanup workflows and tracking viewing habits.

**Independent Test**: Can be tested by calling `library_watched` on a library and verifying viewCount/lastViewedAt are displayed.

**Acceptance Scenarios**:

1. **Given** a library has mixed watched/unwatched content, **When** I query watch status, **Then** I see watch count and last viewed date for watched items
2. **Given** an item is unwatched, **When** displayed, **Then** it shows "Unwatched" status clearly

---

### User Story 3 - Cleanup Candidates (Priority: P2)

As a user, I want to identify content I could delete to free up space - either unwatched old content or content I watched long ago.

**Why this priority**: High value for storage management, but depends on watch status working first.

**Independent Test**: Can be tested by calling `plex_unwatched` with days parameter and verifying results include size and age information.

**Acceptance Scenarios**:

1. **Given** movies unwatched for 365+ days exist, **When** I call `plex_unwatched` with days=365, **Then** I see those movies with size and add date
2. **Given** cleanup candidates found, **When** results displayed, **Then** total potential savings (GB) is shown
3. **Given** watched content older than 180 days exists, **When** I call `plex_watched_old` with days=180, **Then** I see those items with last watched date

---

### User Story 4 - Content Deletion (Priority: P2)

As a user, I want to safely delete content from Plex when I'm done with it.

**Why this priority**: Enables cleanup workflow completion, but requires confirmation for safety.

**Independent Test**: Can be tested by attempting delete without confirmation (should fail) and with confirmation (should succeed).

**Acceptance Scenarios**:

1. **Given** I try to delete without `confirm: true`, **When** I call `plex_delete`, **Then** operation is rejected with helpful message
2. **Given** I delete with `confirm: true`, **When** I call `plex_delete`, **Then** item is deleted and size freed is reported
3. **Given** invalid rating_key, **When** I try to delete, **Then** clear error message is shown

---

### User Story 5 - Library Discovery (Priority: P3)

As a user, I want to see all my Plex libraries to understand what's available.

**Why this priority**: Foundational but simple - needed for other operations but not high user value alone.

**Independent Test**: Can be tested by calling `library_list` and verifying all libraries are shown with type.

**Acceptance Scenarios**:

1. **Given** Plex has multiple libraries, **When** I call `library_list`, **Then** all libraries are listed with key, name, and type
2. **Given** library types vary (movie, show, artist), **When** listed, **Then** type is clearly indicated

---

### User Story 6 - Recently Added (Priority: P3)

As a user, I want to see what was recently added to my library.

**Why this priority**: Nice-to-have for tracking new content, lower priority than core features.

**Independent Test**: Can be tested by calling `plex_recent` and verifying items are sorted by add date.

**Acceptance Scenarios**:

1. **Given** content was recently added, **When** I call `plex_recent`, **Then** I see newest items first with add date
2. **Given** library filter specified, **When** called, **Then** only that library's recent items shown

---

### User Story 7 - Library Refresh (Priority: P3)

As a user, I want to trigger a library scan when I know new content was added outside Plex.

**Why this priority**: Utility function, less frequently needed.

**Independent Test**: Can be tested by calling `plex_refresh` and verifying scan is triggered.

**Acceptance Scenarios**:

1. **Given** a library key, **When** I call `plex_refresh`, **Then** library scan is triggered
2. **Given** no library specified, **When** I call `plex_refresh`, **Then** all libraries are scanned

---

### User Story 8 - System Health (Priority: P3)

As a user, I want Plex connectivity included in system health checks.

**Why this priority**: Integration with existing health tool, lower effort.

**Independent Test**: Can be tested by calling `system_health` and verifying Plex status appears.

**Acceptance Scenarios**:

1. **Given** Plex is configured and reachable, **When** I call `system_health`, **Then** Plex shows as "ok"
2. **Given** Plex is unreachable, **When** I call `system_health`, **Then** Plex shows as "error" with details

---

### Edge Cases

- What happens when Plex is not configured? → Tools not registered, no errors
- What happens when Plex token is invalid? → 401 error with helpful message
- What happens when library has 1000+ items? → Pagination/limits applied
- What happens when rating_key doesn't exist? → 404 error with clear message
- What happens when delete is called on a show (not movie)? → Should work the same way
- How are 4K library items handled? → Same as regular, library name indicates "Movies (4K)"

## Requirements

### Functional Requirements

**Semantic Tools (3)**:
- **FR-001**: System MUST provide `library_list` tool to list all Plex libraries with key, name, and type
- **FR-002**: System MUST provide `library_search` tool to search across libraries with query parameter
- **FR-003**: System MUST provide `library_watched` tool to show watch status for library items
- **FR-004**: `library_search` MUST include library name in results for context
- **FR-005**: `library_search` MUST support optional `library` filter parameter
- **FR-006**: Watch status MUST show viewCount and lastViewedAt (formatted as human date)

**Admin Tools (5)**:
- **FR-007**: System MUST provide `plex_delete` tool requiring `rating_key` and `confirm: true`
- **FR-008**: `plex_delete` MUST reject deletion when `confirm` is not true
- **FR-009**: System MUST provide `plex_unwatched` tool with optional `days` and `library` parameters
- **FR-010**: System MUST provide `plex_watched_old` tool with optional `days` and `library` parameters
- **FR-011**: System MUST provide `plex_recent` tool with optional `library` and `limit` parameters
- **FR-012**: System MUST provide `plex_refresh` tool with optional `library` parameter
- **FR-013**: Cleanup tools MUST show item size and calculate total potential savings

**Integration**:
- **FR-014**: System MUST add Plex connectivity check to `system_health` tool
- **FR-015**: System MUST use `X-Plex-Token` header for authentication
- **FR-016**: System MUST send `Accept: application/json` for all Plex API requests

**Configuration**:
- **FR-017**: System MUST support `PLEX_URL` and `PLEX_TOKEN` environment variables
- **FR-018**: System MUST support `plex.url` and `plex.token` in config.json
- **FR-019**: Tools MUST only register when Plex configuration is complete

### Non-Functional Requirements

- **NFR-001**: All tool responses MUST be formatted as simple text readable by Claude
- **NFR-002**: Error messages MUST be user-friendly, not raw API errors
- **NFR-003**: Large result sets MUST be limited with clear indication of total
- **NFR-004**: All timestamps MUST be converted to human-readable format

### Key Entities

- **PlexLibrary**: A library section (Movies, TV Shows, etc.) with key, title, type
- **PlexMediaItem**: A movie, show, or episode with ratingKey, title, year, watch status
- **PlexMedia**: Media file info including resolution and size

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 8 Plex tools successfully registered when Plex is configured
- **SC-002**: `library_search` returns results within 2 seconds for typical queries
- **SC-003**: `plex_delete` without confirmation always fails (100% safety rate)
- **SC-004**: `system_health` includes Plex status when configured
- **SC-005**: All error responses include actionable guidance (not just error codes)
- **SC-006**: Cleanup tools calculate and display total savings correctly
