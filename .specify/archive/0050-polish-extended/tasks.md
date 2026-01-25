# Tasks: Polish & Extended Features

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Implement all Extended tier tools from api-standards.md | FR-001 to FR-011 | T001-T022 | COVERED |
| 2 | Add unified cleanup workflows across services | FR-012 to FR-015 | T023-T028 | COVERED |
| 3 | Polish error messages and edge case handling | FR-023 to FR-026 | T040-T043 | COVERED |
| 4 | Add comprehensive media_help with tool catalog | FR-016 to FR-018 | T029-T031 | COVERED |
| 5 | Performance optimization for large libraries | FR-019 to FR-022 | T032-T039 | COVERED |
| 6 | Documentation updates and final testing | SC-007, SC-008 | T044-T047 | COVERED |

Coverage: 6/6 goals (100%)

---

## Progress Dashboard

> Last updated: 2026-01-25 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | PENDING | 0/0 |
| US1: Extended Sonarr/Radarr | PENDING | 0/12 |
| US2: Extended Plex | PENDING | 0/6 |
| US3: Extended Sabnzbd | PENDING | 0/4 |
| US4: Cleanup Workflow | PENDING | 0/3 |
| US5: Enhanced Health | PENDING | 0/3 |
| US6: Enhanced Help | PENDING | 0/3 |
| US7: Pagination | PENDING | 0/8 |
| US8: Error Polish | PENDING | 0/4 |
| Polish | PENDING | 0/4 |

**Overall**: 0/47 (0%) | **Current**: None

---

**Input**: Design documents from `/specs/0050-polish-extended/`
**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup required - extending existing project

(No setup tasks - existing infrastructure is sufficient)

---

## Phase 2: User Story 1 - Extended Sonarr/Radarr Tools (Priority: P1)

**Goal**: Implement rename, refresh, upcoming/discover tools for Sonarr and Radarr

**Independent Test**: Call each new tool with valid parameters and verify API response

### Sonarr Extended Tools

- [x] T001 [P] [US1] Add `renameSeries(seriesId)` method to `src/services/sonarr/client.ts`
- [x] T002 [P] [US1] Add `refreshSeries(seriesId)` method to `src/services/sonarr/client.ts`
- [x] T003 [P] [US1] Add `getUpcoming(days)` method with detailed episode info to `src/services/sonarr/client.ts`
- [x] T004 [US1] Add `sonarr_rename` tool to `src/services/sonarr/tools.ts`
- [x] T005 [US1] Add `sonarr_refresh` tool to `src/services/sonarr/tools.ts`
- [x] T006 [US1] Add `sonarr_upcoming` tool to `src/services/sonarr/tools.ts`

### Radarr Extended Tools

- [x] T007 [P] [US1] Add `renameMovie(movieId)` method to `src/services/radarr/client.ts`
- [x] T008 [P] [US1] Add `refreshMovie(movieId)` method to `src/services/radarr/client.ts`
- [x] T009 [P] [US1] Add `getDiscovery()` method to `src/services/radarr/client.ts`
- [x] T010 [US1] Add `radarr_rename` tool to `src/services/radarr/tools.ts`
- [x] T011 [US1] Add `radarr_refresh` tool to `src/services/radarr/tools.ts`
- [x] T012 [US1] Add `radarr_discover` tool to `src/services/radarr/tools.ts`

**Checkpoint**: Sonarr and Radarr Extended tools complete

---

## Phase 3: User Story 2 - Extended Plex Tools (Priority: P2)

**Goal**: Implement collections, duplicates, optimize tools for Plex

**Independent Test**: Call each new tool and verify Plex API response

- [x] T013 [P] [US2] Add `getCollections(libraryKey?)` method to `src/services/plex/client.ts`
- [x] T014 [P] [US2] Add `getDuplicates(libraryKey?)` method to `src/services/plex/client.ts`
- [x] T015 [P] [US2] Add `optimizeDatabase()` method to `src/services/plex/client.ts`
- [x] T016 [US2] Add `plex_collections` tool to `src/services/plex/tools.ts`
- [x] T017 [US2] Add `plex_duplicates` tool to `src/services/plex/tools.ts`
- [x] T018 [US2] Add `plex_optimize` tool to `src/services/plex/tools.ts`

**Checkpoint**: Plex Extended tools complete

---

## Phase 4: User Story 3 - Extended Sabnzbd Tools (Priority: P3)

**Goal**: Implement quota and warnings tools for Sabnzbd

**Independent Test**: Call each new tool and verify Sabnzbd API response

- [x] T019 [P] [US3] Add `getQuota()` method to `src/services/sabnzbd/client.ts`
- [x] T020 [P] [US3] Add `getWarnings()` method to `src/services/sabnzbd/client.ts`
- [x] T021 [US3] Add `sabnzbd_quota` tool to `src/services/sabnzbd/tools.ts`
- [x] T022 [US3] Add `sabnzbd_warnings` tool to `src/services/sabnzbd/tools.ts`

