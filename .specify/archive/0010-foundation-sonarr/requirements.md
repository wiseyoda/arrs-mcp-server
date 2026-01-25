# Requirements Checklist: Foundation + Sonarr

**Purpose**: Track completion status of all functional and non-functional requirements
**Created**: 2025-01-24
**Feature**: [spec.md](./spec.md)

---

## Project Setup (FR-001 to FR-003)

- [ ] REQ001 TypeScript project with strict mode enabled
- [ ] REQ002 pnpm as package manager with package.json
- [ ] REQ003 ES modules output for Node.js 20+

## Configuration (FR-010 to FR-013)

- [ ] REQ010 Environment variable configuration loading
- [ ] REQ011 config.json fallback configuration
- [ ] REQ012 config.example.json template file
- [ ] REQ013 Configuration validation with clear error messages

## MCP Server (FR-020 to FR-023)

- [ ] REQ020 MCP protocol implementation with @modelcontextprotocol/sdk
- [ ] REQ021 Stdio transport for communication
- [ ] REQ022 No stdout usage except MCP protocol
- [ ] REQ023 Debug logging to stderr only

## TV Show Tools - Semantic (FR-030 to FR-034)

- [ ] REQ030 tv_search tool - search for TV series
- [ ] REQ031 tv_add tool - add TV series with options
- [ ] REQ032 tv_list tool - list all TV series
- [ ] REQ033 tv_episodes tool - show episode status
- [ ] REQ034 tv_search_missing tool - search for missing episodes

## TV Show Tools - Admin (FR-040 to FR-048)

- [ ] REQ040 sonarr_queue tool - download queue with progress
- [ ] REQ041 sonarr_details tool - detailed series info
- [ ] REQ042 sonarr_delete tool - remove series
- [ ] REQ043 sonarr_profiles tool - list quality profiles
- [ ] REQ044 sonarr_folders tool - list root folders
- [ ] REQ045 sonarr_stuck tool - identify stuck imports
- [ ] REQ046 sonarr_import tool - trigger manual import
- [ ] REQ047 sonarr_blacklist tool - blacklist with re-search
- [ ] REQ048 sonarr_calendar tool - upcoming episodes

## Cross-Service Tools (FR-050 to FR-052)

- [ ] REQ050 downloads_status tool - unified download status
- [ ] REQ051 system_health tool - service health check
- [ ] REQ052 media_help tool - system overview

## Error Handling (FR-060 to FR-062)

- [ ] REQ060 User-friendly error messages
- [ ] REQ061 Network timeout handling
- [ ] REQ062 Invalid API response handling

## Non-Functional Requirements

- [ ] NFR001 Stateless operation (no caching)
- [ ] NFR002 Native fetch for HTTP
- [ ] NFR003 Zod v3 for validation
- [ ] NFR004 Simple text output format
- [ ] NFR005 Startup under 2 seconds

---

## Notes

- Check items off as implemented: `[x]`
- Requirements map to FR-### IDs in spec.md
- Use `specflow mark` to track progress
