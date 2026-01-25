# Tasks: Foundation + Sonarr

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Create working MCP server for Claude Desktop/Code | FR-020, FR-021, FR-022, FR-023 | T001-T006 | COVERED |
| 2 | Implement config loading (JSON + env vars) | FR-010, FR-011, FR-012, FR-013 | T007-T009 | COVERED |
| 3 | Build Sonarr API client with error handling | FR-060, FR-061, FR-062 | T010-T012 | COVERED |
| 4 | Implement Sonarr semantic tools | FR-030, FR-031, FR-032, FR-033, FR-034 | T013-T017 | COVERED |
| 5 | Implement Sonarr admin tools | FR-040 to FR-048 | T018-T026 | COVERED |
| 6 | Implement cross-service tools | FR-050, FR-051, FR-052 | T031-T036 | COVERED |
| 7 | Create documentation | Spec user story 6 | T037, T046 | COVERED |

Coverage: 7/7 goals (100%)

---

## Progress Dashboard

> Last updated: 2025-01-24 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | PENDING | 0/6 |
| Foundational | PENDING | 0/6 |
| US1 - Search/Add | PENDING | 0/5 |
| US2 - Library Status | PENDING | 0/4 |
| US3 - Queue | PENDING | 0/4 |
| US4 - Troubleshooting | PENDING | 0/5 |
| US5 - Health | PENDING | 0/3 |
| US6 - Help/Docs | PENDING | 0/4 |
| Admin Tools | PENDING | 0/6 |
| Polish | PENDING | 0/4 |

**Overall**: 0/47 (0%) | **Current**: T001

---

## Phase 1: Setup (Project Foundation)

**Purpose**: Initialize TypeScript project with MCP SDK

- [x] T001 [P] Create package.json with dependencies in /package.json
- [x] T002 [P] Create tsconfig.json with strict mode in /tsconfig.json
- [x] T003 [P] Create .gitignore for node_modules, dist, config.json in /.gitignore
- [x] T004 [P] Create config.example.json template in /config.example.json
- [x] T005 Create src/index.ts MCP server entry point with stdio transport
- [x] T006 Install dependencies with pnpm install

---

## Phase 2: Foundational (Configuration + HTTP)

**Purpose**: Core infrastructure for config loading and HTTP requests

**CRITICAL**: No tool implementation until this phase is complete

- [x] T007 Create src/config.ts configuration loader with env + JSON support
- [x] T008 Add configuration validation with clear error messages in src/config.ts
- [x] T009 [P] Create src/shared/http.ts fetch wrapper with error handling
- [x] T010 [P] Create src/shared/errors.ts error utilities
- [x] T011 Create src/services/sonarr/types.ts Sonarr API types
- [x] T012 Create src/services/sonarr/client.ts Sonarr API client class

**Checkpoint**: Configuration loads, Sonarr client can make requests

---

## Phase 3: User Story 1 - Search and Add TV Shows (Priority: P1)

**Goal**: Users can search for and add TV shows through Claude

**Independent Test**: Search for "breaking bad", add it, verify in Sonarr web UI

### Implementation

- [x] T013 [US1] Implement tv_search tool in src/services/sonarr/tools.ts
- [x] T014 [US1] Implement tv_add tool in src/services/sonarr/tools.ts
- [x] T015 [US1] Add searchSeries method to client in src/services/sonarr/client.ts
- [x] T016 [US1] Add addSeries method to client in src/services/sonarr/client.ts
- [x] T017 [US1] Register tv_search and tv_add tools in src/index.ts

**Checkpoint**: Can search and add TV shows via Claude

---

## Phase 4: User Story 2 - View Library Status (Priority: P1)

**Goal**: Users can list shows and view episode status

**Independent Test**: List all shows, check episodes for a specific show

### Implementation

- [x] T018 [US2] Implement tv_list tool in src/services/sonarr/tools.ts
- [x] T019 [US2] Implement tv_episodes tool in src/services/sonarr/tools.ts
- [x] T020 [US2] Add getAllSeries method to client in src/services/sonarr/client.ts
- [x] T021 [US2] Add getEpisodes method to client in src/services/sonarr/client.ts

**Checkpoint**: Can list shows and view episode status via Claude

---

## Phase 5: User Story 3 - Monitor Download Queue (Priority: P2)

