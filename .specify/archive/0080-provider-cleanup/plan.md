# Implementation Plan: Provider Cleanup & Hardening

**Branch**: `0080-provider-cleanup` | **Date**: 2026-01-25 | **Spec**: [spec.md](spec.md)

## Summary

Create a formal provider registry abstraction to track configured providers, expose a discovery tool for Claude, and enhance all existing providers with additional API fields for richer responses.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @modelcontextprotocol/sdk, zod
**Storage**: N/A (stateless operation)
**Testing**: Vitest
**Target Platform**: Node.js 20+ LTS
**Project Type**: Single project (MCP server)
**Performance Goals**: Provider status check < 5 seconds
**Constraints**: No breaking changes to tool interfaces, stateless operation
**Scale/Scope**: 6 provider types, ~50 existing tools

## Constitution Check

- **Natural Language First**: Tool names follow semantic patterns (`providers_status`)
- **Safety by Default**: No destructive operations in this phase
- **Plugin Architecture**: Provider registry works with self-contained service modules
- **Stateless Operation**: Registry initialized at startup only, no caching
- **Code Quality Gates**: TypeScript strict, ESLint, Prettier

## Project Structure

### Documentation (this feature)

```text
specs/0080-provider-cleanup/
├── discovery.md     # Codebase findings
├── spec.md          # Feature specification
├── requirements.md  # Requirements checklist
├── plan.md          # This file
├── tasks.md         # Task breakdown
└── checklists/      # Implementation & verification
```

### Source Code (repository root)

```text
src/
├── index.ts                    # Main entry - will build registry
├── config.ts                   # Config loading (existing)
├── providers/                  # NEW - provider registry module
│   ├── index.ts               # Re-exports
│   ├── registry.ts            # ProviderRegistry class
│   ├── types.ts               # ProviderStatus interface
│   └── errors.ts              # ProviderNotConfiguredError
├── shared/
│   ├── errors.ts              # Existing error hierarchy (extend)
│   └── http.ts                # Existing HTTP client
├── services/
│   ├── sonarr/
│   │   ├── client.ts          # Enhance with new API fields
│   │   ├── tools.ts           # Update tool outputs
│   │   └── types.ts           # Add new response types
│   ├── radarr/
│   │   └── ...                # Same pattern
│   ├── plex/
│   │   └── ...                # Same pattern
│   └── sabnzbd/
│       └── ...                # Same pattern
└── tools/
    ├── index.ts               # Register providers_status
    ├── providers-status.ts    # NEW - discovery tool
    ├── system-health.ts       # Update to use registry
    └── media-help.ts          # Update provider hints
```

**Structure Decision**: Extend existing single-project structure with new `src/providers/` module for registry abstraction.

## Implementation Phases

### Phase 1: Provider Registry Foundation

1. Create `src/providers/types.ts` with ProviderStatus interface
2. Create `src/providers/errors.ts` with ProviderNotConfiguredError
3. Create `src/providers/registry.ts` with ProviderRegistry class
4. Create `src/providers/index.ts` for re-exports
5. Update `src/index.ts` to build registry at startup

### Phase 2: Discovery Tool

1. Create `src/tools/providers-status.ts` tool
2. Register in `src/tools/index.ts`
3. Format output for Claude readability
4. Include configuration instructions for missing providers

### Phase 3: Provider Audit & Enhancement

For each provider:
1. Review API documentation for additional useful fields
2. Update types with new response fields
3. Update client methods to fetch/return new fields
4. Update tool outputs to include enhanced information

**Priority order**: Sonarr → Radarr → Plex → Sabnzbd (based on usage)

### Phase 4: Error Handling & Polish

1. Update existing errors to use ProviderNotConfiguredError where appropriate
2. Update tool descriptions to mention provider dependencies
3. Update system-health to use registry
4. Verify backward compatibility

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Registry pattern | Singleton at startup | Simple, no runtime overhead, stateless |
| Capability list | Static per provider | Avoids runtime API checks, predictable |
| Error location | New providers/errors.ts | Keep provider-specific errors separate |
| Tool name | `providers_status` | Follows semantic naming convention |
| Audit scope | 3+ useful fields per provider | Focus on actionable improvements |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes | Run existing tests frequently, careful type updates |
| Scope creep on audit | Stick to 3+ fields per provider, defer nice-to-haves |
| Performance regression | Keep registry lightweight, no async in status check |
