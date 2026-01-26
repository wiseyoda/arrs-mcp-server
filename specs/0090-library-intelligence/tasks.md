# Tasks: Library Intelligence

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Single flexible library_audit tool | FR-001 to FR-008 | T004-T012 | COVERED |
| 2 | Batch library_sync tool | FR-009 to FR-013 | T013-T016 | COVERED |
| 3 | Smart space_planner with scoring | FR-014 to FR-018 | T017-T020 | COVERED |
| 4 | Basic watch_analytics | FR-019 to FR-021 | T021-T023 | COVERED |
| 5 | Enhance existing Plex cleanup tools | FR-022 to FR-024 | T024-T027 | COVERED |

Coverage: 5/5 goals (100%)

---

## Progress Dashboard

> Last updated: 2026-01-25 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Foundational | PENDING | 0/3 |
| US1: Library Audit | PENDING | 0/9 |
| US2: Library Sync | PENDING | 0/4 |
| US3: Space Planner | PENDING | 0/4 |
| US4: Watch Analytics | PENDING | 0/3 |
| US5: Enhanced Plex Tools | PENDING | 0/4 |
| Polish | PENDING | 0/3 |

**Overall**: 0/30 (0%) | **Current**: None

---

**Input**: Design documents from `/specs/0090-library-intelligence/`
**Prerequisites**: plan.md (required), spec.md (required)

## Phase 1: Foundational (Shared Infrastructure)

**Purpose**: Core infrastructure required by all tools

- [x] T001 [P] Create matching utility types in `src/shared/matching.ts` (MovieIndex, SeriesIndex, MatchResult)
- [x] T002 [P] Implement `buildMovieIndex()` and `buildSeriesIndex()` in `src/shared/matching.ts`
- [x] T003 [P] Implement `matchMovie()` and `matchSeries()` with ID-first, title+year fallback in `src/shared/matching.ts`

**Checkpoint**: Matching infrastructure ready - tool implementation can begin

---

## Phase 2: User Story 1 - Library Consistency Check (Priority: P1)

**Goal**: Unified library audit tool with all check types

**Independent Test**: Run `library_audit()` and verify sync status is accurate

### Implementation

- [x] T004 [US1] Create AuditResult types in `src/tools/library-audit.ts` (AuditCategory, OrphanItem, MissingItem)
- [x] T005 [US1] Implement tool registration with Zod schema for `check` parameter in `src/tools/library-audit.ts`
- [x] T006 [P] [US1] Implement `auditOrphans()` - find Plex items not in *arr in `src/tools/library-audit.ts`
- [x] T007 [P] [US1] Implement `auditMissing()` - find *arr items not in Plex in `src/tools/library-audit.ts`
- [x] T008 [P] [US1] Implement `auditDownloads()` - find stuck Sabnzbd downloads in `src/tools/library-audit.ts`
- [x] T009 [P] [US1] Implement `auditQuality()` - find bidirectional 4K/HD routing issues in `src/tools/library-audit.ts`
- [x] T010 [P] [US1] Implement `auditCollections()` - auto-detect incomplete collections in `src/tools/library-audit.ts`
- [x] T011 [P] [US1] Implement `auditEnded()` - find ended series for review in `src/tools/library-audit.ts`
- [x] T012 [US1] Implement `auditAll()` aggregator and register tool in `src/tools/index.ts`

**Checkpoint**: library_audit tool complete and independently testable

---

## Phase 3: User Story 2 - Sync Orphan Content (Priority: P2)

**Goal**: Batch sync tool with dry-run preview and confirmation

**Independent Test**: Run `library_sync(type: "orphans")` to preview, then confirm to execute

### Implementation

- [x] T013 [US2] Create LibrarySyncResult types in `src/tools/library-sync.ts`
- [x] T014 [US2] Implement dry-run mode (confirm=false) with preview output in `src/tools/library-sync.ts`
- [x] T015 [US2] Implement execute mode (confirm=true) using movie_add/tv_add patterns in `src/tools/library-sync.ts`
- [x] T016 [US2] Register library_sync tool in `src/tools/index.ts`

**Checkpoint**: library_sync tool complete - preview and execute both work

---

## Phase 4: User Story 3 - Space Planning (Priority: P2)

**Goal**: Smart cleanup recommendations with size×age/rating scoring

**Independent Test**: Run `space_planner(target_gb: 100)` and verify sensible recommendations

### Implementation

- [x] T017 [US3] Create CleanupCandidate type and scoring formula in `src/tools/space-planner.ts`
- [x] T018 [US3] Implement data collection (fetch items with watch history and ratings) in `src/tools/space-planner.ts`
- [x] T019 [US3] Implement scoring and sorting with running total in `src/tools/space-planner.ts`
- [x] T020 [US3] Register space_planner tool in `src/tools/index.ts`

**Checkpoint**: space_planner tool complete - provides scored recommendations

---

## Phase 5: User Story 4 - Watch Analytics (Priority: P3)

**Goal**: Viewing statistics with period and type filters

**Independent Test**: Run `watch_analytics()` and verify statistics are accurate

### Implementation

- [x] T021 [US4] Create WatchStats type and aggregation logic in `src/tools/watch-analytics.ts`
- [x] T022 [US4] Implement period filtering (month/year/all) and genre breakdown in `src/tools/watch-analytics.ts`
- [x] T023 [US4] Register watch_analytics tool in `src/tools/index.ts`

**Checkpoint**: watch_analytics tool complete - shows accurate viewing stats

---

## Phase 6: User Story 5 - Enhanced Plex Tools (Priority: P3)

**Goal**: Add size/rating display and sorting to existing Plex cleanup tools

**Independent Test**: Run `plex_watched_old(show_size: true)` and verify size totals appear

### Implementation

- [x] T024 [US5] Add `show_size`, `sort`, `ended_only` parameters to plex_watched_old schema in `src/services/plex/tools.ts`
- [x] T025 [US5] Implement size display with running totals in plex_watched_old in `src/services/plex/tools.ts`
- [x] T026 [US5] Add `show_size`, `show_rating`, `sort` parameters to plex_unwatched schema in `src/services/plex/tools.ts`
- [x] T027 [US5] Implement size/rating display with running totals in plex_unwatched in `src/services/plex/tools.ts`

**Checkpoint**: Enhanced Plex tools complete - show size and rating info

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T028 Validate all tools work with large libraries (1000+ items)
- [x] T029 Verify error messages are clear when providers are missing
- [x] T030 Run full workflow test: audit → sync preview → verify accuracy

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies - creates shared matching utilities
- **User Story 1 (Phase 2)**: Depends on Foundational - library_audit uses matching
- **User Story 2 (Phase 3)**: Depends on US1 - library_sync acts on audit findings
- **User Story 3 (Phase 4)**: Depends on Foundational - space_planner uses matching for dedup
- **User Story 4 (Phase 5)**: Can run parallel with US3 - no dependencies beyond Foundational
- **User Story 5 (Phase 6)**: Can run parallel with US3/US4 - enhances existing tools
- **Polish (Phase 7)**: Depends on all user stories complete

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different functions in same file)
- T006-T011 can run in parallel (different audit check implementations)
- US3, US4, US5 can run in parallel after Foundational completes
- T024-T027 can run in parallel (different tool enhancements)

---

## Notes

- [P] tasks = different files or independent functions, can run in parallel
- [US#] label maps task to specific user story for traceability
- All tools follow cleanup-analysis.ts pattern for service aggregation
- Commit after each task or logical group
- Test each tool independently before moving to next phase
