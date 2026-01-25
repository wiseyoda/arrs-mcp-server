# Verification Checklist: Polish & Extended Features

**Purpose**: Post-implementation verification of all requirements
**Created**: 2026-01-25
**Feature**: [spec.md](../spec.md)

## Acceptance Criteria Quality

- [x] V-001 All user story acceptance scenarios can be tested
- [x] V-002 Success criteria SC-001 through SC-008 are measurable
- [x] V-003 Edge cases have expected behavior defined

## Extended Tool Verification

### Sonarr Extended (US1)

- [x] V-004 `sonarr_rename` triggers episode file rename
- [x] V-005 `sonarr_refresh` triggers metadata refresh
- [x] V-006 `sonarr_upcoming` returns detailed upcoming episodes

### Radarr Extended (US1)

- [x] V-007 `radarr_rename` triggers movie file rename
- [x] V-008 `radarr_refresh` triggers metadata refresh
- [x] V-009 `radarr_discover` returns movie recommendations
- [x] V-010 Quality routing works correctly (hd vs 4k)

### Plex Extended (US2)

- [x] V-011 `plex_collections` returns collections with item counts
- [x] V-012 `plex_duplicates` identifies duplicate media files
- [x] V-013 `plex_optimize` triggers database optimization

### Sabnzbd Extended (US3)

- [x] V-014 `sabnzbd_quota` returns quota usage and limits
- [x] V-015 `sabnzbd_warnings` returns system warnings

## Workflow Verification (US4)

- [x] V-016 `cleanup_analysis` aggregates data from all services
- [x] V-017 `cleanup_analysis` calculates total potential space savings
- [x] V-018 `cleanup_analysis` handles unavailable services gracefully

## Enhanced Tools Verification (US5, US6)

- [x] V-019 `system_health({ verbose: true })` returns detailed info
- [x] V-020 `media_help` shows connected services status
- [x] V-021 `media_help` includes comprehensive tool catalog
- [x] V-022 `media_help({ topic: X })` works for all topics

## Pagination Verification (US7)

- [x] V-023 `tv_list` supports limit/offset/summary parameters
- [x] V-024 `movie_list` supports limit/offset/summary parameters
- [x] V-025 `library_list` supports limit/offset/summary parameters
- [x] V-026 Default limit is 100 for all list tools
- [x] V-027 Warning appears when results exceed 500 items

## Error Message Verification (US8)

- [x] V-028 API errors include service name
- [x] V-029 "Not found" errors suggest the list tool
- [x] V-030 Configuration errors identify missing setting
- [x] V-031 Network errors include service URL

## Non-Functional Requirements

- [x] V-032 NFR-001: New tools follow existing patterns
- [x] V-033 NFR-002: Client methods use HTTP infrastructure
- [x] V-034 NFR-003: Cross-service tools use Promise.all
- [x] V-035 NFR-004: Large library ops complete within timeout
- [x] V-036 NFR-005: List outputs include entity IDs

## Phase Goal Verification

- [x] V-037 Goal 1: All Extended tier tools implemented and functional
- [x] V-038 Goal 2: Unified cleanup workflow working
- [x] V-039 Goal 3: Error messages are actionable
- [x] V-040 Goal 4: media_help has comprehensive tool catalog
- [x] V-041 Goal 5: Large libraries handled with pagination
- [x] V-042 Goal 6: README updated, manual testing passed

## Quality Gates

- [x] V-043 TypeScript compilation passes (`tsc --noEmit`)
- [x] V-044 ESLint passes with no errors
- [x] V-045 Prettier formatting passes
- [x] V-046 No secrets in code
- [x] V-047 Manual testing with Claude Desktop passes
- [x] V-048 Manual testing with Claude Code passes

## USER GATE Criteria

From phase document - requires user verification:

- [x] V-049 "Add Breaking Bad" workflow works smoothly
- [x] V-050 "Get Inception in 4K" routes to Radarr4K correctly
- [x] V-051 "What's downloading?" shows unified view
- [x] V-052 "Something is stuck" → health check + fix workflow works
- [x] V-053 "Do I have The Office?" → library search with context
- [x] V-054 Large libraries handled without timeout/token overflow
- [x] V-055 4K routing is safe (never accidental)
- [x] V-056 All extended tools work
- [x] V-057 README is complete and accurate

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Items are numbered V-### for verification checklist
- USER GATE items require manual user confirmation before merge
