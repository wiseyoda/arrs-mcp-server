# Feature Specification: Sabnzbd Downloads Integration

**Feature Branch**: `0040-sabnzbd`
**Created**: 2026-01-25
**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 - View Download Queue (Priority: P1)

A user wants to see what's currently downloading and the progress of each item.

**Why this priority**: Core functionality - users need visibility into active downloads before any management operations.

**Independent Test**: Query the Sabnzbd queue and display all active downloads with progress, ETA, and status.

**Acceptance Scenarios**:

1. **Given** Sabnzbd has 3 items downloading, **When** user calls `downloads_queue`, **Then** see all 3 items with title, progress %, ETA, and status
2. **Given** Sabnzbd queue is empty, **When** user calls `downloads_queue`, **Then** see "No active downloads" message
3. **Given** Sabnzbd is unreachable, **When** user calls `downloads_queue`, **Then** see friendly error message

---

### User Story 2 - View Download History (Priority: P1)

A user wants to see what has been downloaded recently, including completed and failed items.

**Why this priority**: Essential for understanding download activity and diagnosing issues.

**Independent Test**: Query Sabnzbd history and display recent downloads with status and completion time.

**Acceptance Scenarios**:

1. **Given** Sabnzbd has history entries, **When** user calls `downloads_history`, **Then** see recent downloads with name, status, size, and completion time
2. **Given** Some history entries are failed, **When** viewing history, **Then** failed entries show error message

---

### User Story 3 - Pause/Resume Downloads (Priority: P2)

A user wants to pause all downloads to free up bandwidth, then resume when ready.

**Why this priority**: Common operation for bandwidth management, needed before finer-grained control.

**Independent Test**: Pause all downloads, verify paused state, resume and verify resumed state.

**Acceptance Scenarios**:

1. **Given** downloads are active, **When** user calls `downloads_pause`, **Then** all downloads pause and confirmation shown
2. **Given** downloads are paused, **When** user calls `downloads_resume`, **Then** downloads resume and speed shown
3. **Given** downloads are already paused, **When** user calls `downloads_pause`, **Then** graceful message about already paused

---

### User Story 4 - Set Speed Limit (Priority: P2)

A user wants to limit download speed during certain times or remove limits.

**Why this priority**: Important for bandwidth management, often used with pause/resume.

**Independent Test**: Set speed limit, verify it's applied, remove limit and verify unlimited.

**Acceptance Scenarios**:

1. **Given** no speed limit, **When** user calls `downloads_speed` with `speed: 10`, **Then** limit set to 10 MB/s with confirmation
2. **Given** speed limit active, **When** user calls `downloads_speed` with `unlimited: true`, **Then** limit removed with confirmation
3. **Given** invalid speed value, **When** user calls `downloads_speed` with `speed: -5`, **Then** validation error shown

---

### User Story 5 - Unified Download Status (Priority: P2)

A user wants to see all downloads across Sabnzbd AND *arr apps in one view with cross-references.

**Why this priority**: Key integration point - shows which *arr requested each download.

**Independent Test**: Call `downloads_status` and see Sabnzbd queue items with Sonarr/Radarr source labels.

**Acceptance Scenarios**:

1. **Given** Sabnzbd has TV downloads from Sonarr, **When** user calls `downloads_status`, **Then** items show "[Sonarr]" source label
2. **Given** Sabnzbd has movie downloads from Radarr, **When** user calls `downloads_status`, **Then** items show "[Radarr]" source label
3. **Given** download category unknown, **When** viewing status, **Then** source shows as "unknown"

---

### User Story 6 - Delete Queue Item (Priority: P3)

A user wants to remove a specific item from the download queue.

**Why this priority**: Admin operation for queue management, less frequent than viewing.

**Independent Test**: Delete a specific queue item by nzo_id, verify it's removed.

**Acceptance Scenarios**:

1. **Given** queue item exists, **When** user calls `sabnzbd_delete` with nzo_id, **Then** item removed and confirmation shown
2. **Given** invalid nzo_id, **When** user calls `sabnzbd_delete`, **Then** error message shown
3. **Given** user provides nzo_id, **When** delete succeeds, **Then** response includes deleted item title

---

### User Story 7 - Investigate Failed Downloads (Priority: P3)

A user wants to see failed downloads and understand why they failed.

**Why this priority**: Troubleshooting workflow, needed before retry.

**Independent Test**: List failed downloads with failure reasons.

**Acceptance Scenarios**:

1. **Given** history has failed items, **When** user calls `sabnzbd_failed`, **Then** see failed items with error messages
2. **Given** no failed items, **When** user calls `sabnzbd_failed`, **Then** see "No failed downloads" message

---

