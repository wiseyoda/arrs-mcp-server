# Discovery: Foundation + Sonarr

**Phase**: `0010-foundation-sonarr`
**Created**: 2025-01-24
**Status**: Complete

## Phase Context

**Source**: ROADMAP.md Phase 1 / Phase definition file
**Goal**: Create a working MCP server with full Sonarr integration for managing TV shows through Claude

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| N/A | Greenfield project | No existing code - starting from scratch |

### Existing Patterns & Conventions

This is a greenfield project. Patterns are established by memory documents:

- **Service Module Pattern**: Each service (Sonarr, Radarr, etc.) gets its own directory under `src/services/` with `client.ts`, `types.ts`, and `tools.ts`
- **Two-Tier Tool Design**: Semantic tools (tv_search, tv_add) for common operations, service-specific tools (sonarr_queue, sonarr_stuck) for admin tasks
- **Configuration Priority**: Environment variables > config.json > defaults
- **Error Handling**: User-friendly messages to Claude, technical details to stderr

### Integration Points

- **MCP Protocol**: Server communicates via stdio with Claude Desktop and Claude Code
- **Sonarr v3 API**: RESTful API with X-Api-Key authentication
- **Future Services**: Plugin architecture allows Radarr, Plex, Sabnzbd in later phases

### Constraints Discovered

- **Stdout Reserved**: MCP protocol uses stdout for JSON-RPC messages - all logging must go to stderr
- **Zod v3 Required**: MCP SDK is incompatible with Zod v4.x, must use Zod ^3.25
- **Stateless Operation**: No caching or persistent state - each request is independent

---

## Requirements Sources

### From ROADMAP/Phase File

1. Create a working MCP server that connects to Claude Desktop and Claude Code
2. Implement configuration loading from JSON file and environment variables
3. Build Sonarr API client with proper error handling
4. Implement all Sonarr semantic tools (tv_search, tv_add, tv_list, tv_episodes, tv_search_missing)
5. Implement Sonarr admin tools (queue, details, delete, profiles, folders, stuck, import, blacklist, calendar)
6. Implement cross-service tools (downloads_status, system_health, media_help)
7. Create helpful documentation

### From Related Issues

No existing issues - first phase.

### From Previous Phase Handoffs

No previous phases - this is the foundation phase.

### From Memory Documents

- **Constitution**: Natural language first, safety by default, plugin architecture, stateless operation
- **Tech Stack**: TypeScript 5.x (strict), Node.js 20+ LTS, pnpm, @modelcontextprotocol/sdk, zod ^3.25, native fetch
- **Coding Standards**: kebab-case files, PascalCase classes, camelCase functions, 2-space indent, 100 char lines
- **API Standards**: Semantic tool names (tv_search), service-specific for admin (sonarr_queue)

---

## Scope Clarification

### Questions Asked

#### Question 1: HTTP Client Choice

**Context**: The memory documents approve native fetch, but some MCP servers use axios/got for retry logic.

**Question**: For the Sonarr API client, should we use the native Node.js fetch API or a library like got/axios?

**Options Presented**:
- A (Recommended): Native fetch - Built-in, no dependencies, lightweight
- B: got or axios - More features like automatic retries, interceptors

**User Answer**: Native fetch (Recommended)

**Research Done**: Native fetch in Node.js 20+ has all needed functionality. Manual retry can be added if needed.

---

#### Question 2: Output Format

**Context**: Tools return text content to Claude. Format affects readability and Claude's ability to process.

**Question**: When displaying TV show/episode lists to Claude, what format do you prefer?

**Options Presented**:
- A (Recommended): Simple text lists - Clean, readable
- B: JSON objects - Structured for programmatic processing
- C: Markdown tables - Formatted for larger datasets

**User Answer**: Simple text lists (Recommended)

---

### Confirmed Understanding

**What the user wants to achieve**:
An MCP server that enables Claude to manage a Sonarr TV library through natural language. Users should be able to search for shows, add them, view status, manage downloads, and troubleshoot issues like stuck imports.

**How it relates to existing code**:
Greenfield project - no existing integration needed. Future phases will add Radarr, Plex, and Sabnzbd following the same plugin pattern.

**Key constraints and requirements**:
- MCP protocol via stdio transport
- TypeScript with strict mode
- Native fetch for HTTP (no external HTTP libraries)
- Simple text output format for tool responses
- Environment variables for secrets, config.json for convenience
- Zod v3 for schema validation (not v4)

**Technical approach (if discussed)**:
- Single entry point that registers all tools
- Service module pattern (client/types/tools per service)
- Error handling returns user-friendly messages via tool response

**User confirmed**: Yes - 2025-01-24

---

## Recommendations for SPECIFY

### Should Include in Spec

- All 5 semantic tools (tv_search, tv_add, tv_list, tv_episodes, tv_search_missing)
- All 9 admin tools (queue, details, delete, profiles, folders, stuck, import, blacklist, calendar)
- All 3 cross-service tools (downloads_status, system_health, media_help)
- Configuration system with env var and JSON file support
- Documentation for Claude Desktop and Claude Code setup

### Should Exclude from Spec (Non-Goals)

- Radarr, Plex, Sabnzbd integration (Phase 2-4)
- Automated testing (manual testing only for MVP)
- Web UI or HTTP server mode
- Complex authentication beyond API keys
- Caching or state persistence

### Potential Risks

- **Sonarr API Changes**: Sonarr v3 API is stable but undocumented officially. May need to reference Sonarr source.
- **MCP SDK Updates**: SDK is evolving - may need adjustments if breaking changes occur.
- **Tool Count**: 17 tools is substantial - may need to prioritize if time constrained.

### Questions to Address in SPECIFY

- Exact parameter schemas for each tool (which are required vs optional)
- Error message format and content
- How to handle Sonarr connection failures gracefully
