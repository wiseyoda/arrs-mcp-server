# Tasks: Provider Cleanup & Hardening

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Formalize conditional provider registration (presence-based) | FR-001, NFR-001 | T001-T005 | COVERED |
| 2 | Create provider discovery tool for Claude | FR-002, FR-003, SC-001 | T006-T008 | COVERED |
| 3 | Build cross-provider utility foundation for Phase 0090 | FR-005 | T009-T010 | COVERED |
| 4 | Audit and harden all existing providers | FR-006, FR-007, FR-008, FR-009, SC-003 | T011-T022 | COVERED |
| 5 | Improve error messages for missing/misconfigured providers | FR-004, FR-010, SC-002 | T023-T026 | COVERED |

Coverage: 5/5 goals (100%)

---

## Progress Dashboard

> Last updated: 2026-01-25 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | PENDING | 0/5 |
| Discovery Tool | PENDING | 0/3 |
| Cross-Provider Utils | PENDING | 0/2 |
| Sonarr Audit | PENDING | 0/3 |
| Radarr Audit | PENDING | 0/3 |
| Plex Audit | PENDING | 0/3 |
| Sabnzbd Audit | PENDING | 0/3 |
| Error Handling | PENDING | 0/4 |

**Overall**: 0/26 (0%) | **Current**: None

---

**Input**: Design documents from `specs/0080-provider-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Phase 1: Setup (Provider Registry Foundation)

**Purpose**: Create the provider registry abstraction

- [x] T001 [P] Create provider types in src/providers/types.ts (ProviderStatus, ProviderCapability interfaces)
- [x] T002 [P] Create ProviderNotConfiguredError in src/providers/errors.ts with configuration instructions formatter
- [x] T003 Create ProviderRegistry class in src/providers/registry.ts with isConfigured, getConfigured, getMissing, getStatus, requireProviders methods
- [x] T004 Create src/providers/index.ts with re-exports
- [x] T005 Update src/index.ts to build registry at startup and pass to tool registrations

---

## Phase 2: Discovery Tool (User Story 1)

**Goal**: Claude can discover which providers are configured and their capabilities

**Independent Test**: Call `providers_status` and verify accurate provider listing

- [x] T006 [US1] Create providers_status tool in src/tools/providers-status.ts
- [x] T007 [US1] Register providers_status in src/tools/index.ts
- [x] T008 [US1] Format providers_status output with capabilities, missing provider hints, and cross-provider features status

---

## Phase 3: Cross-Provider Utilities (User Story 2)

**Goal**: Foundation for Phase 0090's library intelligence features

**Independent Test**: Call requireProviders with missing provider, verify actionable error

- [x] T009 [US2] Add requireProviders utility function to src/providers/registry.ts
- [x] T010 [US2] Add getAvailableMediaProviders utility function to src/providers/registry.ts

---

## Phase 4: Sonarr Audit (User Story 3)

**Goal**: Enhanced Sonarr responses with file quality, size, queue progress

**Independent Test**: Retrieve episode details and verify enhanced fields present

- [x] T011 [P] [US3] Add EpisodeFile type with quality/size/releaseGroup to src/services/sonarr/types.ts
- [x] T012 [US3] Update SonarrClient methods to include episodeFile data in src/services/sonarr/client.ts
- [x] T013 [US3] Update Sonarr tool outputs to display enhanced fields in src/services/sonarr/tools.ts

---

## Phase 5: Radarr Audit (User Story 3)

**Goal**: Enhanced Radarr responses with file quality, audio format, queue progress

**Independent Test**: Retrieve movie details and verify enhanced fields present

- [x] T014 [P] [US3] Add MovieFile type with quality/audioFormat to src/services/radarr/types.ts
- [x] T015 [US3] Update RadarrClient methods to include movieFile data in src/services/radarr/client.ts
- [x] T016 [US3] Update Radarr tool outputs to display enhanced fields in src/services/radarr/tools.ts

---

## Phase 6: Plex Audit (User Story 3)

**Goal**: Enhanced Plex responses with watch count, last watched date

**Independent Test**: Retrieve media item and verify watch history fields present

- [x] T017 [P] [US3] Add watch history fields to MediaItem type in src/services/plex/types.ts
- [x] T018 [US3] Update PlexClient methods to include watch history data in src/services/plex/client.ts
- [x] T019 [US3] Update Plex tool outputs to display watch history in src/services/plex/tools.ts

---

## Phase 7: Sabnzbd Audit (User Story 3)

**Goal**: Enhanced Sabnzbd responses with ETA, progress, category, priority

**Independent Test**: Retrieve queue and verify enhanced fields present

- [x] T020 [P] [US3] Add enhanced queue fields to types in src/services/sabnzbd/types.ts
- [x] T021 [US3] Update SabnzbdClient queue methods in src/services/sabnzbd/client.ts
- [x] T022 [US3] Update Sabnzbd tool outputs to display enhanced fields in src/services/sabnzbd/tools.ts

---

## Phase 8: Error Handling & Polish (User Story 4)

**Goal**: Actionable error messages and tool descriptions

**Independent Test**: Trigger missing provider error, verify configuration instructions included

- [x] T023 [US4] Update existing ConfigError usages to use ProviderNotConfiguredError where appropriate
- [x] T024 [US4] Update tool descriptions in all services to mention provider dependencies
- [x] T025 [US4] Update system-health tool to use registry in src/tools/system-health.ts
- [x] T026 [US4] Verify all existing tests pass and no breaking changes to interfaces

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - creates foundation
- **Phase 2 (Discovery)**: Depends on Phase 1 - needs registry
- **Phase 3 (Cross-Provider)**: Depends on Phase 1 - extends registry
- **Phases 4-7 (Audits)**: Depend on Phase 1 - can run in parallel
- **Phase 8 (Polish)**: Depends on all previous phases

### Parallel Opportunities

- T001, T002 can run in parallel (different files)
- T011, T014, T017, T020 can run in parallel (different service types)
- All audit phases (4-7) can run in parallel after Phase 1

### Task Dependencies Within Phases

- T003 depends on T001, T002 (needs types and errors)
- T005 depends on T003, T004 (needs registry module complete)
- T006 depends on T005 (needs registry available)
- Each audit phase: types → client → tools (sequential within phase)

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story
- Commit after each task or logical group
- Run `pnpm lint` and `pnpm build` frequently to catch issues early
