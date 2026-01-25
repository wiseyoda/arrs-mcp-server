# Discovery: Plex Library Integration

**Phase**: `0030-plex`
**Created**: 2025-01-25
**Status**: Complete

## Phase Context

**Source**: ROADMAP phase 0030
**Goal**: Add Plex Media Server integration for library search, watch status tracking, and cleanup workflows

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `src/services/sonarr/` | Sonarr MCP tools | Pattern to follow for client/types/tools structure |
| `src/services/radarr/` | Radarr MCP tools | Same pattern, includes quality routing (HD/4K) |
| `src/shared/http.ts` | HttpClient utility | Shared HTTP client to use for API calls |
| `src/shared/errors.ts` | Error classes | ApiError, NetworkError for error handling |
| `src/config.ts` | Config loading | PlexConfig already defined (url, token) |
| `src/tools/system-health.ts` | Health checks | Integration point for Plex connectivity check |
| `src/index.ts` | Main entry | Where to register Plex tools conditionally |

### Existing Patterns & Conventions

- **Service Module Pattern**: Each service has `client.ts` (API), `types.ts` (interfaces), `tools.ts` (MCP registration), `index.ts` (exports)
- **Tool Registration**: Conditional based on config - `if (config.plex) { registerPlexTools(...) }`
- **Error Handling**: Use shared `formatErrorResponse(error)` with `isError: true` in response
- **Parameter Coercion**: Use `z.coerce.number()` for numeric MCP inputs
- **Output Format**: Simple text, include IDs for follow-up operations
- **Tool Naming**: Semantic tools use `verb_noun` (library_search), service tools use `service_action` (plex_delete)

### Integration Points

- **Main Entry**: `src/index.ts` - register tools if plex config exists
- **System Health**: `src/tools/system-health.ts` - add Plex connectivity check
- **Config**: Already supports `PLEX_URL` and `PLEX_TOKEN` env vars

### Constraints Discovered

- **Auth Header**: Plex uses `X-Plex-Token` header (not `X-Api-Key` like *arr apps)
- **Response Format**: Plex defaults to XML, must send `Accept: application/json`
- **Item IDs**: Plex uses string `ratingKey` (not numeric IDs like *arr apps)
- **Timestamps**: Plex uses Unix seconds for `addedAt`, `lastViewedAt`
- **Delete Destructive**: Plex delete removes actual files (requires confirmation)
- **No stdout**: MCP protocol uses stdout, logging must go to stderr

---

## Requirements Sources

### From ROADMAP/Phase File

1. Build Plex API client with token-based authentication
2. Implement Plex semantic tools (library_list, library_search, library_watched)
3. Implement Plex admin tools (delete, unwatched, watched_old, recent, refresh)
4. Provide library-aware search ("Do I have...?" queries)
5. Enable watch status tracking and cleanup workflows
6. Update cross-service tools to include Plex

### From Previous Phase Handoffs

- None (first Plex phase)

### From Memory Documents

- **Constitution Principle I**: Natural language first - use semantic tool names
- **Constitution Principle II**: Safety by default - delete requires confirmation
- **Constitution Principle III**: Plugin architecture - one directory per service
- **Constitution Principle IV**: Stateless operation - no caching
- **Tech Stack**: TypeScript, native fetch, zod for validation

---

## POC Validation

### API Connectivity Confirmed

| Test | Result |
|------|--------|
| Server identity (`/`) | ✓ KESSEL, Plex 1.42.2, Linux |
| List libraries (`/library/sections`) | ✓ 7 libraries found |
| Hub search (`/hubs/search?query=X`) | ✓ Cross-library search works |
| Title filter (`/library/sections/{id}/all?title=X`) | ✓ Library-specific filter works |
| Unwatched filter (`/library/sections/{id}/unwatched`) | ✓ 403 unwatched movies |
| Watch status (`viewCount`, `lastViewedAt`) | ✓ Fields present and populated |

### Libraries Available

| Key | Name | Type |
|-----|------|------|
| 2 | Movies | movie |
| 3 | Movies (4K) | movie |
| 8 | Kids Shows | show |
| 1 | TV Shows | show |
| 7 | Audiobooks | artist |
| 10 | Podcasts | artist |
| 9 | Home Videos | movie |

### Key API Endpoints Verified

```
GET /                                    # Server identity
GET /library/sections                    # List all libraries
GET /library/sections/{id}/all           # List items in library
GET /library/sections/{id}/all?title=X   # Filter by title
GET /library/sections/{id}/unwatched     # Unwatched items
GET /library/sections/{id}/newest        # Recently added
GET /hubs/search?query=X                 # Cross-library search
GET /library/metadata/{ratingKey}        # Item details
DELETE /library/metadata/{ratingKey}     # Delete item
GET /library/sections/{id}/refresh       # Trigger scan
```

---

## Scope Clarification

### Questions Asked

No clarifying questions needed - phase document is comprehensive and POC validated all API functionality.

### Confirmed Understanding

**What the user wants to achieve**:
- Query Plex libraries to answer "Do I have...?" questions
- Track watch status for content
- Identify cleanup candidates (unwatched, old watched content)
- Ability to delete content with proper confirmation
- Integrate Plex status into system health checks

**How it relates to existing code**:
- Follow same module pattern as Sonarr/Radarr
- Use shared HttpClient and error handling
- Register tools conditionally based on config
- Add Plex to system_health aggregation

**Key constraints and requirements**:
- Use `X-Plex-Token` header for auth
- Send `Accept: application/json` for all requests
- Use `ratingKey` (string) as item identifier
- Delete operations require explicit `confirm: true`
- Support multi-library queries with library context in results

**Technical approach**:
- Create `src/services/plex/` with client, types, tools, index
- 3 semantic tools: library_list, library_search, library_watched
- 5 admin tools: plex_delete, plex_unwatched, plex_watched_old, plex_recent, plex_refresh
- Add Plex connectivity check to system_health

**User confirmed**: Yes - POC validation confirmed API access works

---

## Recommendations for SPECIFY

### Should Include in Spec

- All 8 Plex tools from phase document
- Watch status tracking (viewCount, lastViewedAt)
- Multi-library support with library context in output
- Size information for cleanup decisions
- Total savings calculation for cleanup tools
- Library refresh trigger

### Should Exclude from Spec (Non-Goals)

- Plex playback control
- Plex user management
- Plex sharing/permissions
- Tautulli integration
- Plex sessions/transcoding monitoring
- Audiobook/Podcast library handling (focus on video libraries)

### Potential Risks

- **API Rate Limiting**: Plex can have database lock issues with rapid requests - consider request throttling
- **Delete Permanence**: Plex delete removes actual files - double confirmation pattern important
- **Large Libraries**: 403+ unwatched movies - pagination/limits needed for output

### Questions to Address in SPEC

- None - phase document covers all requirements
