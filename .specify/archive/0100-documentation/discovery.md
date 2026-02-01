# Discovery: Documentation & Release Prep

**Phase**: `0100-documentation`
**Created**: 2026-01-31
**Status**: Complete

## Phase Context

**Source**: ROADMAP Phase 0100
**Goal**: Create comprehensive documentation for public users including README overhaul, tool catalog, configuration guide, troubleshooting guide, example conversations, and project CLAUDE.md for agent development.

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `README.md` | Existing user documentation (380 lines) | Primary rewrite target - has basic structure but needs overhaul |
| `config.example.json` | Configuration template | Missing Overseerr and TMDB entries - needs update |
| `src/config.ts` | Configuration loader | Source of truth for config options and env vars |
| `src/services/*/tools.ts` | Tool registrations (6 files) | Source of truth for all 88 MCP tools |
| `src/tools/*.ts` | System tool registrations (10 files) | Cross-service tools documentation source |
| `src/providers/registry.ts` | Provider registry | Documents provider capabilities and requirements |
| `src/shared/errors.ts` | Error handling | Source for troubleshooting common errors |
| `src/shared/http.ts` | HTTP client | Timeout and connection error patterns |
| `.specify/memory/*.md` | Project memory documents | Internal docs - not for public users |

### Existing Patterns & Conventions

- **Tool Naming**: Semantic tools use `verb_noun` (tv_search), service tools use `service_action` (sonarr_queue)
- **Response Format**: Plain text, token-efficient, with entity IDs for cross-tool references
- **Error Messages**: User-friendly via `toUserMessage()` pattern with actionable fix suggestions
- **Three-Tier Tool Design**: Semantic tools (natural language, user-facing) + Admin tools (service-specific operations) + Extended tools (advanced/discovery)

### Integration Points

- **No code changes needed**: This phase only creates/modifies documentation files
- **docs/ directory**: New directory for detailed guides (tools, config, troubleshooting, examples)
- **README.md**: Complete rewrite with quick-start focus, linking to docs/
- **CLAUDE.md**: New project-level agent development guide
- **config.example.json**: Update to include all 7 services

### Constraints Discovered

- **88 tools total**: Documentation must cover all tools accurately
- **7 services**: Each with different auth patterns (API key vs token)
- **config.example.json incomplete**: Missing Overseerr and TMDB entries
- **No automated tests yet**: Cannot auto-verify example outputs (Phase 0110)
- **stdout reserved**: MCP protocol constraint worth documenting
- **Provider registry**: Tools auto-discover based on config - partial configs work

---

## Requirements Sources

### From ROADMAP/Phase File

1. Complete README.md overhaul for public users
2. Tool catalog with examples for every tool
3. Configuration guide with all options
4. Troubleshooting guide for common issues
5. Example conversations showing real workflows
6. Project CLAUDE.md for agent development

### From Related Issues

No related issues found.

### From Previous Phase Handoffs

No handoff files exist from previous phases.

### From Memory Documents

- **Constitution**: Natural Language First principle - docs must use intuitive language
- **Constitution**: Safety by Default - docs must emphasize HD default for Radarr
- **API Standards**: Tool descriptions must explain intent and when to use
- **Security**: Never expose real credentials in documentation examples
- **Coding Standards**: Code comments only for non-obvious logic

---

## Scope Clarification

### Confirmed Understanding

**What the user wants to achieve**:
Create comprehensive, public-facing documentation that enables new users to set up and use arrs-mcp-server with minimal friction. The documentation should cover installation, configuration, all 88 tools, common workflows, troubleshooting, and a development guide for contributors.

**How it relates to existing code**:
Documentation-only phase. No source code changes except updating `config.example.json` to include all services. All tool descriptions and parameters will be sourced from actual tool registrations in the codebase.

**Key constraints and requirements**:
- All tool documentation must match actual implementation (88 tools across 7 services)
- Configuration guide must cover all env vars and config.json options
- Examples must use realistic but fake credentials
- Quick start must work for users with only 1 service configured
- 4K safety (quality defaults to 'hd') must be prominently documented

**Technical approach**:
- docs/ directory for detailed guides
- README.md as entry point with quick start + links to docs/
- CLAUDE.md at project root for agent development

**User confirmed**: Auto-confirmed (documentation phase with clear scope from phase file)

---

## Recommendations for SPECIFY

### Should Include in Spec

- README.md complete rewrite (quick start focus)
- docs/tools.md - Full tool catalog with all 88 tools
- docs/configuration.md - All services, env vars, config.json
- docs/troubleshooting.md - Connection errors, auth failures, common issues
- docs/examples.md - Real conversation workflows
- CLAUDE.md - Agent development guide
- config.example.json update (add Overseerr, TMDB)
- Error message consistency review pass

### Should Exclude from Spec (Non-Goals)

- API documentation generation (Phase 0110)
- Video tutorials
- Blog posts or external documentation
- Localization
- Automated doc generation from code
- CI/CD pipeline documentation (Phase 0110)

### Potential Risks

- Tool parameters may change if bugs are found - keep docs close to code
- Example outputs may not perfectly match current formatting
- Links between docs could break if files are reorganized

### Questions to Address in CLARIFY

- None - documentation scope is well-defined by the phase document
