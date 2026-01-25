# Discovery: Radarr (Movies)

**Phase**: `0020-radarr`
**Created**: 2026-01-25
**Status**: Complete

## Phase Context

**Source**: ROADMAP.md Phase 0020, .specify/phases/0020-radarr.md
**Goal**: Implement Radarr (and Radarr4K) MCP integration following the established patterns from Phase 0010 (Sonarr)

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `src/services/sonarr/client.ts` | Sonarr API client implementation | Template for RadarrClient |
| `src/services/sonarr/types.ts` | TypeScript types for Sonarr v3 API | Pattern for Radarr types |
| `src/services/sonarr/tools.ts` | MCP tool registration for Sonarr | Template for Radarr tools |
| `src/services/sonarr/index.ts` | Barrel exports | Same pattern for Radarr |
| `src/shared/http-client.ts` | Shared HTTP client with timeout | Reuse for Radarr API calls |
| `src/shared/errors.ts` | Error classes (ArrsError, ApiError, NetworkError) | Use for Radarr error handling |
| `src/tools/system-health.ts` | Cross-service health check | Extend to include Radarr |
| `src/tools/downloads-status.ts` | Unified download status | Extend to include Radarr queue |
| `src/config.ts` | Configuration loading with env vars + file | Add radarr + radarr4k config |

### Existing Patterns & Conventions

- **Service Module Pattern**: Each service has client.ts (API), types.ts (types), tools.ts (MCP registration), index.ts (exports)
- **HTTP Client Usage**: Use shared HttpClient with base URL `{url}/api/v3`, X-Api-Key header
- **Tool Naming**: Semantic tools use `verb_noun` (movie_search), service tools use `service_action` (radarr_queue)
- **Parameter Coercion**: Use `z.coerce.number()` and `z.coerce.boolean()` since MCP passes strings
- **Error Handling**: Catch errors, return user-friendly messages via `formatErrorResponse(error)`
- **List Tool Pattern**: Support filters (status, genre, missing_only), sorting (title, size, added), display options (show_size, show_rating), limit
- **Output Format**: Plain text, readable by Claude, one item per line for lists

### Integration Points

- **Main Server Registration**: `src/index.ts` - conditionally register Radarr tools if configured
- **Cross-Service Tools**: `src/tools/index.ts` - update system_health and downloads_status
- **Configuration**: `src/config.ts` - add `radarr` and `radarr4k` ServiceConfig types

### Constraints Discovered

- **Zod v3**: MCP SDK requires Zod ^3.25, not v4
- **stdout Reserved**: All logging must go to stderr; stdout is MCP protocol only
- **4K Safety**: Default quality must be 'hd', only route to radarr4k on explicit request
- **No Caching**: Each tool call queries live API state
- **Stateless**: No persistent state between tool calls

---

## Requirements Sources

### From ROADMAP/Phase File

1. Build Radarr API client following established service module pattern
2. Implement all Radarr semantic tools (movie_search, movie_add, movie_list, movie_upgrade, movie_delete)
3. Implement Radarr admin tools (queue, details, profiles, stuck, import, blacklist)
4. Add Radarr4K routing with safety-first defaults (HD unless explicitly requested)
5. Update cross-service tools (downloads_status, system_health) to include Radarr
6. Enhance movie_list with filtering/sorting/display options (like tv_list)

### From Previous Phase Handoffs

- No deferred items from Phase 0010 that apply to Radarr

### From Memory Documents

- **Constitution**: Natural language tool names, safety by default (4K only on explicit request), plugin isolation, two-tier tools (semantic + service-specific)
- **Tech Stack**: TypeScript 5.x strict, Node.js 20+, native fetch, Zod for validation, pnpm
- **API Standards**: Tools named by semantic action, quality parameter defaults to 'hd', all movie tools accept optional quality parameter

---

## Scope Clarification

### Questions Asked

No clarifying questions needed - the phase document and established patterns from Phase 0010 provide complete guidance.

The implementation is well-defined:
- Mirror Sonarr module structure exactly
- Use same HTTP client, error handling, and formatting patterns
- Follow established tool registration conventions
- Add quality routing for 4K support

### Confirmed Understanding

**What the user wants to achieve**:
Full Radarr integration allowing Claude to search, add, list, and manage movies with proper routing between HD (regular Radarr) and 4K (Radarr4K) instances.

**How it relates to existing code**:
- Direct parallel to Sonarr implementation
- Reuses shared infrastructure (HttpClient, errors, config)
- Extends cross-service tools to aggregate Radarr data

**Key constraints and requirements**:
- HD by default, 4K only on explicit request (trigger words: "4K", "4k", "UHD", "2160p")
- Follow exact patterns from Sonarr for consistency
- Support comprehensive filtering/sorting on movie_list

**Technical approach (if discussed)**:
1. Create `src/services/radarr/` module with client.ts, types.ts, tools.ts, index.ts
2. Implement quality routing helper function
3. Register conditional tools in main server
4. Update cross-service tools last

**User confirmed**: Yes - Follows ROADMAP and phase document

---

## Recommendations for SPECIFY

### Should Include in Spec

- RadarrClient class with all required methods
- All 5 semantic tools: movie_search, movie_add, movie_list, movie_upgrade, movie_delete
- All 6 admin tools: radarr_queue, radarr_details, radarr_profiles, radarr_stuck, radarr_import, radarr_blacklist
- Quality routing between Radarr and Radarr4K
- movie_list filtering/sorting/display options
- Updates to downloads_status and system_health

### Should Exclude from Spec (Non-Goals)

- Plex integration (Phase 0030)
- Sabnzbd integration (Phase 0040)
- Overseerr integration (out of scope)
- Collection management (future enhancement)
- Custom list support (not in phase scope)

### Potential Risks

- **API Differences**: Radarr API may have slight differences from Sonarr despite similar structure - need to test actual responses
- **4K Routing Edge Cases**: User might ask for 4K when Radarr4K is not configured
- **Dual Instance Confusion**: User might not understand why same movie appears differently between instances

### Questions to Address in CLARIFY

None - phase document is comprehensive and patterns are established.
