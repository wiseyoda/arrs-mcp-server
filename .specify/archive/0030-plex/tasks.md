# Tasks: Plex Library Integration

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Build Plex API client with token-based authentication | FR-015, FR-016 | T001-T003 | COVERED |
| 2 | Implement Plex semantic tools (library_list, library_search, library_watched) | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006 | T004-T006 | COVERED |
| 3 | Implement Plex admin tools (delete, unwatched, watched_old, recent, refresh) | FR-007-FR-013 | T007-T011 | COVERED |
| 4 | Provide library-aware search queries | FR-004, FR-005 | T005 | COVERED |
| 5 | Enable watch status tracking and cleanup workflows | FR-003, FR-006, FR-009, FR-010, FR-013 | T006, T009, T010 | COVERED |
| 6 | Update cross-service tools to include Plex | FR-014 | T012-T013 | COVERED |

Coverage: 6/6 goals (100%)

---

## Progress Dashboard

> Last updated: 2025-01-25 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Foundation | PENDING | 0/3 |
| Semantic Tools | PENDING | 0/3 |
| Admin Tools | PENDING | 0/5 |
| Integration | PENDING | 0/2 |

**Overall**: 0/13 (0%) | **Current**: None

---

## Phase 1: Foundation

**Purpose**: Create Plex service module structure and API client

- [x] T001 [P] Create Plex types in src/services/plex/types.ts
- [x] T002 Create PlexClient class in src/services/plex/client.ts
- [x] T003 [P] Create module exports in src/services/plex/index.ts

**Checkpoint**: PlexClient can connect and authenticate with Plex server

---

## Phase 2: Semantic Tools (Priority: P1)

**Purpose**: Core tools for library querying - enables "Do I have...?" workflows

### US1 - Library Search

**Goal**: Users can search Plex libraries and see what content they have

- [x] T004 [US1] Implement library_list tool in src/services/plex/tools.ts
- [x] T005 [US1] Implement library_search tool with library filter in src/services/plex/tools.ts
- [x] T006 [US1] Implement library_watched tool in src/services/plex/tools.ts

**Checkpoint**: All 3 semantic tools work with Claude

---

## Phase 3: Admin Tools (Priority: P2)

**Purpose**: Management and cleanup tools

### US2 - Content Discovery

**Goal**: Users can discover recent content and trigger scans

- [x] T007 [US2] Implement plex_recent tool in src/services/plex/tools.ts
- [x] T008 [US2] Implement plex_refresh tool in src/services/plex/tools.ts

### US3 - Cleanup Workflow

**Goal**: Users can identify and remove cleanup candidates

- [x] T009 [US3] Implement plex_unwatched tool with size/savings calculation in src/services/plex/tools.ts
- [x] T010 [US3] Implement plex_watched_old tool with size/savings calculation in src/services/plex/tools.ts
- [x] T011 [US3] Implement plex_delete tool with confirmation requirement in src/services/plex/tools.ts

**Checkpoint**: All 5 admin tools work, delete requires confirmation

---

## Phase 4: Integration

**Purpose**: Connect Plex to main entry point and health checks

- [x] T012 Register Plex tools conditionally in src/index.ts
- [x] T013 Add Plex connectivity check to system_health in src/tools/system-health.ts

**Checkpoint**: Plex appears in configured services, system_health includes Plex status

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundation)**: No dependencies - start here
- **Phase 2 (Semantic)**: Depends on T002 (PlexClient)
- **Phase 3 (Admin)**: Depends on T002 (PlexClient)
- **Phase 4 (Integration)**: Depends on all tools being implemented

### Within Phases

- T002 must complete before any tool tasks (T004-T011)
- T001 and T003 can run in parallel with T002
- All tool tasks (T004-T011) can run in parallel after T002
- T012-T013 should run after all tools are implemented

### Parallel Opportunities

```
Phase 1: T001 || T003 (parallel), T002 (required first for tools)
Phase 2-3: T004 || T005 || T006 || T007 || T008 || T009 || T010 || T011 (all parallel after T002)
Phase 4: T012 then T013 (sequential)
```

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to user story
- All tool implementations follow same pattern - see plan.md
- Include ratingKey in output for follow-up operations
- Format timestamps as human-readable dates
- Show sizes in GB with 1 decimal place