**Checkpoint**: Sabnzbd Extended tools complete

---

## Phase 5: User Story 4 - Unified Cleanup Workflow (Priority: P4)

**Goal**: Implement cross-service cleanup analysis tool

**Independent Test**: Call `cleanup_analysis()` and verify aggregated response

- [x] T023 [US4] Create `src/tools/cleanup-analysis.ts` with helper functions for each service
- [x] T024 [US4] Implement `cleanup_analysis` tool aggregating Plex, Sonarr, Radarr, Sabnzbd data
- [x] T025 [US4] Register `cleanup_analysis` tool in `src/index.ts`

**Checkpoint**: Cleanup workflow complete

---

## Phase 6: User Story 5 - Enhanced System Health (Priority: P5)

**Goal**: Add verbose mode to system_health

**Independent Test**: Call `system_health({ verbose: true })` and verify detailed output

- [x] T026 [US5] Add `verbose` parameter to `system_health` tool in `src/tools/system-health.ts`
- [x] T027 [US5] Implement verbose output with version numbers, counts, queue status
- [x] T028 [US5] Update system_health response formatting for verbose mode

**Checkpoint**: Enhanced health check complete

---

## Phase 7: User Story 6 - Enhanced Help System (Priority: P6)

**Goal**: Expand media_help with comprehensive tool catalog

**Independent Test**: Call `media_help()` and verify expanded content

- [x] T029 [US6] Add connected services status to `media_help` in `src/tools/media-help.ts`
- [x] T030 [US6] Add comprehensive tool catalog by category to `media_help`
- [x] T031 [US6] Add workflow examples for common scenarios to `media_help`

**Checkpoint**: Enhanced help system complete

---

## Phase 8: User Story 7 - Large Library Pagination (Priority: P7)

**Goal**: Add offset-based pagination to all list tools

**Independent Test**: Call list tools with limit/offset and verify correct slicing

- [x] T032 [P] [US7] Add `offset` and `summary` parameters to `tv_list` in `src/services/sonarr/tools.ts`
- [x] T033 [P] [US7] Add `offset` and `summary` parameters to `movie_list` in `src/services/radarr/tools.ts`
- [x] T034 [P] [US7] Add `offset` and `summary` parameters to `library_list` in `src/services/plex/tools.ts`
- [x] T035 [P] [US7] Add `offset` and `summary` parameters to `library_search` in `src/services/plex/tools.ts`
- [x] T036 [US7] Update `tv_list` implementation with pagination logic and default limit 100
- [x] T037 [US7] Update `movie_list` implementation with pagination logic and default limit 100
- [x] T038 [US7] Update Plex list tools implementation with pagination logic
- [x] T039 [US7] Add warning when results exceed 500 items to all list tools

**Checkpoint**: Pagination complete

---

## Phase 9: User Story 8 - Error Message Polish (Priority: P8)

**Goal**: Enhance error messages with service context and suggestions

**Independent Test**: Trigger various error conditions and verify improved messages

- [x] T040 [US8] Add `service` and `endpoint` fields to `ApiError` in `src/shared/errors.ts`
- [x] T041 [US8] Update `ApiError.toUserMessage()` to include service name and suggestions
- [x] T042 [US8] Update `NetworkError.toUserMessage()` to include service context
- [x] T043 [US8] Update `ConfigError.toUserMessage()` to identify missing settings

**Checkpoint**: Error messages polished

---

## Phase 10: Polish & Documentation

**Purpose**: Documentation updates and final testing

- [x] T044 [P] Update README.md with all new Extended tools
- [x] T045 [P] Add Extended tools section to README with examples
- [x] T046 Run TypeScript compilation, ESLint, Prettier checks
- [x] T047 Manual testing with Claude Desktop and Claude Code

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1** (Extended Sonarr/Radarr): No dependencies - can start immediately
- **US2** (Extended Plex): No dependencies - can start in parallel with US1
- **US3** (Extended Sabnzbd): No dependencies - can start in parallel with US1/US2
- **US4** (Cleanup Workflow): Depends on US1, US2, US3 (needs all Extended tools)
- **US5** (Enhanced Health): No dependencies - can start anytime
- **US6** (Enhanced Help): Depends on all other tools being implemented
- **US7** (Pagination): No dependencies - can start anytime
- **US8** (Error Polish): No dependencies - can start anytime
- **Polish**: Depends on all user stories complete

### Within Each User Story

- Client methods before tools (tools depend on client methods)
- Tools can be implemented in parallel once all client methods exist

### Parallel Opportunities

- US1, US2, US3 can all run in parallel
- US5, US7, US8 can run in parallel with any other story
- Within US1: T001-T003 parallel, T004-T006 sequential; T007-T009 parallel, T010-T012 sequential

---

## Notes

- [P] tasks = different files, no dependencies
- All new tools MUST include entity IDs in list outputs
- All new tools MUST follow existing tool patterns (Zod schema, error handling)
- Commit after each user story phase is complete
- Run quality gates (TypeScript, ESLint, Prettier) before final testing
