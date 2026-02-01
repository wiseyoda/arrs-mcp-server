# Tasks: Documentation & Release Prep

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | Complete README.md overhaul for public users | FR-001, FR-002, FR-013 | T008-T009 | COVERED |
| 2 | Tool catalog with examples for every tool | FR-003, FR-004 | T005-T007 | COVERED |
| 3 | Configuration guide with all options | FR-005, FR-006, FR-010 | T002-T004 | COVERED |
| 4 | Troubleshooting guide for common issues | FR-007 | T010-T011 | COVERED |
| 5 | Example conversations showing real workflows | FR-008 | T012-T013 | COVERED |
| 6 | Project CLAUDE.md for agent development | FR-009 | T014-T015 | COVERED |

Coverage: 6/6 goals (100%)

## Requirements Coverage

| Requirement | Task(s) | Status |
|-------------|---------|--------|
| FR-001 | T008 | COVERED |
| FR-002 | T009 | COVERED |
| FR-003 | T006 | COVERED |
| FR-004 | T005 | COVERED |
| FR-005 | T003 | COVERED |
| FR-006 | T004 | COVERED |
| FR-007 | T010, T011 | COVERED |
| FR-008 | T012 | COVERED |
| FR-009 | T014, T015 | COVERED |
| FR-010 | T002, T018 | COVERED |
| FR-011 | T020 | COVERED |
| FR-012 | T019 | COVERED |
| FR-013 | T008, T016 | COVERED |
| FR-014 | T020 | COVERED |
| NFR-001 | T021 | COVERED |
| NFR-002 | T022 | COVERED |
| NFR-003 | T016 | COVERED |
| NFR-004 | T023 | COVERED |

---

## Progress Dashboard

> Last updated: 2026-01-31 | Run `specflow tasks sync` to refresh

| Phase | Status | Progress |
|-------|--------|----------|
| Setup | PENDING | 0/2 |
| Configuration Reference | PENDING | 0/3 |
| Tool Catalog | PENDING | 0/3 |
| README Overhaul | PENDING | 0/2 |
| Troubleshooting Guide | PENDING | 0/2 |
| Example Conversations | PENDING | 0/2 |
| Development Guide | PENDING | 0/2 |
| Polish | PENDING | 0/7 |

**Overall**: 0/23 (0%) | **Current**: None

---

