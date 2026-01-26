# Feature Specification: Library Intelligence

**Feature Branch**: `0090-library-intelligence`
**Created**: 2026-01-25
**Status**: Draft
**Input**: Phase 0090 - Library Intelligence (Stateless)

## User Scenarios & Testing

### User Story 1 - Library Consistency Check (Priority: P1)

As a media library owner, I want to check if my Plex library is in sync with Sonarr/Radarr so I can identify orphans, missing imports, and quality routing issues.

**Why this priority**: Core value proposition - unified audit replaces 5+ separate tools

**Independent Test**: Run `library_audit()` and verify it returns accurate sync status between Plex and *arr services

**Acceptance Scenarios**:

1. **Given** Plex and Radarr are configured, **When** I run `library_audit()`, **Then** I see a summary of movies in both, Plex-only orphans, and Radarr-only missing items
2. **Given** I want to check specific issues, **When** I run `library_audit(check: "orphans")`, **Then** I see detailed list of Plex items not tracked in Sonarr/Radarr with IMDB IDs for lookup
3. **Given** Radarr and Radarr4K are configured, **When** I run `library_audit(check: "quality")`, **Then** I see 4K content in regular Radarr AND HD content in 4K Radarr

---

### User Story 2 - Sync Orphan Content (Priority: P2)

As a user with orphan content in Plex, I want to batch-add those items to Sonarr/Radarr so they become properly tracked.

**Why this priority**: Actionable follow-up to audit findings - completes the workflow

**Independent Test**: Run `library_sync(type: "orphans")` to preview, then confirm to add items

**Acceptance Scenarios**:

1. **Given** library_audit found 12 orphan movies, **When** I run `library_sync(type: "orphans")`, **Then** I see a dry-run preview of what would be added
2. **Given** I reviewed the preview, **When** I run `library_sync(type: "orphans", confirm: true)`, **Then** items are added to appropriate *arr service with success/failure report

---

### User Story 3 - Space Planning (Priority: P2)

As a user running low on disk space, I want intelligent recommendations for what to delete based on file size, watch age, and content rating.

**Why this priority**: Unique value - no existing tool provides scored cleanup recommendations

**Independent Test**: Run `space_planner(target_gb: 100)` and verify recommendations are reasonable

**Acceptance Scenarios**:

1. **Given** my library has 500+ movies, **When** I run `space_planner(target_gb: 100)`, **Then** I see scored recommendations sorted by cleanup value (large, old, low-rated first)
2. **Given** I want movies only, **When** I run `space_planner(target_gb: 50, type: "movies")`, **Then** only movie recommendations are shown
3. **Given** the target is 100GB, **When** the running total reaches ~100GB, **Then** the list stops and shows "next item would exceed target"

---

### User Story 4 - Collection Completion (Priority: P3)

As a collector, I want to see which movie collections are incomplete so I can decide whether to complete them.

**Why this priority**: Valuable for completionists but not core workflow

**Independent Test**: Run `library_audit(check: "collections")` and verify it finds incomplete collections

**Acceptance Scenarios**:

1. **Given** I own 2/3 Back to the Future movies, **When** I run `library_audit(check: "collections")`, **Then** I see the collection is incomplete with the missing movie listed
2. **Given** collections are found, **When** results are displayed, **Then** each missing movie shows TMDB ID for easy lookup

---

### User Story 5 - Watch Analytics (Priority: P3)

As a user, I want to see viewing statistics to understand my watching habits.

**Why this priority**: Nice-to-have analytics, not core library management

**Independent Test**: Run `watch_analytics()` and verify statistics are accurate

**Acceptance Scenarios**:

1. **Given** I have watch history, **When** I run `watch_analytics()`, **Then** I see movies watched, episodes watched, and estimated watch time
2. **Given** I want yearly stats, **When** I run `watch_analytics(period: "year")`, **Then** I see stats for the past year only
3. **Given** stats are computed, **When** results are displayed, **Then** I see genre breakdown and most-watched content

---

### User Story 6 - Enhanced Plex Tools (Priority: P3)

As a user, I want existing Plex cleanup tools to show size totals and ratings so I can make better decisions.

**Why this priority**: Enhancement to existing tools, not new capability

**Independent Test**: Run `plex_watched_old(show_size: true)` and verify size totals appear

**Acceptance Scenarios**:

1. **Given** I run `plex_watched_old(show_size: true)`, **Then** each item shows file size and running total
2. **Given** I run `plex_unwatched(show_rating: true)`, **Then** each item shows its rating to help identify hidden gems
3. **Given** I run `plex_unwatched(sort: "size")`, **Then** items are sorted by file size (largest first)

