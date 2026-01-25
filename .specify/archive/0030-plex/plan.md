# Implementation Plan: Plex Library Integration

**Branch**: `0030-plex` | **Date**: 2025-01-25 | **Spec**: [spec.md](spec.md)

## Summary

Implement Plex Media Server integration following the established service module pattern from Sonarr/Radarr. Create a `src/services/plex/` module with client, types, and tools. Provide 3 semantic tools for library operations and 5 admin tools for management tasks. Integrate Plex connectivity into the existing `system_health` tool.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @modelcontextprotocol/sdk, zod, native fetch
**Storage**: N/A (stateless, reads from Plex API)
**Testing**: Manual testing with Claude Desktop/Code
**Target Platform**: Node.js 20+ LTS
**Project Type**: MCP Server (single project)
**Performance Goals**: Sub-2s response for typical queries
**Constraints**: Stateless operation, stdout reserved for MCP protocol
**Scale/Scope**: 8 new tools, 1 service module, 1 integration point

## Constitution Check

_GATE: Must pass before implementation._

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Natural Language First | ✓ PASS | Semantic tool names (library_search, library_list) |
| II. Safety by Default | ✓ PASS | plex_delete requires confirm:true |
| III. Plugin Architecture | ✓ PASS | Separate src/services/plex/ directory |
| IV. Stateless Operation | ✓ PASS | No caching, each request independent |
| V. Two-Tier Tool Design | ✓ PASS | Semantic tools (3) + Admin tools (5) |

## Project Structure

### Documentation (this feature)

```text
specs/0030-plex/
├── discovery.md         # Codebase examination and POC results
├── spec.md              # Feature specification
├── plan.md              # This file
├── requirements.md      # Requirements checklist
├── tasks.md             # Task breakdown
└── checklists/
    ├── implementation.md
    └── verification.md
```

### Source Code (changes)

```text
src/services/plex/           # NEW: Plex service module
├── index.ts                 # Exports (client, types, registerPlexTools)
├── types.ts                 # TypeScript interfaces for Plex API
├── client.ts                # PlexClient class with API methods
└── tools.ts                 # MCP tool registrations (8 tools)

src/
├── index.ts                 # MODIFY: Register Plex tools conditionally
└── tools/
    └── system-health.ts     # MODIFY: Add Plex connectivity check
```

## Implementation Approach

### Phase 1: Foundation

1. Create `src/services/plex/types.ts` with Plex-specific interfaces
2. Create `src/services/plex/client.ts` with PlexClient class
3. Create `src/services/plex/index.ts` with exports

### Phase 2: Semantic Tools

4. Implement `library_list` - list all libraries
5. Implement `library_search` - cross-library search with filtering
6. Implement `library_watched` - watch status queries

### Phase 3: Admin Tools

7. Implement `plex_recent` - recently added content
8. Implement `plex_refresh` - trigger library scan
9. Implement `plex_unwatched` - cleanup candidates (unwatched)
10. Implement `plex_watched_old` - cleanup candidates (old watched)
11. Implement `plex_delete` - safe deletion with confirmation

### Phase 4: Integration

12. Register Plex tools in `src/index.ts`
13. Add Plex to `system_health` check

## Key Design Decisions

### Authentication

Use `X-Plex-Token` header (not query parameter) for all requests:
```typescript
headers: {
  "Accept": "application/json",
  "X-Plex-Token": config.token,
}
```

### Item Identification

Plex uses string `ratingKey` (not numeric IDs):
```typescript
interface PlexMediaItem {
  ratingKey: string;  // Primary identifier
  title: string;
  // ...
}
```

### Tool Input Types

Use `z.coerce.number()` for numeric parameters (MCP sends strings):
```typescript
days: z.coerce.number().optional().default(365)
```

Use `z.string()` for ratingKey:
```typescript
rating_key: z.string().describe("The ratingKey of the item to delete")
```

### Delete Safety

Two-level safety:
1. Require `confirm: true` parameter
2. Return error message explaining requirement if not provided

```typescript
if (!confirm) {
  return {
    content: [{ type: "text", text: "Delete requires confirmation. Use confirm: true to proceed." }],
    isError: true,
  };
}
```

### Output Formatting

Follow existing patterns:
- Include ID (ratingKey) in output for follow-up operations
- Format timestamps as human dates
- Show size in human-readable format (GB)
- Include library context for all results

Example:
```
Movies:
  [12345] Inception (2010) - 4.2 GB, Watched 3x (last: 2024-12-15)
```

## API Endpoints Used

| Endpoint | Tool(s) | Purpose |
|----------|---------|---------|
| `GET /` | system_health | Connectivity check |
| `GET /library/sections` | library_list | List libraries |
| `GET /library/sections/{id}/all` | library_search, library_watched | List items |
| `GET /hubs/search?query=X` | library_search | Cross-library search |
| `GET /library/sections/{id}/unwatched` | plex_unwatched | Unwatched items |
| `GET /library/sections/{id}/newest` | plex_recent | Recently added |
| `GET /library/sections/{id}/refresh` | plex_refresh | Trigger scan |
| `DELETE /library/metadata/{ratingKey}` | plex_delete | Delete item |

## Error Handling

Use shared error classes from `src/shared/errors.ts`:

| HTTP Status | Error Type | User Message |
|-------------|------------|--------------|
| 401 | ApiError | "Authentication failed. Check your Plex token." |
| 403 | ApiError | "Access denied. You may not have permissions." |
| 404 | ApiError | "Item not found in Plex library." |
| Network | NetworkError | "Cannot connect to Plex server. Verify URL and network." |

## Testing Strategy

Manual testing with Claude Desktop/Code:
1. Verify each tool works with real Plex server
2. Test error cases (invalid token, missing item)
3. Verify delete confirmation requirement
4. Check output formatting matches spec
