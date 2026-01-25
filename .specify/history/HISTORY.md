# Completed Phases

> Archive of completed development phases. Newest first.

---

## 0010 - foundation-sonarr

**Completed**: 2026-01-25

# Phase 0010: Foundation + Sonarr

**Status**: Not Started
**Branch**: `0010-foundation-sonarr`
**Estimated Scope**: Medium (full MCP server setup + Sonarr integration)

---

## Goals

1. Create a working MCP server that connects to Claude Desktop and Claude Code
2. Implement configuration loading from JSON file and environment variables
3. Build Sonarr API client with proper error handling
4. Implement all Sonarr semantic tools (tv_search, tv_add, tv_list, tv_episodes, tv_search_missing)
5. Implement Sonarr admin tools (queue, details, delete, profiles, folders, stuck, import, blacklist, calendar)
6. Implement cross-service tools (downloads_status, system_health, media_help)
7. Create helpful documentation

---

## Scope

### In Scope

- TypeScript project setup with pnpm
- MCP SDK integration and stdio transport
- Configuration loading (config.json + env vars fallback)
- Sonarr v3 API client
- All Sonarr tools listed in ROADMAP Phase 1
- Cross-service utility tools
- Error handling with helpful messages
- README documentation

### Out of Scope

- Radarr, Plex, Sabnzbd (future phases)
- Web UI
- Authentication/authorization beyond API keys
- Automated testing (manual testing sufficient for MVP)

---

## Deliverables

1. **Project Setup**
   - `package.json` with dependencies
   - TypeScript configuration
   - Build scripts
   - `.gitignore`

2. **Configuration**
   - `config.example.json` template
   - Config loader supporting JSON + env vars
   - Type-safe config interface

3. **MCP Server**
   - Main server entry point
   - Tool registration
   - Error handling middleware

4. **Sonarr Integration**
   - `src/services/sonarr/client.ts` - API client
   - `src/services/sonarr/types.ts` - TypeScript types
   - `src/services/sonarr/tools.ts` - MCP tool definitions

5. **Cross-Service Tools**
   - `src/tools/downloads-status.ts`
   - `src/tools/system-health.ts`
   - `src/tools/media-help.ts`

6. **Documentation**
   - `README.md` with setup instructions
   - Claude Desktop configuration example
   - Claude Code configuration example

---

## Verification Gate

**USER GATE** - Requires user to verify:

- [ ] MCP server starts without errors (`pnpm start` or `node dist/index.js`)
- [ ] Works with Claude Desktop (add to config, restart, use tools)
- [ ] Works with Claude Code (add to settings, use tools)
- [ ] `tv_search` - Can search for a series by name
- [ ] `tv_add` - Can add a series with quality/monitor options
- [ ] `tv_list` - Can list all series with status
- [ ] `tv_episodes` - Can view episode status for a series
- [ ] `tv_search_missing` - Can trigger search for missing episodes
- [ ] `sonarr_queue` - Can see queue with progress, ETA, and errors
- [ ] `sonarr_stuck` - Can see and fix stuck imports
- [ ] `sonarr_blacklist` - Can blacklist release and re-search
- [ ] `system_health` - Health check reports issues correctly
- [ ] Error messages are helpful when things fail

---

## Dependencies

- None (first phase)

---

## Technical Notes

### MCP SDK Usage

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

### Sonarr API

- Base URL: `http://host:port/api/v3`
- Auth: `X-Api-Key` header
- Key endpoints:
  - `GET /series` - list all series
  - `POST /series` - add series
  - `GET /series/lookup?term=` - search
  - `GET /queue` - download queue
  - `GET /episode?seriesId=` - episodes for series
  - `POST /command` - trigger commands (search, import)

### Configuration Priority

1. Environment variables (for secrets)
2. `config.json` (for local dev)
3. Default values where sensible


---

