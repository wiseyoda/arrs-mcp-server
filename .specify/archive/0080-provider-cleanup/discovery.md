# Discovery: Provider Cleanup & Hardening

**Phase**: `0080-provider-cleanup`
**Created**: 2026-01-25
**Status**: Complete

## Phase Context

**Source**: ROADMAP Phase 0080
**Goal**: Formalize provider registration, create discovery tools, and harden all existing providers

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `src/index.ts:23-42` | Main entry point with conditional tool registration | Core integration point for provider registry |
| `src/config.ts` | Configuration loader - validates services, merges env/file configs | Source of provider configuration status |
| `src/shared/errors.ts` | Error hierarchy (ArrsError, ApiError, NetworkError, ConfigError) | Foundation for ProviderNotConfiguredError |
| `src/shared/http.ts` | HttpClient abstraction for API calls | Shared by all service clients |
| `src/services/*/client.ts` | Service clients (Sonarr, Radarr, Plex, Sabnzbd, Overseerr, TMDB) | Audit targets for enhanced responses |
| `src/services/*/tools.ts` | Tool registration functions | Tool descriptions need provider dependency info |
| `src/tools/system-health.ts` | System health tool | Uses informal provider checking, needs registry |
| `src/tools/media-help.ts` | Media help discovery tool | Needs provider status integration |

### Existing Patterns & Conventions

- **Conditional Registration**: Tools are only registered if `config.{service}` exists (presence-based)
- **Service Module Structure**: Each service has `client.ts`, `tools.ts`, `types.ts`, `index.ts`
- **Error Transformation**: Low-level errors caught and transformed to user-friendly messages via `toUserMessage()`
- **Zod Validation**: All tool parameters validated with Zod schemas
- **Quality Routing**: Radarr tools use `quality: 'hd' | '4k'` parameter for routing

### Integration Points

- **src/index.ts**: Provider registry will be initialized here at startup
- **src/tools/**: System tools will use registry instead of individual config checks
- **src/services/*/tools.ts**: registerXxxTools functions will get registry reference for enhanced error messages
- **src/shared/errors.ts**: New ProviderNotConfiguredError class to be added

### Constraints Discovered

- **Stateless Operation**: Cannot cache provider status - must check at startup only
- **No Breaking Changes**: Tool interfaces must remain backward compatible
- **Plugin Architecture**: New registry must work with self-contained service modules
- **Single Source of Truth**: Config.ts loads configuration, registry reflects that state

---

## Requirements Sources

### From ROADMAP/Phase File

1. Formalize conditional provider registration (presence-based)
2. Create provider discovery tool for Claude (`providers_status`)
3. Build cross-provider utility foundation for Phase 0090
4. Audit and harden all existing providers
5. Improve error messages for missing/misconfigured providers

### From Memory Documents

- **Constitution**: Natural language first, safety by default, plugin architecture, stateless operation
- **Tech Stack**: TypeScript 5.x strict, pnpm, Zod validation, native fetch

---

## Scope Clarification

### Confirmed Understanding

**What the user wants to achieve**:
Create a formal provider registry to track which services are configured, expose a discovery tool for Claude to understand available capabilities, and enhance all existing providers with additional useful information from their APIs.

**How it relates to existing code**:
- Registry wraps the existing config checking pattern into a formal abstraction
- Discovery tool builds on the media_help pattern for system-level discovery
- Provider audit enhances existing client methods and tool outputs

**Key constraints and requirements**:
- Must not break existing tool interfaces
- Must support minimal configuration (single provider)
- Error messages must be actionable with configuration instructions
- Tool descriptions must indicate provider dependencies

**Technical approach**:
1. Create `src/providers/registry.ts` with ProviderRegistry interface
2. Create `src/providers/types.ts` and `src/providers/errors.ts`
3. Add `providers_status` tool to system tools
4. Update each service client with additional API fields
5. Enhance error messages with configuration guidance

**User confirmed**: Yes (phase document is authoritative)

---

## Recommendations for SPECIFY

### Should Include in Spec

- Provider registry abstraction with capability tracking
- `providers_status` discovery tool
- Cross-provider utility module
- Enhanced response fields for each provider (per audit table in phase doc)
- ProviderNotConfiguredError with configuration instructions
- Tool description updates for provider dependencies

### Should Exclude from Spec (Non-Goals)

- New providers (future phases)
- Database or persistent state
- Breaking changes to existing tool interfaces
- Runtime provider discovery (only startup)

### Potential Risks

- **Audit scope creep**: Phase doc suggests "at least 3 improvements per provider" - need to prioritize useful fields
- **Error message verbosity**: Balance between helpful and overwhelming
- **Registry overhead**: Keep registry lightweight, avoid over-engineering

### Questions to Address in CLARIFY

None - the phase document is comprehensive and defines scope clearly.
