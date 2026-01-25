# Requirements Checklist: Provider Cleanup & Hardening

**Purpose**: Track requirement completion during implementation
**Created**: 2026-01-25
**Feature**: [spec.md](spec.md)

## Functional Requirements

- [ ] FR-001 Provider registry tracks configured providers at startup
- [ ] FR-002 `providers_status` tool lists providers with status and capabilities
- [ ] FR-003 Configuration instructions shown for missing providers
- [ ] FR-004 `ProviderNotConfiguredError` class with actionable messages
- [ ] FR-005 Cross-provider utility functions (`requireProviders`, `getAvailableMediaProviders`)
- [ ] FR-006 Sonarr enhanced fields: file quality, size, release group, queue ETA/progress
- [ ] FR-007 Radarr enhanced fields: file quality, audio format, queue ETA/progress
- [ ] FR-008 Plex enhanced fields: watch count, last watched date
- [ ] FR-009 Sabnzbd enhanced fields: ETA, progress percentage, category, priority
- [ ] FR-010 Tool descriptions indicate provider dependencies

## Non-Functional Requirements

- [ ] NFR-001 Registry initialized at startup only (stateless)
- [ ] NFR-002 Server starts with single provider configured
- [ ] NFR-003 Provider status check completes within 5 seconds
- [ ] NFR-004 All existing tests pass

## Success Criteria

- [ ] SC-001 `providers_status` reports all 6 provider types accurately
- [ ] SC-002 Missing provider errors include env vars AND config.json instructions
- [ ] SC-003 At least 3 enhanced fields per major provider
- [ ] SC-004 Server starts with any single provider
- [ ] SC-005 Tool interfaces remain backward compatible

## Notes

- Check items off as completed: `[x]`
- Add comments or findings inline
- Items are numbered for easy reference to spec.md
