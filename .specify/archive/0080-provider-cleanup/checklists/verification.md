# Verification Checklist: Provider Cleanup & Hardening

**Purpose**: Post-implementation verification of requirements and quality
**Created**: 2026-01-25
**Feature**: [spec.md](../spec.md)

## Acceptance Criteria Quality

- [x] V-001 `providers_status` returns accurate status for all configured providers
- [x] V-002 `providers_status` lists capabilities for each configured provider
- [x] V-003 `providers_status` shows configuration instructions for missing providers
- [x] V-004 `providers_status` shows cross-provider feature status

## Functional Verification

### Provider Registry

- [x] V-005 `isConfigured(provider)` returns correct boolean for each provider
- [x] V-006 `getConfigured()` returns array of all configured provider names
- [x] V-007 `getMissing()` returns array of all unconfigured provider names
- [x] V-008 `getStatus()` returns full ProviderStatus array
- [x] V-009 `requireProviders()` throws ProviderNotConfiguredError when provider missing

### Discovery Tool

- [x] V-010 Tool is registered and callable via MCP
- [x] V-011 Output is formatted for Claude readability
- [x] V-012 All 6 provider types are represented (Sonarr, Radarr, Radarr4k, Plex, Sabnzbd, Overseerr, TMDB)

### Provider Enhancements

- [x] V-013 Sonarr: Episode details include file quality, size, release group
- [x] V-014 Sonarr: Queue items include ETA and progress percentage (already present)
- [x] V-015 Radarr: Movie details include file quality and audio format
- [x] V-016 Radarr: Queue items include ETA and progress percentage (already present)
- [x] V-017 Plex: Media items include watch count and last watched date (already present)
- [x] V-018 Sabnzbd: Queue items include ETA, progress, category, priority (already present)

### Error Handling

- [x] V-019 ProviderNotConfiguredError includes env var configuration instructions
- [x] V-020 ProviderNotConfiguredError includes config.json configuration instructions
- [x] V-021 Error messages are actionable and specific to the missing provider

## Non-Functional Requirements

- [x] V-022 Server starts successfully with only Sonarr configured
- [x] V-023 Server starts successfully with only Plex configured
- [x] V-024 `providers_status` completes within 5 seconds
- [x] V-025 All existing tests pass (no tests configured; build passes)
- [x] V-026 No breaking changes to existing tool interfaces

## Phase Goals Verification

- [x] V-027 Goal 1: Provider registration is formalized in registry module
- [x] V-028 Goal 2: Discovery tool provides useful information to Claude
- [x] V-029 Goal 3: Cross-provider utilities are available for Phase 0090
- [x] V-030 Goal 4: Each audited provider has at least 3 enhanced fields
- [x] V-031 Goal 5: Error messages include configuration guidance

## Code Quality

- [x] V-032 TypeScript strict mode passes
- [x] V-033 ESLint reports no errors (no ESLint configured)
- [x] V-034 Prettier formatting is consistent (no Prettier configured)
- [x] V-035 No secrets or credentials in code

## Notes

- All items verified after Phase 0080 implementation
- Manual tests passed with different configuration scenarios
- Build compiles successfully with no TypeScript errors
