# Verification Checklist: Foundation + Sonarr

**Purpose**: Verify feature completion before phase merge
**Created**: 2025-01-24
**Feature**: [spec.md](../spec.md)

---

## Phase Goals Verification

- [ ] V-001 Goal 1: MCP server connects to Claude Desktop
- [ ] V-002 Goal 1: MCP server connects to Claude Code
- [ ] V-003 Goal 2: Config loads from environment variables
- [ ] V-004 Goal 2: Config loads from config.json
- [ ] V-005 Goal 3: Sonarr API client connects successfully
- [ ] V-006 Goal 3: API errors return helpful messages
- [ ] V-007 Goal 4: All 5 semantic tools work
- [ ] V-008 Goal 5: All 9 admin tools work
- [ ] V-009 Goal 6: All 3 cross-service tools work
- [ ] V-010 Goal 7: README documentation complete

## User Story Verification

### US1 - Search and Add TV Shows

- [ ] V-020 Can search for a TV series by name
- [ ] V-021 Search results display clearly
- [ ] V-022 Can add a series with default settings
- [ ] V-023 Can add a series with custom monitor option
- [ ] V-024 Adding existing series reports it exists
- [ ] V-025 Search with no results reports clearly

### US2 - View Library Status

- [ ] V-030 Can list all TV series
- [ ] V-031 List shows name and basic status
- [ ] V-032 Can filter by continuing/ended status
- [ ] V-033 Can view episodes for a series
- [ ] V-034 Episodes show downloaded/missing status

### US3 - Monitor Download Queue

- [ ] V-040 Can view download queue
- [ ] V-041 Queue shows progress and ETA
- [ ] V-042 Queue highlights errors
- [ ] V-043 Can trigger search for missing episodes

### US4 - Troubleshoot Stuck Imports

- [ ] V-050 Can identify stuck imports
- [ ] V-051 Can blacklist a release
- [ ] V-052 Blacklist can trigger re-search
- [ ] V-053 Can trigger manual import

### US5 - System Health Check

- [ ] V-060 Health check succeeds when Sonarr is running
- [ ] V-061 Health check reports error when Sonarr is down
- [ ] V-062 Health check provides actionable information

### US6 - Get Help

- [ ] V-070 media_help returns tool list
- [ ] V-071 media_help explains connected services
- [ ] V-072 downloads_status shows Sonarr queue

## Edge Case Verification

- [ ] V-080 Missing configuration shows clear error
- [ ] V-081 Invalid API key shows clear error
- [ ] V-082 Network timeout handled gracefully
- [ ] V-083 Empty search results handled
- [ ] V-084 Large episode lists display correctly

## Success Criteria Verification

- [ ] SC-001 Server starts without errors
- [ ] SC-002 Invalid config shows clear error
- [ ] SC-003 All 5 semantic tools work
- [ ] SC-004 All 9 admin tools work
- [ ] SC-005 All 3 cross-service tools work
- [ ] SC-006 Works with Claude Desktop
- [ ] SC-007 Works with Claude Code
- [ ] SC-008 Error messages are actionable

---

## USER GATE Verification

**This phase has a USER GATE. The following must be verified by the user:**

- [ ] UG-001 MCP server starts without errors (`pnpm start`)
- [ ] UG-002 Works with Claude Desktop (add to config, restart, use tools)
- [ ] UG-003 Works with Claude Code (add to settings, use tools)
- [ ] UG-004 tv_search - Can search for a series by name
- [ ] UG-005 tv_add - Can add a series with options
- [ ] UG-006 tv_list - Can list all series
- [ ] UG-007 tv_episodes - Can view episode status
- [ ] UG-008 tv_search_missing - Can trigger search
- [ ] UG-009 sonarr_queue - Can see queue with progress/ETA/errors
- [ ] UG-010 sonarr_stuck - Can see and fix stuck imports
- [ ] UG-011 sonarr_blacklist - Can blacklist and re-search
- [ ] UG-012 system_health - Reports issues correctly
- [ ] UG-013 Error messages are helpful

---

## Notes

- All V-### items should be verified before requesting user gate approval
- UG-### items require explicit user confirmation
- Test against a running Sonarr instance
- Test both Claude Desktop and Claude Code
