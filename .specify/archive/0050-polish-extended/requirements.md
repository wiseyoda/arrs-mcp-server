# Requirements Checklist: Polish & Extended Features

**Purpose**: Track requirements completion for Phase 0050
**Created**: 2026-01-25
**Feature**: [spec.md](./spec.md)

## Extended Tools - Sonarr

- [ ] REQ-001 FR-001: `sonarr_rename` - Rename episode files
- [ ] REQ-002 FR-002: `sonarr_refresh` - Refresh series metadata
- [ ] REQ-003 FR-003: `sonarr_upcoming` - Detailed upcoming episodes

## Extended Tools - Radarr

- [ ] REQ-004 FR-004: `radarr_rename` - Rename movie files
- [ ] REQ-005 FR-005: `radarr_refresh` - Refresh movie metadata
- [ ] REQ-006 FR-006: `radarr_discover` - Movie recommendations

## Extended Tools - Plex

- [ ] REQ-007 FR-007: `plex_collections` - List/manage collections
- [ ] REQ-008 FR-008: `plex_duplicates` - Find duplicate files
- [ ] REQ-009 FR-009: `plex_optimize` - Database optimization

## Extended Tools - Sabnzbd

- [ ] REQ-010 FR-010: `sabnzbd_quota` - Quota status
- [ ] REQ-011 FR-011: `sabnzbd_warnings` - System warnings

## Unified Workflows

- [ ] REQ-012 FR-012: `cleanup_analysis` tool implemented
- [ ] REQ-013 FR-013: cleanup_analysis includes all categories
- [ ] REQ-014 FR-014: cleanup_analysis calculates space savings

## Enhanced Existing Tools

- [ ] REQ-015 FR-015: `system_health` verbose mode
- [ ] REQ-016 FR-016: `media_help` shows connected services
- [ ] REQ-017 FR-017: `media_help` tool catalog
- [ ] REQ-018 FR-018: `media_help` workflow examples

## Pagination

- [ ] REQ-019 FR-019: All list tools support `offset`
- [ ] REQ-020 FR-020: All list tools have default limit 100
- [ ] REQ-021 FR-021: List tools support `summary: true`
- [ ] REQ-022 FR-022: Warning when results > 500

## Error Messages

- [ ] REQ-023 FR-023: Errors include service name
- [ ] REQ-024 FR-024: Errors suggest next steps
- [ ] REQ-025 FR-025: "Not found" suggests list tool
- [ ] REQ-026 FR-026: Config errors identify missing setting

## Non-Functional Requirements

- [ ] REQ-027 NFR-001: New tools follow existing patterns
- [ ] REQ-028 NFR-002: Client methods use HTTP infrastructure
- [ ] REQ-029 NFR-003: Cross-service tools use Promise.all
- [ ] REQ-030 NFR-004: Large library ops don't timeout
- [ ] REQ-031 NFR-005: List outputs include entity IDs

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Items are numbered sequentially for easy reference