**Goal**: Users can view download queue with progress and issues

**Independent Test**: View queue while downloads are active

### Implementation

- [x] T022 [US3] Implement sonarr_queue tool in src/services/sonarr/tools.ts
- [x] T023 [US3] Add getQueue method to client in src/services/sonarr/client.ts
- [x] T024 [US3] Implement tv_search_missing tool in src/services/sonarr/tools.ts
- [x] T025 [US3] Add executeCommand method for search in src/services/sonarr/client.ts

**Checkpoint**: Can view queue and trigger missing episode searches

---

## Phase 6: User Story 4 - Troubleshoot Stuck Imports (Priority: P2)

**Goal**: Users can identify and fix stuck imports

**Independent Test**: View stuck items, blacklist a release, verify re-search

### Implementation

- [x] T026 [US4] Implement sonarr_stuck tool in src/services/sonarr/tools.ts
- [x] T027 [US4] Implement sonarr_import tool in src/services/sonarr/tools.ts
- [x] T028 [US4] Implement sonarr_blacklist tool in src/services/sonarr/tools.ts
- [x] T029 [US4] Add deleteQueueItem method to client in src/services/sonarr/client.ts
- [x] T030 [US4] Add getQueueDetails method for stuck detection in src/services/sonarr/client.ts

**Checkpoint**: Can troubleshoot and fix stuck imports

---

## Phase 7: User Story 5 - System Health Check (Priority: P2)

**Goal**: Users can verify services are working

**Independent Test**: Run health check with Sonarr running, then stopped

### Implementation

- [x] T031 [US5] Implement system_health tool in src/tools/system-health.ts
- [x] T032 [US5] Add getHealth method to client in src/services/sonarr/client.ts
- [x] T033 [US5] Register system_health tool in src/index.ts

**Checkpoint**: Health check reports Sonarr status correctly

---

## Phase 8: User Story 6 - Get Help & Documentation (Priority: P3)

**Goal**: Users can discover capabilities and set up the server

**Independent Test**: Call media_help, verify tool list returned

### Implementation

- [x] T034 [US6] Implement media_help tool in src/tools/media-help.ts
- [x] T035 [US6] Implement downloads_status tool in src/tools/downloads-status.ts
- [x] T036 [US6] Register help tools in src/index.ts
- [x] T037 [US6] Create README.md with setup instructions

**Checkpoint**: Help available, documentation complete

---

## Phase 9: Admin Tools Completion

**Purpose**: Implement remaining Sonarr admin tools

- [x] T038 [P] Implement sonarr_details tool in src/services/sonarr/tools.ts
- [x] T039 [P] Implement sonarr_delete tool in src/services/sonarr/tools.ts
- [x] T040 [P] Implement sonarr_profiles tool in src/services/sonarr/tools.ts
- [x] T041 [P] Implement sonarr_folders tool in src/services/sonarr/tools.ts
- [x] T042 [P] Implement sonarr_calendar tool in src/services/sonarr/tools.ts
- [x] T043 Add getSeries, deleteSeries, getProfiles, getRootFolders, getCalendar to client

---

## Phase 10: Polish & Verification

**Purpose**: Final cleanup and verification

- [x] T044 Verify all 17 tools work with Claude Desktop
- [x] T045 Verify all 17 tools work with Claude Code
- [x] T046 Update README with complete tool documentation
- [x] T047 Run through all verification gate items

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phases 3-8 (User Stories)**: All depend on Phase 2 completion
- **Phase 9 (Admin Tools)**: Depends on Phase 2
- **Phase 10 (Polish)**: Depends on all previous phases

### Within Each Phase

- [P] tasks can run in parallel
- Non-[P] tasks run sequentially
- Client methods must exist before tools that use them

### Parallel Opportunities

```bash
# Phase 1: All setup files in parallel
T001, T002, T003, T004

# Phase 2: HTTP and error utilities in parallel
T009, T010

# Phase 9: All admin tools in parallel
T038, T039, T040, T041, T042
```

---

## Notes

- Total: 47 tasks across 10 phases
- Critical path: T001-T012 (Setup + Foundation) → User stories
- Most value: Complete through Phase 4 (US1 + US2) for functional MVP
- Manual testing against production Sonarr instance