---

### Edge Cases

- **No Plex configured**: Tools requiring Plex return clear error message listing required providers
- **No orphans found**: `library_audit(check: "orphans")` returns "No orphans found - library is in sync"
- **Empty library**: All audit checks return appropriate "nothing to analyze" messages
- **Radarr4K not configured**: Quality routing checks skip 4K checks, report only HD library
- **Large library (1000+ items)**: Performance acceptable (<30s), results paginated if needed
- **Matching ambiguity**: When title+year matches multiple items, list all matches with IDs

## Requirements

### Functional Requirements

#### Library Audit Tool
- **FR-001**: System MUST provide `library_audit` tool with `check` parameter accepting: "all", "orphans", "missing", "downloads", "quality", "collections", "ended"
- **FR-002**: When check="all", system MUST return summary counts for all check types
- **FR-003**: When check="orphans", system MUST identify Plex items not tracked in Sonarr/Radarr
- **FR-004**: When check="missing", system MUST identify *arr items not present in Plex
- **FR-005**: When check="downloads", system MUST identify completed downloads that never imported
- **FR-006**: When check="quality", system MUST identify 4K content in HD Radarr AND HD content in 4K Radarr
- **FR-007**: When check="collections", system MUST auto-detect collections from owned movies and report incomplete ones
- **FR-008**: When check="ended", system MUST identify ended/completed series for review

#### Library Sync Tool
- **FR-009**: System MUST provide `library_sync` tool with `type` and `confirm` parameters
- **FR-010**: When confirm=false (default), system MUST return dry-run preview
- **FR-011**: When confirm=true, system MUST execute sync and report success/failure per item
- **FR-012**: Type="orphans" MUST add Plex orphans to appropriate *arr service based on media type
- **FR-013**: Type="collection" MUST add missing collection movies (requires collection_id parameter)

#### Space Planner Tool
- **FR-014**: System MUST provide `space_planner` tool with `target_gb` (required), `type`, and `exclude_favorites` parameters
- **FR-015**: System MUST score items using formula: (size_gb × days_since_watched) / (rating × rewatch_factor)
- **FR-016**: System MUST use stored Plex/Radarr ratings (not live TMDB lookups)
- **FR-017**: System MUST sort by cleanup score (higher = better deletion candidate)
- **FR-018**: System MUST stop listing when running total approaches target_gb

#### Watch Analytics Tool
- **FR-019**: System MUST provide `watch_analytics` tool with `period` and `type` parameters
- **FR-020**: System MUST compute movies watched, episodes watched, and estimated watch time
- **FR-021**: System MUST show most-watched content and genre breakdown

#### Enhanced Plex Tools
- **FR-022**: `plex_watched_old` MUST support `show_size`, `sort`, and `ended_only` parameters
- **FR-023**: `plex_unwatched` MUST support `show_size`, `show_rating`, and `sort` parameters
- **FR-024**: Both tools MUST show running total of potential space savings when show_size=true

### Non-Functional Requirements

- **NFR-001**: All tools MUST complete within 30 seconds for libraries with 1000+ items
- **NFR-002**: All tools MUST use provider registry for service validation
- **NFR-003**: Tools MUST error clearly when required providers are missing
- **NFR-004**: Tools MUST follow existing error isolation pattern (one service failure doesn't crash analysis)
- **NFR-005**: All operations MUST be stateless (no database, no caching between calls)

### Key Entities

- **AuditResult**: Summary of sync status with counts and size totals per category
- **OrphanItem**: Plex item not tracked in *arr (ratingKey, title, year, size, IMDB ID)
- **MissingItem**: *arr item not in Plex (id, title, year, monitored status)
- **CleanupCandidate**: Item scored for deletion (id, title, size, score, reason)
- **WatchStats**: Viewing statistics (counts, durations, breakdowns)

## Success Criteria

### Measurable Outcomes

- **SC-001**: `library_audit()` returns accurate sync counts matching manual verification
- **SC-002**: `library_audit(check: "orphans")` finds all known orphan content
- **SC-003**: `library_sync` preview exactly matches final execution results
- **SC-004**: `space_planner` scoring produces sensible rankings (large+old+low-rated items first)
- **SC-005**: `watch_analytics` statistics match Plex dashboard data
- **SC-006**: All tools complete in <30s for 1000+ item libraries
- **SC-007**: Tools error clearly when required providers are not configured
