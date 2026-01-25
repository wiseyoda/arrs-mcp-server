# Requirements Checklist: Plex Library Integration

**Purpose**: Track requirement completion for Phase 0030 - Plex
**Created**: 2025-01-25
**Feature**: [spec.md](spec.md)

## Semantic Tools

- [ ] REQ001 `library_list` tool lists all Plex libraries with key, name, type (FR-001)
- [ ] REQ002 `library_search` tool searches across libraries with query (FR-002)
- [ ] REQ003 `library_watched` tool shows watch status for library items (FR-003)
- [ ] REQ004 `library_search` includes library name in results (FR-004)
- [ ] REQ005 `library_search` supports optional `library` filter (FR-005)
- [ ] REQ006 Watch status shows viewCount and formatted lastViewedAt (FR-006)

## Admin Tools

- [ ] REQ007 `plex_delete` tool requires rating_key and confirm:true (FR-007)
- [ ] REQ008 `plex_delete` rejects deletion without confirm (FR-008)
- [ ] REQ009 `plex_unwatched` tool with days and library params (FR-009)
- [ ] REQ010 `plex_watched_old` tool with days and library params (FR-010)
- [ ] REQ011 `plex_recent` tool with library and limit params (FR-011)
- [ ] REQ012 `plex_refresh` tool with optional library param (FR-012)
- [ ] REQ013 Cleanup tools show item size and total savings (FR-013)

## Integration

- [ ] REQ014 `system_health` includes Plex connectivity check (FR-014)
- [ ] REQ015 X-Plex-Token header used for authentication (FR-015)
- [ ] REQ016 Accept: application/json sent for all requests (FR-016)

## Configuration

- [ ] REQ017 PLEX_URL and PLEX_TOKEN environment variables supported (FR-017)
- [ ] REQ018 plex.url and plex.token in config.json supported (FR-018)
- [ ] REQ019 Tools only register when Plex config complete (FR-019)

## Non-Functional

- [ ] REQ020 Responses formatted as simple text for Claude (NFR-001)
- [ ] REQ021 Error messages user-friendly (NFR-002)
- [ ] REQ022 Large result sets limited with total indicated (NFR-003)
- [ ] REQ023 Timestamps converted to human-readable format (NFR-004)

## Notes

- Check items off as completed: `[x]`
- Each item maps to a requirement ID from spec.md
- All items must be checked before phase verification
