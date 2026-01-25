# Tasks: Phase 0020 - Radarr Integration

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Build Radarr API client following established service module pattern | FR-001, FR-002, NFR-003 | T001-T004 | COVERED |
| 2 | Implement all Radarr semantic tools (movie_search, movie_add, movie_list, movie_upgrade, movie_delete) | FR-010-FR-020 | T010-T018 | COVERED |
| 3 | Implement Radarr admin tools (queue, details, profiles, stuck, import, blacklist) | FR-030-FR-037 | T020-T027 | COVERED |
| 4 | Add Radarr4K routing with safety-first defaults (HD unless explicitly requested) | FR-003, FR-004, FR-005 | T005, T006 | COVERED |
| 5 | Update cross-service tools (downloads_status, system_health) to include Radarr | FR-040-FR-042 | T040-T043 | COVERED |
| 6 | Enhance movie_list with filtering/sorting/display options (like tv_list) | FR-015-FR-018 | T015-T018 | COVERED |

Coverage: 6/6 goals (100%)

---

## Progress Dashboard

> Last updated: 2026-01-25 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | PENDING | 0/6 |
| US1: Search & Add | PENDING | 0/5 |
| US2: Browse Library | PENDING | 0/4 |
| US3: Download Status | PENDING | 0/4 |
| US4: Troubleshooting | PENDING | 0/4 |
| US5: Remove Movies | PENDING | 0/2 |
| US6: Upgrade Quality | PENDING | 0/2 |
| Admin Tools | PENDING | 0/3 |
| Integration | PENDING | 0/4 |
| Polish | PENDING | 0/2 |

**Overall**: 0/36 (0%) | **Current**: None

---

**Input**: Design documents from `/specs/0020-radarr/`
**Prerequisites**: plan.md (complete), spec.md (complete)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Foundation)

**Purpose**: Create Radarr service module structure and types

- [x] T001 [P] Create src/services/radarr/types.ts with Movie, MovieLookup, QueueItem, QualityProfile, RootFolder, AddMovieRequest interfaces
- [x] T002 [P] Create src/services/radarr/client.ts with RadarrClient class skeleton and constructor
- [x] T003 Implement RadarrClient API methods: searchMovies, getAllMovies, getMovie, addMovie, deleteMovie in src/services/radarr/client.ts
- [x] T004 Implement RadarrClient API methods: getQueue, getQueueDetails, getQualityProfiles, getRootFolders, getHealth in src/services/radarr/client.ts
- [x] T005 [P] Add quality routing helper function getRadarrClient() in src/services/radarr/tools.ts
- [x] T006 [P] Create src/services/radarr/index.ts with barrel exports

**Checkpoint**: Radarr service module structure complete, ready for tool implementation

---

## Phase 2: User Story 1 - Search & Add Movies (Priority: P1)

**Goal**: Enable users to search for movies and add them to their library

**Independent Test**: Ask Claude "search for Inception" and "add that movie"

- [x] T010 [US1] Implement movie_search tool in src/services/radarr/tools.ts with query parameter and IMDB ID support
- [x] T011 [US1] Implement formatMovieLookup helper function for search results in src/services/radarr/tools.ts
- [x] T012 [US1] Implement movie_add tool in src/services/radarr/tools.ts with quality, profile, folder, search parameters
- [x] T013 [US1] Add duplicate detection in movie_add (check if movie exists before adding)
- [x] T014 [US1] Implement RadarrClient.movieExists() utility method in src/services/radarr/client.ts

**Checkpoint**: Users can search and add movies via Claude

---

## Phase 3: User Story 2 - Browse Movie Library (Priority: P1)

**Goal**: Enable users to list and browse their movie collection with filtering

**Independent Test**: Ask Claude "list my movies" and "show missing movies sorted by size"

- [x] T015 [US2] Implement movie_list tool in src/services/radarr/tools.ts with all filter/sort/display options
- [x] T016 [US2] Implement status filter (released, inCinemas, announced, all) in movie_list
- [x] T017 [US2] Implement sort options (title, size, added, year, rating) in movie_list
- [x] T018 [US2] Implement display options (show_size, show_rating, show_runtime, show_added) in movie_list

**Checkpoint**: Users can browse and filter their movie library

---

## Phase 4: User Story 3 - Download Status (Priority: P2)