### User Story 8 - Retry Failed Download (Priority: P3)

A user wants to retry a failed download.

**Why this priority**: Natural follow-up to investigating failures.

**Independent Test**: Retry a failed download by nzo_id, verify it's added to queue.

**Acceptance Scenarios**:

1. **Given** failed download exists, **When** user calls `sabnzbd_retry` with nzo_id, **Then** item added to queue with confirmation
2. **Given** item already completed, **When** user calls `sabnzbd_retry`, **Then** error message explaining item not retriable

---

### User Story 9 - Change Queue Priority (Priority: P3)

A user wants to move a download to the top or bottom of the queue.

**Why this priority**: Queue management for prioritizing specific downloads.

**Independent Test**: Move item to top of queue, verify new position.

**Acceptance Scenarios**:

1. **Given** item in queue, **When** user calls `sabnzbd_priority` with position "top", **Then** item moved to top with confirmation
2. **Given** item in queue, **When** user calls `sabnzbd_priority` with position "bottom", **Then** item moved to bottom

---

### User Story 10 - Pause/Resume Individual Item (Priority: P4)

A user wants to pause or resume a specific queue item without affecting others.

**Why this priority**: Finer-grained control than global pause/resume, less common use case.

**Independent Test**: Pause specific item, verify only that item paused, resume it.

**Acceptance Scenarios**:

1. **Given** item downloading, **When** user calls `sabnzbd_pause_item` with nzo_id, **Then** only that item pauses
2. **Given** item paused, **When** user calls `sabnzbd_resume_item` with nzo_id, **Then** item resumes

---

### User Story 11 - List Categories (Priority: P4)

A user wants to see available download categories.

**Why this priority**: Reference information for understanding cross-service mapping.

**Independent Test**: List all configured categories.

**Acceptance Scenarios**:

1. **Given** categories configured, **When** user calls `sabnzbd_categories`, **Then** see list of category names

---

### Edge Cases

- What happens when Sabnzbd API is slow (>5s response)?
- How does system handle mixed queue states (some downloading, some paused)?
- What happens when category doesn't match any *arr service?

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide `downloads_queue` tool to list current Sabnzbd queue items
- **FR-002**: System MUST provide `downloads_history` tool to list recent download history
- **FR-003**: System MUST provide `downloads_pause` tool to pause all downloads
- **FR-004**: System MUST provide `downloads_resume` tool to resume all downloads
- **FR-005**: System MUST provide `downloads_speed` tool to set speed limit
- **FR-006**: System MUST provide `sabnzbd_delete` tool to remove queue items by nzo_id
- **FR-007**: System MUST provide `sabnzbd_failed` tool to list failed downloads
- **FR-008**: System MUST provide `sabnzbd_retry` tool to retry failed downloads by nzo_id
- **FR-009**: System MUST provide `sabnzbd_priority` tool to change queue item priority
- **FR-010**: System MUST provide `sabnzbd_pause_item` tool to pause individual items
- **FR-011**: System MUST provide `sabnzbd_resume_item` tool to resume individual items
- **FR-012**: System MUST provide `sabnzbd_categories` tool to list configured categories
- **FR-013**: System MUST enhance `downloads_status` to include Sabnzbd queue with *arr source labels
- **FR-014**: System MUST enhance `system_health` to include Sabnzbd connection status
- **FR-015**: System MUST use query parameter authentication for Sabnzbd API calls
- **FR-016**: System MUST include nzo_id in queue/history responses for tool chaining
- **FR-017**: System MUST map Sabnzbd categories to *arr sources (tv→Sonarr, movies→Radarr)

### Non-Functional Requirements

- **NFR-001**: All Sabnzbd tools MUST follow the same response format pattern as existing tools
- **NFR-002**: Speed values MUST be formatted for human readability (e.g., "25.5 MB/s")
- **NFR-003**: ETA values MUST be formatted for human readability (e.g., "2h 30m")
- **NFR-004**: Error messages MUST be user-friendly, not raw API errors

### Key Entities

- **QueueItem**: Download in progress - nzo_id, filename, progress, status, category, ETA
- **HistoryItem**: Completed download - nzo_id, name, status, size, completion time, fail_message
- **ServerStatus**: Overall Sabnzbd state - status, speed, queue count, time remaining

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 12 Sabnzbd tools registered and functional with Sabnzbd API
- **SC-002**: `downloads_status` shows Sabnzbd queue items with correct *arr source labels
- **SC-003**: `system_health` reports Sabnzbd connection status
- **SC-004**: All tool responses include nzo_id for chaining operations
- **SC-005**: Speed and ETA values display in human-readable format
- **SC-006**: Error cases return helpful messages without exposing API internals
