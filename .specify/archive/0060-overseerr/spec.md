# Feature Specification: Overseerr Integration

**Feature Branch**: `0060-overseerr`
**Created**: 2026-01-25
**Status**: Draft

---

## User Scenarios & Testing

### User Story 1 - Request Approval Workflow (Priority: P1)

As a Plex admin, I want to view and approve pending media requests so my users get the content they want.

**Why this priority**: This is the core Overseerr workflow - without request management, there's no value in the integration.

**Independent Test**: Can be fully tested by listing pending requests, approving one, and verifying it shows in Radarr/Sonarr queue.

**Acceptance Scenarios**:

1. **Given** pending requests exist, **When** I ask "What requests are pending?", **Then** I see a list with request ID, title, requester, and age
2. **Given** a pending movie request, **When** I approve it, **Then** the movie is added to Radarr using Overseerr's configured default quality profile and root folder, and search begins
3. **Given** a pending TV request, **When** I approve it, **Then** the series is added to Sonarr using Overseerr's configured default quality profile and root folder, and search begins
4. **Given** a request I want to reject, **When** I deny with a reason, **Then** the request status changes to declined and the reason is stored in Overseerr for the requester to view

---

### User Story 2 - User Activity Monitoring (Priority: P2)

As a Plex admin, I want to see what my users have requested and their quota usage so I can manage fair access.

**Why this priority**: Understanding user activity helps manage the shared resource fairly.

**Independent Test**: Can be tested by listing users and viewing a specific user's request history.

**Acceptance Scenarios**:

1. **Given** multiple users exist, **When** I ask "Who are my Overseerr users?", **Then** I see a list of users with request counts
2. **Given** a specific user, **When** I ask for their request history, **Then** I see their requests with status
3. **Given** quotas are configured, **When** I check a user's quota, **Then** I see remaining requests and reset date

---

### User Story 3 - Issue Management (Priority: P3)

As a Plex admin, I want to see and respond to reported issues so I can fix problems with media.

**Why this priority**: Issues are important but less frequent than requests.

**Independent Test**: Can be tested by listing issues and resolving one.

**Acceptance Scenarios**:

1. **Given** issues have been reported, **When** I list issues, **Then** I see issue type, media title, and reporter
2. **Given** an open issue, **When** I add a comment, **Then** the comment is visible to the reporter
3. **Given** an issue I've fixed, **When** I mark it resolved, **Then** the issue status changes

---

### User Story 4 - Content Discovery (Priority: P3)

As a Plex admin, I want to browse trending and upcoming content so I can proactively add popular media.

**Why this priority**: Nice-to-have for proactive library management.

**Independent Test**: Can be tested by getting trending content and seeing TMDB IDs for adding.

**Acceptance Scenarios**:

1. **Given** I want to see popular content, **When** I ask for trending movies, **Then** I see titles with TMDB IDs
2. **Given** I want upcoming releases, **When** I ask for upcoming movies, **Then** I see release dates and titles

---

### Edge Cases

- What happens when a request is for content already in library? → Show "already available" status
- What happens when Overseerr can't connect to Radarr/Sonarr? → Return error from Overseerr
- What happens with invalid request ID? → Return "request not found" error
- What happens when user has no permissions for action? → Return "insufficient permissions" error

---

## Requirements

### Functional Requirements

#### Request Management
- **FR-001**: System MUST list requests with filtering by status (pending, approved, available, declined)
- **FR-002**: System MUST show request details including ID, title, type (movie/TV), requester, status, and date
- **FR-003**: System MUST approve pending requests, which triggers add to Sonarr/Radarr
- **FR-004**: System MUST decline requests with an optional reason message (max 500 chars)
- **FR-005**: System MUST delete requests with explicit confirmation parameter to prevent accidental deletion
- **FR-006**: System MUST handle both movie and TV series requests

#### User Management
- **FR-007**: System MUST list all Overseerr users with basic info and request counts
- **FR-008**: System MUST show a specific user's request history
- **FR-009**: System MUST show user quota information (if configured)

#### Issue Management
- **FR-010**: System MUST list reported issues with filtering by status
- **FR-011**: System MUST show issue details including type, media, reporter, and comments
- **FR-012**: System MUST allow adding comments to issues
- **FR-013**: System MUST allow resolving/closing issues

#### Discovery
- **FR-014**: System MUST show trending movies and TV shows
- **FR-015**: System MUST show upcoming movie releases
- **FR-016**: System MUST include TMDB IDs in discovery results for use with Radarr add

### Non-Functional Requirements

- **NFR-001**: All tools MUST follow established naming conventions (semantic for user-facing, service-prefixed for admin)
- **NFR-002**: All tools MUST use shared error handling with user-friendly messages
- **NFR-003**: All list outputs MUST include entity IDs for follow-up operations
- **NFR-004**: Pagination MUST be handled internally with sensible defaults

### Key Entities

- **Request**: Media request from a user (id, title, type, status, requester, created date)
- **User**: Overseerr user (id, username, email, request count, permissions)
- **Issue**: Reported problem with media (id, type, media, status, reporter, comments)
- **Discovery Item**: Trending/upcoming content (title, type, TMDB ID, release date)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admin can approve a request in a single command after seeing the list
- **SC-002**: All request statuses are clearly displayed with actionable next steps
- **SC-003**: Error messages are helpful (e.g., "Request 1234 not found" not "API error 404")
- **SC-004**: Discovery results include TMDB IDs ready for use with movie_add/tv_add

---

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Status |
|---|------------|---------------------|--------|
| 1 | Full request lifecycle management | FR-001 to FR-006 | PARTIAL |
| 2 | User management | FR-007 to FR-009 | PARTIAL |
| 3 | Issue tracking | FR-010 to FR-013 | PARTIAL |
| 4 | Discovery features | FR-014 to FR-016 | PARTIAL |
| 5 | Auto-approval rule configuration | - | DEFERRED |
| 6 | Settings visibility | - | DEFERRED |

**Note**: Goals 5 and 6 (auto-approval rules and settings) are deferred to keep this phase focused on core functionality. Auto-approval rules would require additional design for how to store and trigger rules, which adds significant complexity. Settings visibility is read-only administrative info that's less critical for the core workflow.

---

## Out of Scope

- Jellyseerr support (different API nuances)
- Direct Plex authentication through Overseerr
- Custom notification configurations
- Auto-approval rule management (deferred)
- Settings management (deferred)