**Input**: Design documents from `specs/0100-documentation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Organization**: Tasks are grouped by deliverable to enable independent completion.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Create directory structure and update foundational files

- [x] T001 Create docs/ directory at project root
- [x] T002 [P] [US3] Update config.example.json to include all 7 services (Sonarr, Radarr, Radarr4K, Plex, Sabnzbd, Overseerr, TMDB) with realistic fake credentials

---

## Phase 2: Configuration Reference (Priority: P2) - US3

**Goal**: Complete configuration documentation for all 7 services

**Independent Test**: User can configure any service using only docs/configuration.md

- [x] T003 [US3] Create docs/configuration.md with all 7 services, env vars, config.json format, and API key instructions
- [x] T004 [US3] Add env var reference table to docs/configuration.md covering all 14 environment variables (SONARR_URL, SONARR_API_KEY, RADARR_URL, RADARR_API_KEY, RADARR4K_URL, RADARR4K_API_KEY, PLEX_URL, PLEX_TOKEN, SABNZBD_URL, SABNZBD_API_KEY, OVERSEERR_URL, OVERSEERR_API_KEY, TMDB_API_KEY, CONFIG_PATH)

**Checkpoint**: Configuration reference complete and self-contained

---

## Phase 3: Tool Catalog (Priority: P1) - US2

**Goal**: Document all 88 MCP tools with descriptions, parameters, and examples

**Independent Test**: Look up any tool and find accurate description, parameters, and example

- [x] T005 [US2] Create docs/tools.md structure with service sections and semantic/admin/extended tiers
- [x] T006 [US2] Document all tools with name, description, required providers, parameters table, and example for each service (Sonarr, Radarr, Plex, Sabnzbd, Overseerr, TMDB, System)
- [x] T007 [US2] Add cross-references between related tools (e.g., tv_search → tv_add, collection_missing → collection_add_missing)

**Checkpoint**: All 88 tools documented with consistent format

---

## Phase 4: README Overhaul (Priority: P1) - US1

**Goal**: Rewrite README.md as user-friendly entry point with quick start focus

**Independent Test**: New user follows README from clone to first tool call

- [x] T008 [US1] Rewrite README.md with quick start section, features overview, and links to docs/ guides
- [x] T009 [US1] Add Claude Desktop and Claude Code setup instructions with OS-specific config paths (macOS, Linux, Windows)

**Checkpoint**: README works as standalone quick start and links to all detailed guides

---

## Phase 5: Troubleshooting Guide (Priority: P2) - US4

**Goal**: Document 10+ common error scenarios with causes and fixes

**Independent Test**: Match known error to troubleshooting entry and find actionable fix

- [x] T010 [US4] Create docs/troubleshooting.md with minimum 10 error scenarios: ECONNREFUSED, 401/403 auth failures, missing provider config, timeouts, invalid JSON config, Claude Desktop setup, Claude Code setup, missing API keys, rate limiting, service unavailability
- [x] T011 [US4] Add Claude Desktop/Code setup debugging section and provider-specific troubleshooting

**Checkpoint**: At least 10 error scenarios covered

---

## Phase 6: Example Conversations (Priority: P3) - US5

**Goal**: Show 5+ real conversation workflows demonstrating tool usage

**Independent Test**: Read any example and verify the flow makes sense with actual tools

- [x] T012 [US5] Create docs/examples.md with 5+ conversation examples: adding content, checking downloads, finding missing items, cleanup workflow, cross-service operation
- [x] T013 [US5] Ensure examples reference correct tool names and realistic output formats

**Checkpoint**: Examples demonstrate key workflows with accurate tool calls

---

## Phase 7: Development Guide (Priority: P3) - US6

**Goal**: CLAUDE.md that enables agents/developers to understand and extend the project

**Independent Test**: Developer reads CLAUDE.md and can identify correct patterns for adding a new tool

- [x] T014 [US6] Create CLAUDE.md at project root with architecture overview, module pattern, code conventions
- [x] T015 [US6] Add "Adding a New Tool" and "Adding a New Service" step-by-step guides to CLAUDE.md

**Checkpoint**: CLAUDE.md provides complete development context

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance across all documentation

- [x] T016 Verify all internal links between docs (README → docs/, docs/ cross-references)
- [x] T017 [P] Review all documentation for consistent terminology, formatting, and accuracy
- [x] T018 [P] Verify config.example.json is valid JSON with all 7 services
- [x] T019 Ensure FR-012 compliance: verify Safety by Default documentation (quality defaults to 'hd') appears in at least 3 locations: README features section, tools.md quality parameter docs, and configuration.md Radarr section
- [x] T020 [P] Audit all documentation for fake credentials: verify authoring uses fake creds (FR-011) and scan all docs for violations (FR-014) - no real API keys, hostnames, or tokens in examples
- [x] T021 [P] Review documentation for plain English and accessibility (NFR-001): verify no unexplained jargon, sentences average under 25 words
- [x] T022 Validate all code/config examples are syntactically correct (NFR-002): verify JSON is valid, commands are runnable, parameter names match code
- [x] T023 Verify tool catalog organization for scannability (NFR-004): consistent table format, clear headers, logical grouping

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Configuration (Phase 2)**: Depends on T002 (config.example.json update)
- **Tool Catalog (Phase 3)**: No dependencies on other docs (sources from code)
- **README (Phase 4)**: Depends on Phases 2-3 (links to docs/configuration.md and docs/tools.md)
- **Troubleshooting (Phase 5)**: Can start after Phase 1
- **Examples (Phase 6)**: Depends on Phase 3 (references tool names from catalog)
- **Dev Guide (Phase 7)**: Can start after Phase 1
- **Polish (Phase 8)**: Depends on all previous phases

### Parallel Opportunities

- T001 and T002 can run in parallel (different files)
- T003-T004 (config) and T005-T007 (tools) can run in parallel (different docs)
- T010-T011 (troubleshooting) and T014-T015 (CLAUDE.md) can run in parallel
- T016, T017, T018 marked [P] where applicable

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Setup (Phase 1)
2. Complete Tool Catalog (Phase 3) + Configuration (Phase 2)
3. Complete README (Phase 4)
4. **STOP and VALIDATE**: README quick start works, tools are documented

### Incremental Delivery

1. Setup → Foundation ready
2. Config + Tools → Reference docs ready
3. README → Entry point ready (MVP!)
4. Troubleshooting → Support docs ready
5. Examples → Usage guidance ready
6. CLAUDE.md → Dev docs ready
7. Polish → Quality assured

---

## Notes

- [P] tasks = different files, no dependencies
- All tool documentation must be sourced from actual `tools.ts` registrations
- Use fake but realistic credentials in all examples
- Emphasize Safety by Default (quality: 'hd') in relevant sections
