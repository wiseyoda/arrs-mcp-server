# Discovery: Sabnzbd Downloads Integration

**Phase**: `0040-sabnzbd`
**Created**: 2026-01-25
**Status**: Complete

## Phase Context

**Source**: ROADMAP.md Phase 0040
**Goal**: Build Sabnzbd integration for unified download management across the MCP server

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `src/services/sonarr/` | Complete Sonarr MCP integration | Template for client/types/tools pattern |
| `src/services/radarr/` | Radarr integration with 4K routing | Shows service variant handling |
| `src/services/plex/` | Plex library integration | Different auth pattern reference |
| `src/tools/downloads-status.ts` | Unified download status | Integration point for Sabnzbd queue |
| `src/tools/system-health.ts` | Health check aggregation | Integration point for Sabnzbd status |
| `src/shared/http.ts` | HTTP client wrapper | Reusable for Sabnzbd API calls |
| `src/config.ts:57-63` | Sabnzbd config loading | Already implemented |

### Existing Patterns & Conventions

- **Service Module Pattern**: Each service has `client.ts`, `types.ts`, `tools.ts`, `index.ts`
- **HTTP Client**: Native fetch with timeout, error handling, baseUrl pattern
- **Tool Registration**: `server.tool(name, description, schema, handler)` with Zod validation
- **Auth Header Pattern**: Sonarr/Radarr use `X-Api-Key` header; Plex uses `X-Plex-Token`
- **Response Format**: Always `{ content: [{ type: "text", text: string }] }`
- **Error Handling**: `formatErrorResponse()` from shared/errors.js

### Integration Points

- **downloads_status.ts:108-109**: Placeholder comment for Sabnzbd integration
- **system-health.ts**: Will need Sabnzbd health check
- **src/index.ts**: Tool registration conditional on config

### Constraints Discovered

- **Query Parameter Auth**: Sabnzbd uses `?apikey={key}&output=json` (not header-based)
- **String Numbers**: Sabnzbd returns many numbers as strings (mb, percentage, etc.)
- **No API Version Path**: Sabnzbd uses `/api` directly (not `/api/v3` like *arrs)
- **Mode-Based API**: Single endpoint with `?mode=` parameter for different operations

---

## Requirements Sources

### From ROADMAP/Phase File

1. Build Sabnzbd API client with query-parameter authentication
2. Implement download semantic tools (queue, history, pause, resume, speed)
3. Implement admin tools (delete, failed, retry, priority, categories)
4. Enhance downloads_status with full Sabnzbd integration
5. Enable cross-service download tracking (what's in Sabnzbd for which *arr)
6. Complete the unified download management experience

### From Memory Documents

- **Constitution**:
  - Natural language first (semantic tool names)
  - Safety by default (confirm destructive operations)
  - Stateless operation (no caching/persistence)
  - Plugin architecture (one directory per service)
- **Tech Stack**: TypeScript 5.x, Node.js 20+, native fetch, Zod, MCP SDK

---

## Scope Clarification

### Confirmed Understanding

**What the user wants to achieve**:
- Complete Sabnzbd integration following established patterns
- Semantic tools for common download operations (queue, history, pause, resume, speed)
- Admin tools for troubleshooting (delete, failed, retry, priority)
- Unified download status that shows Sabnzbd queue with *arr cross-references
- Health check integration for Sabnzbd

**How it relates to existing code**:
- Follow the exact patterns from sonarr/radarr services
- Integrate with existing downloads_status.ts and system_health.ts
- Use shared HTTP client with custom query param auth
- Configuration already supports Sabnzbd in config.ts

**Key constraints and requirements**:
- Query parameter authentication (not header)
- Must parse string numbers from Sabnzbd responses
- Category mapping for cross-service tracking (tv → Sonarr, movies → Radarr)
- No auto-pilot for destructive operations

**Technical approach**:
- Create `src/services/sabnzbd/` module with standard 4-file structure
- Build HTTP helper for query param auth pattern
- Map Sabnzbd categories to *arr sources for cross-referencing

---

## Recommendations for SPECIFY

### Should Include in Spec

- All 5 semantic download tools (queue, history, pause, resume, speed)
- All 7 admin tools (delete, failed, retry, priority, categories, pause_item, resume_item)
- downloads_status enhancement with Sabnzbd
- system_health enhancement with Sabnzbd
- Cross-service download tracking by category

### Should Exclude from Spec (Non-Goals)

- NZB file uploads (use *arr for adding content)
- Sabnzbd configuration/settings management
- Server administration
- RSS feed management
- Individual tool for every Sabnzbd API mode

### Potential Risks

- Sabnzbd API response format variations (some fields optional)
- Category naming varies by user configuration
- Speed format parsing ("25.5 M" needs conversion)
- ETA unavailable when paused
