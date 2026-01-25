# Discovery: Polish & Extended Features

**Phase**: `0050-polish-extended`
**Created**: 2026-01-25
**Status**: Complete

## Phase Context

**Source**: ROADMAP phase 0050
**Goal**: Implement all Extended tier tools, add unified cleanup workflows, polish error messages, optimize for large libraries, and enhance the help system.

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `src/tools/system-health.ts` | Aggregates health across all services | Will enhance with verbose mode |
| `src/tools/media-help.ts` | Help system with topic-specific guidance | Will expand with tool catalog |
| `src/tools/downloads-status.ts` | Unified download view across services | Pattern for cross-service aggregation |
| `src/services/sonarr/tools.ts` | Sonarr MCP tools (775 lines) | Adding extended tools: rename, refresh, upcoming |
| `src/services/sonarr/client.ts` | Sonarr API client | Adding new API methods |
| `src/services/radarr/tools.ts` | Radarr MCP tools (703 lines) | Adding extended tools: rename, refresh, discover |
| `src/services/radarr/client.ts` | Radarr API client | Adding new API methods |
| `src/services/plex/tools.ts` | Plex MCP tools (955 lines) | Adding extended tools: collections, duplicates, optimize |
| `src/services/plex/client.ts` | Plex API client with pagination | Adding new API methods |
| `src/services/sabnzbd/tools.ts` | Sabnzbd MCP tools (464 lines) | Adding extended tools: quota, warnings |
| `src/services/sabnzbd/client.ts` | Sabnzbd API client | Adding new API methods |
| `src/shared/errors.ts` | Error class hierarchy with toUserMessage() | Enhancing error messages |

### Existing Patterns & Conventions

- **Tool Organization**: Split into "Semantic" (user-facing) and "Service-specific/Admin" tools
- **Error Handling**: Custom error classes with `toUserMessage()` for Claude-friendly output
- **HTTP Client**: Generic `HttpClient` in `src/shared/http.ts` with timeout and error handling
- **Pagination**: Plex uses HTTP headers (`X-Plex-Container-Start/Size`), Sonarr/Radarr use page/pageSize
- **Quality Routing**: Radarr uses `getRadarrClient(quality: 'hd' | '4k')` for safe 4K handling
- **Entity IDs**: All list outputs include `[ID]` prefix for downstream tool calls
- **Parallel Execution**: `Promise.all()` for multi-service operations (see system_health)
- **List Parameters**: Common filters (status, genre), sorts (title, size, added), display options (show_size)

### Integration Points

- **Cross-Service Tools**: `system_health`, `downloads_status`, `media_help` aggregate across services
- **Tool Registration**: Conditional registration in `src/index.ts` based on config
- **Schema Validation**: All tools use Zod schemas for parameter validation
- **Response Format**: `{ content: [{type: "text", text: "..."}], isError?: true }`

### Constraints Discovered

- **Token Overflow Risk**: Large libraries (1000+ items) can overflow Claude's context - need default limits
- **API Rate Limits**: Plex in particular can rate-limit aggressive requests
- **Service Dependencies**: Some extended tools require specific service versions

---

## Requirements Sources

### From ROADMAP/Phase File

1. Implement all Extended tier tools from api-standards.md
2. Add unified cleanup workflows across services
3. Polish error messages and edge case handling
4. Add comprehensive media_help with tool catalog
5. Performance optimization for large libraries
6. Documentation updates and final testing

### From Memory Documents

- **Constitution**: Natural language first, safety by default, stateless operation, two-tier tool design
- **Tech Stack**: TypeScript 5.x, Node.js 20+, pnpm, @modelcontextprotocol/sdk, zod, native fetch

---

## Scope Clarification

### Questions Asked

#### Question 1: Extended Tools Scope

**Context**: Phase defines many Extended tools (sonarr_rename, radarr_refresh, plex_collections, etc.) requiring additional API endpoints.

**Question**: Should I implement ALL extended tools listed, or focus on a prioritized subset?

**Options Presented**:
- A (Recommended): All extended tools from api-standards.md
- B: Prioritized subset (most valuable first)

**User Answer**: All extended tools, but extend existing codebase, not replace/change functionality. Goal is to make it better.

---

#### Question 2: Cleanup Workflow Design

**Context**: cleanup_analysis() is a cross-service orchestration tool aggregating Plex, Sonarr, and Radarr data.

**Question**: Should this be a single unified tool or separate chainable tools?

**Options Presented**:
- A (Recommended): Single unified tool - easier for Claude
- B: Separate chainable tools - more flexible

**User Answer**: Single unified tool (Recommended)

---

#### Question 3: Pagination Strategy

**Context**: Currently only limit exists. Adding offset enables resuming from position.

**Question**: Should offset be added to all list tools?

**Options Presented**:
- A (Recommended): Add offset to all list tools for consistent pagination
- B: Only high-volume tools

**User Answer**: Add to tv_list, movie_list, library_list, etc. Offset can be high since these are local services.

---

### Confirmed Understanding

**What the user wants to achieve**:
- Extend the existing MCP server with all Extended tier tools without changing existing functionality
- Add a unified cleanup_analysis() tool for comprehensive cleanup reporting
- Add offset-based pagination to all list tools for large library support
- Polish error messages and enhance the help system

**How it relates to existing code**:
- Add new methods to existing client classes (SonarrClient, RadarrClient, PlexClient, SabnzbdClient)
- Add new tool definitions alongside existing tools in each service's tools.ts
- Enhance existing system_health with verbose mode
- Expand existing media_help with comprehensive tool catalog
- Improve error messages in existing ArrsError classes

**Key constraints and requirements**:
- Must not change existing tool behavior - only add new capabilities
- Must follow existing patterns (error handling, pagination, tool structure)
- Must pass all constitution quality gates (TypeScript, ESLint, Prettier)
- Must include entity IDs in all list outputs
- Must default to safe behavior (HD by default for Radarr)

**Technical approach (if discussed)**:
- Extend existing clients with new API methods
- Add new Extended tools following established patterns
- Enhance system_health and media_help with additional options
- Add offset parameter to all list tools
- Create new cleanup_analysis cross-service tool

**User confirmed**: Yes - 2026-01-25

---

## Recommendations for SPECIFY

### Should Include in Spec

**Extended Tools**:
- Sonarr: sonarr_rename, sonarr_refresh, sonarr_upcoming (detailed)
- Radarr: radarr_rename, radarr_refresh, radarr_discover
- Plex: plex_collections, plex_duplicates, plex_optimize
- Sabnzbd: sabnzbd_quota, sabnzbd_warnings

**Unified Workflows**:
- cleanup_analysis() - comprehensive cleanup report across services
- Enhanced system_health({ verbose: true }) - detailed service info

**Pagination/Large Libraries**:
- Add offset parameter to all list tools
- Default limit of 100 items
- Summary mode for large result sets
- Warn when results exceed threshold

**Error Message Polish**:
- Context-specific error messages with next steps
- Include valid options when parameter is invalid
- Service-specific connection/auth error improvements

**Help System Enhancement**:
- Tool catalog by category
- Workflow examples
- Connected services status
- Topic-specific deep dives

### Should Exclude from Spec (Non-Goals)

- New services (Overseerr, Tautulli, etc.)
- Web UI
- Automated testing infrastructure
- CI/CD pipeline
- Changes to existing tool behavior

### Potential Risks

- Plex API may not support all planned operations (collections, duplicates, optimize)
- Some *arr API endpoints may require specific versions
- Large library operations may need careful pagination to avoid timeouts

### Questions to Address in CLARIFY

- None - all key questions resolved during discovery
