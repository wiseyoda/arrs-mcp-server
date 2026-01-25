# Implementation Plan: Polish & Extended Features

**Branch**: `0050-polish-extended` | **Date**: 2026-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/0050-polish-extended/spec.md`

## Summary

Extend the arrs-mcp-server with all Extended tier tools (Sonarr rename/refresh/upcoming, Radarr rename/refresh/discover, Plex collections/duplicates/optimize, Sabnzbd quota/warnings), add a unified cleanup_analysis workflow tool, enhance system_health with verbose mode, expand media_help with comprehensive tool catalog, add offset-based pagination to all list tools, and polish error messages for better user experience.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @modelcontextprotocol/sdk, zod
**Storage**: N/A (stateless - all state in external services)
**Testing**: Vitest (optional - manual testing with Claude Desktop/Code)
**Target Platform**: Node.js 20+ LTS
**Project Type**: Single MCP server
**Performance Goals**: All operations complete within 30s timeout
**Constraints**: Must not break existing tool behavior, must follow established patterns
**Scale/Scope**: Support libraries with 1000+ items via pagination

## Constitution Check

_GATE: Must pass before implementation._

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Natural Language First | PASS | All new tools use semantic names |
| II. Safety by Default | PASS | 4K routing unchanged, delete ops require confirmation |
| III. Plugin Architecture | PASS | New tools added alongside existing in service folders |
| IV. Stateless Operation | PASS | No persistent state |
| V. Two-Tier Tool Design | PASS | Extended tools clearly marked as admin/troubleshooting |

**Quality Gates**:
- [ ] TypeScript compilation (`tsc --noEmit`)
- [ ] ESLint with no errors
- [ ] Prettier formatting
- [ ] No secrets in code
- [ ] Manual testing with Claude Desktop/Code

## Project Structure

### Documentation (this feature)

```text
specs/0050-polish-extended/
├── discovery.md          # Codebase findings and decisions
├── spec.md               # Feature specification
├── requirements.md       # Requirements checklist
├── plan.md               # This file
├── tasks.md              # Task breakdown
└── checklists/           # Implementation & verification
```

### Source Code (repository root)

```text
src/
├── services/
│   ├── sonarr/
│   │   ├── client.ts     # ADD: rename, refresh, upcoming methods
│   │   └── tools.ts      # ADD: sonarr_rename, sonarr_refresh, sonarr_upcoming tools
│   ├── radarr/
│   │   ├── client.ts     # ADD: rename, refresh, discover methods
│   │   └── tools.ts      # ADD: radarr_rename, radarr_refresh, radarr_discover tools
│   ├── plex/
│   │   ├── client.ts     # ADD: collections, duplicates, optimize methods
│   │   └── tools.ts      # ADD: plex_collections, plex_duplicates, plex_optimize tools
│   └── sabnzbd/
│       ├── client.ts     # ADD: quota, warnings methods
│       └── tools.ts      # ADD: sabnzbd_quota, sabnzbd_warnings tools
├── tools/
│   ├── system-health.ts  # MODIFY: Add verbose mode
│   ├── media-help.ts     # MODIFY: Expand with tool catalog
│   └── cleanup-analysis.ts # NEW: Cross-service cleanup workflow
├── shared/
│   └── errors.ts         # MODIFY: Enhance error messages
└── index.ts              # MODIFY: Register new tools
```

**Structure Decision**: Single project structure maintained. All changes extend existing files following established patterns.

## Implementation Approach

### Phase 1: Extended Sonarr Tools

**API Endpoints** (from Sonarr API v3):
- Rename: `POST /api/v3/command` with `name: "RenameSeries"` or `"RenameFiles"`
- Refresh: `POST /api/v3/command` with `name: "RefreshSeries"`
- Upcoming: `GET /api/v3/calendar` (already exists in client, enhance for detailed view)

**Pattern**: Follow existing `executeCommand` pattern in client.ts

### Phase 2: Extended Radarr Tools

**API Endpoints** (from Radarr API v3):
- Rename: `POST /api/v3/command` with `name: "RenameMovie"` or `"RenameFiles"`
- Refresh: `POST /api/v3/command` with `name: "RefreshMovie"`
- Discover: `GET /api/v3/importlist/movie` or `/movie/import` (recommendations from lists)

**Pattern**: Same as Sonarr, with quality routing for 4K

### Phase 3: Extended Plex Tools

**API Endpoints** (from Plex API):
- Collections: `GET /library/sections/{key}/collections`
- Duplicates: `GET /library/sections/{key}/all?duplicate=1`
- Optimize: `PUT /library/optimize?async=1`

**Pattern**: Follow existing Plex client patterns with X-Plex-Token auth

### Phase 4: Extended Sabnzbd Tools

**API Endpoints** (from Sabnzbd API):
- Quota: `?mode=queue&output=json` (includes quota info in response)
- Warnings: `?mode=warnings&output=json`

**Pattern**: Follow existing Sabnzbd API call pattern

### Phase 5: Cross-Service Cleanup Analysis

**Implementation**:
```typescript
async function cleanupAnalysis() {
  const [plexUnwatched, plexWatchedOld, plexDuplicates, sonarrEnded, sabnzbdFailed] =
    await Promise.all([
      getPlexUnwatched(365),
      getPlexWatchedOld(180),
      getPlexDuplicates(),
      getSonarrEndedSeries(),
      getSabnzbdFailed()
    ]);
  // Aggregate and calculate totals
}
```

### Phase 6: Pagination Enhancement

**Changes to all list tools**:
```typescript
// Before
limit: z.coerce.number().optional().default(20)

// After
limit: z.coerce.number().optional().default(100),
offset: z.coerce.number().optional().default(0),
summary: z.boolean().optional().default(false)
```

**Implementation**: Slice after fetch: `items.slice(offset, offset + limit)`

### Phase 7: Error Message Enhancement

**Update ArrsError subclasses**:
```typescript
class ApiError extends ArrsError {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody: string | null,
    public service: string,  // NEW: track which service
    public endpoint: string  // NEW: track which endpoint
  ) {}

  toUserMessage(): string {
    // Enhanced messages with service context and suggestions
  }
}
```

## API Notes

### Sonarr Command API
```typescript
// Execute command
POST /api/v3/command
{
  "name": "RefreshSeries",
  "seriesId": 123
}

// Response
{
  "id": 456,
  "name": "RefreshSeries",
  "status": "queued"
}
```

### Plex Collections API
```typescript
// Get collections for library
GET /library/sections/{sectionKey}/collections

// Response
{
  "MediaContainer": {
    "Metadata": [
      {
        "ratingKey": "12345",
        "title": "Marvel Movies",
        "childCount": "23"
      }
    ]
  }
}
```

### Sabnzbd Warnings API
```typescript
// Get warnings
GET /api?mode=warnings&apikey={key}&output=json

// Response
{
  "warnings": [
    "2024-01-25 10:30:00 - WARNING: Disk space low on /downloads"
  ]
}
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Plex collections API varies by version | Check for API existence, graceful fallback |
| Rename operations are destructive | Always report what will be renamed before executing |
| Large cleanup analysis may timeout | Use parallel execution, consider streaming results |
| Error message changes may break existing behavior | Preserve backward compatibility in toUserMessage() |
