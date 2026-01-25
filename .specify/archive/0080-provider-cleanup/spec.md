# Feature Specification: Provider Cleanup & Hardening

**Feature Branch**: `0080-provider-cleanup`
**Created**: 2026-01-25
**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Provider Discovery (Priority: P1)

Claude asks "what services are available?" and needs to understand which providers are configured, their capabilities, and how to configure missing ones.

**Why this priority**: Claude needs to understand the environment to provide appropriate assistance. This is foundational for all media management interactions.

**Independent Test**: Run `providers_status` tool and verify it returns accurate information about configured providers.

**Acceptance Scenarios**:

1. **Given** the MCP server is running with Sonarr and Radarr configured, **When** Claude calls `providers_status`, **Then** it receives a list showing Sonarr and Radarr as configured with their capabilities, and missing providers with configuration instructions.

2. **Given** a user has minimal configuration (only Plex), **When** Claude calls `providers_status`, **Then** it sees Plex as configured and all other providers as missing with helpful setup instructions.

---

### User Story 2 - Cross-Provider Operations (Priority: P2)

Claude tries to perform an operation that requires multiple providers (e.g., library consistency check requiring Plex + Sonarr/Radarr) and one is missing.

**Why this priority**: Phase 0090 will introduce library intelligence features that require multiple providers. The foundation must provide clear errors.

**Independent Test**: Attempt to use a cross-provider tool when a required provider is missing and verify the error message is actionable.

**Acceptance Scenarios**:

1. **Given** Plex is configured but Sonarr is not, **When** a tool requiring both is called, **Then** a clear error message indicates which provider is missing and how to configure it.

2. **Given** all required providers are configured, **When** a cross-provider utility is called, **Then** it succeeds without registry-related errors.

---

### User Story 3 - Enhanced Provider Information (Priority: P3)

Claude helps a user understand their media library and needs richer information from providers (e.g., file quality, download progress, watch history).

**Why this priority**: Enhances the user experience by providing more detailed and useful information without requiring additional API calls.

**Independent Test**: Call provider tools and verify enhanced fields are present in responses.

**Acceptance Scenarios**:

1. **Given** a series exists in Sonarr, **When** Claude retrieves episode details, **Then** the response includes file quality, size, and release group information.

2. **Given** items are in Sabnzbd queue, **When** Claude retrieves queue status, **Then** the response includes ETA, progress percentage, and category.

3. **Given** media exists in Plex, **When** Claude retrieves watch history, **Then** the response includes watch count and last watched date.

---

### User Story 4 - Improved Error Messages (Priority: P4)

A user has a misconfigured provider (e.g., wrong URL or expired API key) and needs actionable guidance.

**Why this priority**: Reduces user frustration and support burden by providing clear configuration guidance.

**Independent Test**: Trigger a provider error and verify the error message includes specific configuration instructions.

**Acceptance Scenarios**:

1. **Given** Overseerr URL is incorrect, **When** a tool calls Overseerr, **Then** the error message includes configuration instructions (env vars and config.json format).

2. **Given** an API key is invalid, **When** authentication fails, **Then** the error message explains how to obtain and configure a new key.

---

### Edge Cases

- What happens when zero providers are configured? (Server refuses to start with helpful message)
- What happens when a provider URL is reachable but returns unexpected data? (ApiError with details)
- What happens when a provider becomes unavailable after startup? (NetworkError with retry guidance)
- What happens when the registry is queried before initialization? (Should not be possible - singleton at startup)

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a provider registry that tracks which providers are configured at startup
- **FR-002**: System MUST expose a `providers_status` tool that lists all providers with their status and capabilities
- **FR-003**: System MUST show configuration instructions for missing providers in the status output
- **FR-004**: System MUST provide `ProviderNotConfiguredError` class with actionable error messages
- **FR-005**: System MUST provide cross-provider utility functions (`requireProviders`, `getAvailableMediaProviders`)
- **FR-006**: Sonarr responses MUST include enhanced fields: file quality, size, release group, queue ETA/progress
- **FR-007**: Radarr responses MUST include enhanced fields: file quality, audio format, queue ETA/progress
- **FR-008**: Plex responses MUST include enhanced fields: watch count, last watched date
- **FR-009**: Sabnzbd responses MUST include enhanced fields: ETA, progress percentage, category, priority
- **FR-010**: Tool descriptions MUST indicate provider dependencies for cross-provider tools

### Non-Functional Requirements

- **NFR-001**: Provider registry MUST be initialized at startup only (stateless operation)
- **NFR-002**: Server MUST start successfully with a single provider configured
- **NFR-003**: Provider status check MUST complete within 5 seconds
- **NFR-004**: All existing tests MUST continue to pass

### Key Entities

- **ProviderStatus**: Represents a provider's configuration state (name, configured, capabilities)
- **ProviderRegistry**: Singleton that manages provider status tracking and validation
- **ProviderNotConfiguredError**: Error class for missing provider scenarios with configuration guidance

## Success Criteria

### Measurable Outcomes

- **SC-001**: `providers_status` accurately reports all 6 provider types (Sonarr, Radarr, Radarr4k, Plex, Sabnzbd, Overseerr, TMDB)
- **SC-002**: Missing provider errors include both environment variable and config.json configuration instructions
- **SC-003**: At least 3 enhanced fields per major provider (Sonarr, Radarr, Plex, Sabnzbd)
- **SC-004**: Server starts successfully with any single provider configured
- **SC-005**: All existing tool interfaces remain backward compatible
