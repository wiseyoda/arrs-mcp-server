# Implementation Plan: Documentation & Release Prep

**Branch**: `0100-documentation` | **Date**: 2026-01-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/0100-documentation/spec.md`

## Summary

Create comprehensive public-facing documentation for arrs-mcp-server, including a README overhaul with quick start focus, complete tool catalog for all 88 tools, configuration reference for all 7 services, troubleshooting guide, example conversations, and a CLAUDE.md development guide. This is a documentation-only phase with no source code changes except updating config.example.json.

## Technical Context

**Language/Version**: Markdown (GitHub-Flavored)
**Primary Dependencies**: None (documentation only)
**Storage**: N/A
**Testing**: Manual verification (link checking, accuracy review)
**Target Platform**: GitHub repository / npm package
**Project Type**: Single project
**Performance Goals**: N/A
**Constraints**: All tool documentation must match actual code implementation; no real credentials
**Scale/Scope**: 88 tools across 7 services, 6 documentation files + config update

## Constitution Check

_GATE: Verified - no violations._

| Principle | Status | Notes |
|-----------|--------|-------|
| Natural Language First | PASS | FR-009 requires documenting design philosophy in CLAUDE.md |
| Safety by Default | PASS | FR-012 requires documenting HD default prominently |
| Plugin Architecture | PASS | FR-009 requires documenting Plugin Architecture in CLAUDE.md |
| Stateless Operation | PASS | FR-009 requires documenting Stateless Operation in CLAUDE.md |
| Three-Tier Tool Design | PASS | FR-004 requires semantic/admin/extended tier distinction in tool catalog |

## Project Structure

### Documentation (this feature)

```text
specs/0100-documentation/
├── discovery.md              # Codebase findings
├── spec.md                   # Feature specification
├── requirements.md           # Requirements checklist
├── plan.md                   # This file
├── tasks.md                  # Task breakdown
└── checklists/
    ├── implementation.md     # Implementation guidance
    └── verification.md       # Verification checklist
```

### Source Code (changes for this phase)

```text
# Files to CREATE
docs/
├── tools.md                  # Complete tool catalog (88 tools)
├── configuration.md          # Full configuration reference
├── troubleshooting.md        # Error resolution guide
└── examples.md               # Conversation workflow examples

CLAUDE.md                     # Agent development guide (project root)

# Files to MODIFY
README.md                     # Complete rewrite (quick start + links)
config.example.json           # Add Overseerr and TMDB entries
```

**Structure Decision**: Documentation files go in `docs/` at project root. README.md stays at root as entry point. CLAUDE.md at root for Claude Code auto-detection.

## Implementation Approach

### Phase 1: Foundation

1. **config.example.json** - Add Overseerr and TMDB entries (unblocks configuration docs)
2. **docs/ directory** - Create directory structure

### Phase 2: Core Documentation (ordered by dependency)

1. **docs/configuration.md** - Configuration reference (needed by README quick start)
2. **docs/tools.md** - Tool catalog (largest document, sourced from codebase)
3. **README.md** - Rewrite with quick start focus, linking to docs/

### Phase 3: Supporting Documentation

1. **docs/troubleshooting.md** - Error resolution guide
2. **docs/examples.md** - Conversation workflow examples

### Phase 4: Development Guide

1. **CLAUDE.md** - Agent/developer guide

### Phase 5: Polish

1. **Link verification** - Check all internal links
2. **Consistency review** - Terminology, formatting, accuracy
3. **config.example.json validation** - Verify valid JSON

### Data Sources for Tool Catalog

Each tool's documentation will be sourced from:
- Tool name and description from `server.tool()` registration
- Parameters from zod schema definitions
- Required providers from tool implementation (which client it uses)
- Example usage patterns from README.md and phase file examples

### Service Documentation Sources

| Service | Client File | Tools File | Default Port |
|---------|------------|------------|--------------|
| Sonarr | `src/services/sonarr/client.ts` | `src/services/sonarr/tools.ts` | 8989 |
| Radarr | `src/services/radarr/client.ts` | `src/services/radarr/tools.ts` | 7878 |
| Radarr4K | `src/services/radarr/client.ts` (shared) | `src/services/radarr/tools.ts` (shared) | 7879 |
| Plex | `src/services/plex/client.ts` | `src/services/plex/tools.ts` | 32400 |
| Sabnzbd | `src/services/sabnzbd/client.ts` | `src/services/sabnzbd/tools.ts` | 8080 |
| Overseerr | `src/services/overseerr/client.ts` | `src/services/overseerr/tools.ts` | 5055 |
| TMDB | `src/services/tmdb/client.ts` | `src/services/tmdb/tools.ts` | N/A (API) |

## Complexity Tracking

No constitution violations identified. Documentation phase is straightforward.
