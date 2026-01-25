# arrs-mcp-server Development Roadmap

> **Source of Truth**: This document defines all feature phases, their order, and completion status.
> Work proceeds through phases sequentially. Each phase produces a deployable increment.

**Project**: arrs-mcp-server - MCP server for managing Sonarr, Radarr, Radarr4k, Plex, and Sabnzbd through Claude.
**Created**: 2025-01-24
**Schema Version**: 3.0 (ABBC numbering)
**Status**: Active Development

---

## Phase Numbering

Phases use **ABBC** format:

- **A** = Milestone (0-9) - Major version or project stage
- **BB** = Phase (01-99) - Sequential work within milestone
- **C** = Hotfix (0-9) - Insert slot (0 = main phase, 1-9 = hotfixes/inserts)

**Examples**:

- `0010` = Milestone 0, Phase 01, no hotfix
- `0021` = Hotfix 1 inserted after Phase 02
- `1010` = Milestone 1, Phase 01, no hotfix

This allows inserting urgent work without renumbering existing phases.

---

## Phase Overview

| Phase | Name | Status | Verification Gate |
| ----- | ---- | ------ | ----------------- |
| 0010 | foundation-sonarr | ✅ Complete | **USER GATE**: MCP server starts, Sonarr tools work in Claude Desktop/Code |
| 0020 | radarr | ✅ Complete | Movie tools work, 4K routing correct |
| 0030  | plex | ⬜ Not Started | Library search and watch status work |
| 0040  | sabnzbd | ⬜ Not Started | Download queue management works |
| 0050  | polish-extended | ⬜ Not Started | All extended tools, cleanup workflows |

**Legend**: ⬜ Not Started | 🔄 In Progress | ✅ Complete | **USER GATE** = Requires user verification

---

## Phase Details

Phase details are stored in modular files:

| Location                      | Content                      |
| ----------------------------- | ---------------------------- |
| `.specify/phases/*.md`        | Active/pending phase details |
| `.specify/history/HISTORY.md` | Archived completed phases    |

To view a specific phase:

```bash
specflow phase show 0010
```

To list all phases:

```bash
specflow phase list
specflow phase list --active
specflow phase list --complete
```

---

## Verification Gates Summary

| Gate       | Phase | What User Verifies           |
| ---------- | ----- | ---------------------------- |
| **Gate 1** | 0010  | MCP server starts, Sonarr tools work in Claude Desktop/Code |
| **Gate 2** | 0020  | Movie search/add works, 4K routing is safe (HD default), both Radarr instances accessible |
| **Gate 3** | 0030  | Library search finds content, watch status correct, cleanup tools identify candidates |
| **Gate 4** | 0040  | Download queue visible, pause/resume works, cross-references show *arr source |
| **Gate 5** | 0050  | **USER GATE**: All core workflows work end-to-end, large libraries handled, error messages helpful |

---

## Phase Sizing Guidelines

Each phase is designed to be:

- **Completable** in a single agentic coding session (~200k tokens)
- **Independently deployable** (no half-finished features)
- **Verifiable** with clear success criteria
- **Building** on previous phases

If a phase is running long:

1. Cut scope to MVP for that phase
2. Document deferred items in `specs/[phase]/checklists/deferred.md`
3. Prioritize verification gate requirements

---

## Design Decisions (Established in Phase 0010)

These decisions apply to all phases:

| Decision | Value | Rationale |
|----------|-------|-----------|
| HTTP Client | Native `fetch` | No external dependencies, sufficient for needs |
| Output Format | Simple text | Readable by Claude, token-efficient |
| Parameter Types | `z.coerce.number()` | MCP passes numbers as strings |
| Module Pattern | `client.ts`/`types.ts`/`tools.ts` per service | Clean separation, testable |
| List Tools | Filtering + sorting + display options | User-requested in Phase 0010 for flexibility |
| Config Priority | Env vars > config.json > defaults | Secrets via env, convenience via file |
| Zod Version | ^3.25 (not v4) | MCP SDK compatibility requirement |
| stdout | Reserved for MCP protocol only | Logging must go to stderr |
| 4K Safety | `quality` defaults to `'hd'` | Prevent accidental 4K downloads (Constitution Principle II) |

---

## Implementation Notes

### Per-Phase Pattern

Each phase follows this pattern:

1. Create service directory: `src/services/{service}/`
2. Implement API client: `client.ts`
3. Define types: `types.ts`
4. Register MCP tools: `tools.ts`
5. Export from index: `index.ts`
6. Test manually with Claude
7. Update README

### Configuration

Services are configured in `config.json` or environment variables:

```json
{
  "sonarr": { "url": "...", "apiKey": "..." },
  "radarr": { "url": "...", "apiKey": "..." },
  "radarr4k": { "url": "...", "apiKey": "..." },
  "plex": { "url": "...", "token": "..." },
  "sabnzbd": { "url": "...", "apiKey": "..." }
}
```

### Success Criteria

The project is complete when:

1. All core tools for all 4 services work
2. Natural language requests are handled smoothly
3. Error messages are helpful
4. Configuration is straightforward
5. Works with both Claude Desktop and Claude Code
6. Top workflows work seamlessly:
   - "Add Breaking Bad" → searches, confirms, adds, reports search started
   - "What's downloading?" → unified view with issues highlighted
   - "Something is stuck" → health check + fix workflow
   - "Get Inception in 4K" → correctly routes to Radarr4k

---

## How to Use This Document

### Starting a Phase

```
/flow.orchestrate
```

Or manually:

```
/flow.design "Phase NNNN - [Phase Name]"
```

### After Completing a Phase

1. Run `/flow.verify` to verify the phase is complete
2. Run `/flow.merge` to close, push, and merge (updates ROADMAP automatically)
3. If USER GATE: get explicit user verification before proceeding

### Adding New Phases

Use SpecFlow commands:

```bash
specflow phase add 0025 "new-phase-name"
specflow phase add 0025 "new-phase-name" --user-gate --gate "Description"
specflow phase open --hotfix "Urgent Fix"
```
