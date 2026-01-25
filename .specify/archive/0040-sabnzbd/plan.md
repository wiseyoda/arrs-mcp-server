# Implementation Plan: Sabnzbd Downloads Integration

**Branch**: `0040-sabnzbd` | **Date**: 2026-01-25 | **Spec**: [spec.md](spec.md)

---

## Summary

Build a complete Sabnzbd MCP integration following the established service module pattern, providing semantic download tools (queue, history, pause, resume, speed) and admin tools (delete, failed, retry, priority, categories) with full integration into the existing downloads_status and system_health tools.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: `@modelcontextprotocol/sdk`, `zod`, native `fetch`
**Storage**: N/A (stateless)
**Testing**: Manual testing with Sabnzbd instance
**Target Platform**: Node.js 20+
**Project Type**: Single MCP server
**Constraints**: 30s HTTP timeout, query parameter authentication

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Natural Language First | PASS | Using semantic tool names (downloads_queue vs sabnzbd_get_queue) |
| Safety by Default | PASS | Destructive operations require explicit nzo_id parameter |
| Plugin Architecture | PASS | Service module in src/services/sabnzbd/ |
| Stateless Operation | PASS | No caching, all state in Sabnzbd |
| Two-Tier Tool Design | PASS | Semantic (downloads_*) + Admin (sabnzbd_*) tools |

---

## Project Structure

### Documentation (this feature)

```text
specs/0040-sabnzbd/
├── discovery.md         # Codebase findings
├── spec.md              # Feature specification
├── requirements.md      # Requirements checklist
├── plan.md              # This file
├── tasks.md             # Task breakdown
└── checklists/
    ├── implementation.md
    └── verification.md
```

### Source Code

```text
src/
├── services/
│   └── sabnzbd/
│       ├── client.ts    # API client with query param auth
│       ├── types.ts     # TypeScript interfaces
│       ├── tools.ts     # MCP tool registrations
│       └── index.ts     # Module exports
├── tools/
│   ├── downloads-status.ts  # Enhanced with Sabnzbd
│   └── system-health.ts     # Enhanced with Sabnzbd
└── shared/
    └── format.ts        # Shared formatting utilities (optional)
```

---

## Technical Decisions

### Sabnzbd API Client Pattern

Unlike Sonarr/Radarr which use header-based auth, Sabnzbd requires query parameter authentication:

```typescript
// Pattern for all Sabnzbd API calls
const url = `${baseUrl}/api?mode=${mode}&apikey=${apiKey}&output=json`;
```

**Implementation approach**: Create a custom request method in the client that appends auth params to every call.

### Type Handling

Sabnzbd returns many numbers as strings. Handle with:
- TypeScript interfaces reflect actual API response (strings)
- Parsing functions convert to numbers where needed
- `z.coerce.number()` in tool parameters (MCP passes all as strings anyway)

### Category-to-Source Mapping

```typescript
const CATEGORY_SOURCE_MAP: Record<string, string> = {
  'tv': 'Sonarr',
  'sonarr': 'Sonarr',
  'movies': 'Radarr',
  'radarr': 'Radarr',
  'movies-4k': 'Radarr4K',
  'radarr4k': 'Radarr4K',
};

function getSourceFromCategory(category: string): string {
  return CATEGORY_SOURCE_MAP[category.toLowerCase()] || 'unknown';
}
```

### Speed Formatting

```typescript
function formatSpeed(speed: string): string {
  // Input: "25.5 M" → Output: "25.5 MB/s"
  return speed.replace(' M', ' MB/s').replace(' K', ' KB/s').trim() || '0 KB/s';
}
```

### ETA Formatting

```typescript
function formatEta(timeleft: string): string {
  // Input: "2:30:45" → Output: "2h 30m"
  if (!timeleft || timeleft === '0:00:00') return 'unknown';
  const [h, m] = timeleft.split(':');
  return `${parseInt(h)}h ${parseInt(m)}m`;
}
```

---

## Integration Points

### downloads_status.ts Enhancement

Add Sabnzbd queue fetching after Radarr4K section:

```typescript
// Get Sabnzbd queue
if (config.sabnzbd) {
  try {
    const client = new SabnzbdClient(config.sabnzbd);
    const queue = await client.getQueue();

    for (const item of queue.slots) {
      const source = getSourceFromCategory(item.cat);
      downloads.push({
        title: item.filename,
        progress: parseInt(item.percentage) || 0,
        eta: formatEta(item.timeleft),
        status: item.status,
        source: `Sabnzbd [${source}]`,
      });
    }
  } catch (error) {
    issues.push(`Sabnzbd: ${formatErrorResponse(error)}`);
  }
}
```

### system_health.ts Enhancement

Add Sabnzbd health check:

```typescript
if (config.sabnzbd) {
  try {
    const client = new SabnzbdClient(config.sabnzbd);
    const status = await client.getServerStatus();

    const healthStatus = status.status === 'Paused' ? 'warning' : 'ok';
    const issues = status.status === 'Paused' ? ['Downloads paused'] : [];

    services.push({
      name: 'Sabnzbd',
      status: healthStatus,
      issues,
    });
  } catch (error) {
    services.push({
      name: 'Sabnzbd',
      status: 'error',
      issues: [formatErrorResponse(error)],
    });
  }
}
```

---

## Tool Reference

### Semantic Tools (5)

| Tool | Parameters | Returns |
|------|------------|---------|
| `downloads_queue` | none | Queue items with progress |
| `downloads_history` | `limit?: number` | Recent history items |
| `downloads_pause` | none | Confirmation message |
| `downloads_resume` | none | Confirmation with speed |
| `downloads_speed` | `speed?: number`, `unlimited?: boolean` | Confirmation |

### Admin Tools (7)

| Tool | Parameters | Returns |
|------|------------|---------|
| `sabnzbd_delete` | `nzo_id: string` | Confirmation with title |
| `sabnzbd_failed` | none | Failed items with errors |
| `sabnzbd_retry` | `nzo_id: string` | Confirmation |
| `sabnzbd_priority` | `nzo_id: string`, `position: 'top'|'bottom'|number` | Confirmation |
| `sabnzbd_pause_item` | `nzo_id: string` | Confirmation |
| `sabnzbd_resume_item` | `nzo_id: string` | Confirmation |
| `sabnzbd_categories` | none | Category list |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Sabnzbd API response variations | Defensive type handling, optional fields |
| Category naming varies by user | Case-insensitive matching, "unknown" fallback |
| Speed format parsing edge cases | Regex with fallback to "0 KB/s" |
| ETA unavailable when paused | Show "paused" status instead of ETA |
