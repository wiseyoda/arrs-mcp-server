# Tasks: Sabnzbd Downloads Integration

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Build Sabnzbd API client with query-parameter authentication | FR-015, FR-016 | T001-T003 | COVERED |
| 2 | Implement download semantic tools (queue, history, pause, resume, speed) | FR-001-FR-005 | T004-T008 | COVERED |
| 3 | Implement admin tools (delete, failed, retry, priority, categories) | FR-006-FR-012 | T009-T015 | COVERED |
| 4 | Enhance downloads_status with full Sabnzbd integration | FR-013, FR-017 | T016 | COVERED |
| 5 | Enable cross-service download tracking (what's in Sabnzbd for which *arr) | FR-017 | T002, T016 | COVERED |
| 6 | Complete the unified download management experience | FR-014 | T017 | COVERED |

Coverage: 6/6 goals (100%)

---

## Progress Dashboard

> Last updated: 2026-01-25 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | PENDING | 0/1 |
| Foundational | PENDING | 0/2 |
| US1-2: Queue & History | PENDING | 0/2 |
| US3-4: Pause/Resume/Speed | PENDING | 0/3 |
| US5: Unified Status | PENDING | 0/1 |
| US6-9: Admin Tools | PENDING | 0/5 |
| US10-11: Individual & Categories | PENDING | 0/2 |
| Integration | PENDING | 0/2 |
| Polish | PENDING | 0/1 |

**Overall**: 0/19 (0%) | **Current**: None

---

## Phase 1: Setup

**Purpose**: Project structure and service module skeleton

- [x] T001 Create src/services/sabnzbd/ directory with index.ts exporting module

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY tool can be implemented

- [x] T002 [P] Create src/services/sabnzbd/types.ts with Sabnzbd API interfaces (QueueResponse, HistoryResponse, QueueSlot, HistorySlot, ServerStatus)
- [x] T003 Create src/services/sabnzbd/client.ts with SabnzbdClient class and query parameter auth pattern

**Checkpoint**: Foundation ready - tool implementation can now begin

---

## Phase 3: User Story 1-2 - Queue & History (Priority: P1)

**Goal**: Core visibility into downloads - queue and history

**Independent Test**: Call downloads_queue and downloads_history, verify responses include nzo_id and formatted data

- [x] T004 [P] [US1] Implement downloads_queue tool in src/services/sabnzbd/tools.ts
- [x] T005 [P] [US2] Implement downloads_history tool in src/services/sabnzbd/tools.ts

**Checkpoint**: Users can view current and past downloads

---

## Phase 4: User Story 3-4 - Pause/Resume/Speed (Priority: P2)

**Goal**: Basic download control operations

**Independent Test**: Pause, verify paused state, resume, verify resumed, set speed limit

- [x] T006 [P] [US3] Implement downloads_pause tool in src/services/sabnzbd/tools.ts
- [x] T007 [P] [US3] Implement downloads_resume tool in src/services/sabnzbd/tools.ts
- [x] T008 [P] [US4] Implement downloads_speed tool in src/services/sabnzbd/tools.ts

**Checkpoint**: Users can control download operations

---

## Phase 5: User Story 5 - Unified Status (Priority: P2)

**Goal**: Integrate Sabnzbd into downloads_status with *arr source labels

**Independent Test**: Call downloads_status with Sabnzbd configured, verify queue items show with correct source

- [x] T016 [US5] Enhance src/tools/downloads-status.ts with Sabnzbd queue integration and category-to-source mapping

**Checkpoint**: Unified download view works

---

## Phase 6: User Story 6-9 - Admin Tools (Priority: P3)

**Goal**: Queue management and failed download handling

**Independent Test**: Delete item, list failed, retry failed, change priority

- [x] T009 [P] [US6] Implement sabnzbd_delete tool in src/services/sabnzbd/tools.ts
- [x] T010 [P] [US7] Implement sabnzbd_failed tool in src/services/sabnzbd/tools.ts
- [x] T011 [P] [US8] Implement sabnzbd_retry tool in src/services/sabnzbd/tools.ts
- [x] T012 [P] [US9] Implement sabnzbd_priority tool in src/services/sabnzbd/tools.ts
- [x] T013 [P] [US9] Add client methods for delete, retry, and priority operations

**Checkpoint**: Full admin control over queue

---

## Phase 7: User Story 10-11 - Individual Control & Categories (Priority: P4)

**Goal**: Fine-grained item control and category listing

**Independent Test**: Pause/resume individual item, list categories

- [x] T014 [P] [US10] Implement sabnzbd_pause_item and sabnzbd_resume_item tools in src/services/sabnzbd/tools.ts
- [x] T015 [P] [US11] Implement sabnzbd_categories tool in src/services/sabnzbd/tools.ts

**Checkpoint**: All tools complete

---

## Phase 8: Integration

**Purpose**: Wire up service module and enhance existing tools

- [x] T017 Enhance src/tools/system-health.ts with Sabnzbd health check
- [x] T018 Register Sabnzbd tools in src/index.ts when config.sabnzbd is present

**Checkpoint**: Full integration complete

---

## Phase 9: Polish

**Purpose**: Final verification and cleanup

- [x] T019 Run full typecheck (pnpm typecheck) and fix any issues

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all tools
- **US1-2 (Phase 3)**: Depends on Foundational
- **US3-4 (Phase 4)**: Depends on Foundational
- **US5 (Phase 5)**: Depends on Phase 3 (needs queue types/client)
- **US6-9 (Phase 6)**: Depends on Foundational
- **US10-11 (Phase 7)**: Depends on Foundational
- **Integration (Phase 8)**: Depends on Phases 3-7
- **Polish (Phase 9)**: Depends on Integration

### Parallel Opportunities

- T002 and T003 have no dependency on each other but T003 needs T002 types
- T004, T005 can run in parallel (different tools)
- T006, T007, T008 can run in parallel
- T009, T010, T011, T012 can run in parallel
- T014, T015 can run in parallel

---

## Notes

- [P] tasks = can run in parallel (different files or no shared dependencies)
- [US#] label maps task to specific user story
- All tools MUST include nzo_id in responses for operation chaining
- Follow exact patterns from Sonarr/Radarr tool implementations