**Goal**: Enable users to monitor download progress

**Independent Test**: Ask Claude "what's downloading in Radarr"

- [x] T020 [US3] Implement radarr_queue tool in src/services/radarr/tools.ts
- [x] T021 [US3] Implement formatQueueItem helper function in src/services/radarr/tools.ts
- [x] T022 [US3] Add error/warning highlighting in queue output
- [x] T023 [US3] Support quality parameter to show HD or 4K queue

**Checkpoint**: Users can monitor Radarr download progress

---

## Phase 5: User Story 4 - Troubleshooting (Priority: P2)

**Goal**: Enable users to diagnose and fix stuck downloads

**Independent Test**: Ask Claude "what's stuck in Radarr" and "blacklist that and retry"

- [x] T024 [US4] Implement radarr_stuck tool in src/services/radarr/tools.ts using getStuckItems()
- [x] T025 [US4] Implement RadarrClient.getStuckItems() method in src/services/radarr/client.ts
- [x] T026 [US4] Implement radarr_blacklist tool in src/services/radarr/tools.ts with re-search option
- [x] T027 [US4] Implement radarr_import tool in src/services/radarr/tools.ts for manual import trigger

**Checkpoint**: Users can troubleshoot stuck downloads

---

## Phase 6: User Story 5 - Remove Movies (Priority: P3)

**Goal**: Enable users to remove movies from their library

**Independent Test**: Ask Claude "delete The Matrix"

- [x] T028 [US5] Implement movie_delete tool in src/services/radarr/tools.ts with delete_files parameter
- [x] T029 [US5] Add quality parameter support to delete from correct instance

**Checkpoint**: Users can remove movies from library

---

## Phase 7: User Story 6 - Upgrade Quality (Priority: P3)

**Goal**: Enable users to search for better quality versions

**Independent Test**: Ask Claude "upgrade Inception to better quality"

- [x] T030 [US6] Implement movie_upgrade tool in src/services/radarr/tools.ts
- [x] T031 [US6] Implement RadarrClient.searchMovie(id) method using command endpoint in src/services/radarr/client.ts

**Checkpoint**: Users can trigger quality upgrades

---

## Phase 8: Admin Tools

**Purpose**: Implement remaining admin tools for profiles and details

- [x] T032 Implement radarr_details tool in src/services/radarr/tools.ts for detailed movie info
- [x] T033 Implement radarr_profiles tool in src/services/radarr/tools.ts to list quality profiles
- [x] T034 Implement radarr_folders tool in src/services/radarr/tools.ts to list root folders

**Checkpoint**: All admin tools implemented

---

## Phase 9: Cross-Service Integration

**Purpose**: Update system-wide tools to include Radarr

- [x] T040 Update src/config.ts to add radarr and radarr4k ServiceConfig with env var support
- [x] T041 Update src/tools/downloads-status.ts to include Radarr queue items
- [x] T042 Update src/tools/system-health.ts to check Radarr connectivity and stuck items
- [x] T043 Update src/index.ts to conditionally register Radarr tools when configured

**Checkpoint**: Radarr fully integrated with cross-service tools

---

## Phase 10: Polish & Verification

**Purpose**: Final cleanup and verification

- [x] T050 Run TypeScript strict compilation and fix any errors
- [x] T051 Manual testing with Claude Desktop/Code for all tools

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - start immediately
- **Phase 2-7 (User Stories)**: Depend on Phase 1 completion
  - US1 and US2 can run in parallel (different tools)
  - US3-US6 can run after US1/US2 structure established
- **Phase 8 (Admin)**: Can run parallel with Phase 2-7
- **Phase 9 (Integration)**: Depends on Phase 1 (needs RadarrClient)
- **Phase 10 (Polish)**: Depends on all previous phases

### Parallel Opportunities

- T001 and T002 can run in parallel (types.ts and client.ts skeleton)
- T005 and T006 can run in parallel (tools helpers and index.ts)
- All user story phases can run in parallel once Phase 1 complete
- T040-T043 (integration) can run as soon as RadarrClient exists

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to spec.md user stories
- All tools follow Sonarr patterns established in Phase 0010
- Quality parameter defaults to 'hd' per Constitution Principle II
- Manual testing replaces automated tests for this phase
