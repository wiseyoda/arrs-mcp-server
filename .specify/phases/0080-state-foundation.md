# Phase 0080: State & Analytics Foundation

**Status**: Not Started
**Branch**: `0080-state-foundation`
**Estimated Scope**: Large (database infrastructure, significant architectural addition)

---

## Goals

1. SQLite database for persistent state
2. Action audit log (every add/delete/approve tracked)
3. Undo capability for recent actions
4. Storage analytics (track library size over time)
5. Viewing analytics (watch patterns, completion rates)
6. Rule configuration storage (cleanup rules, preferences)
7. Taste profile persistence

---

## Scope

### In Scope

- SQLite database setup and schema
- Migration system for schema changes
- Audit log for all write operations
- Undo/rollback capability
- Storage metrics collection and trending
- Basic viewing analytics from Plex
- Configuration storage for rules
- Taste profile persistence from discovery phase

### Out of Scope

- External database (Postgres, MySQL)
- Real-time analytics streaming
- Multi-user state isolation
- Cloud backup/sync

---

## Deliverables

### 1. Database Infrastructure

```
src/database/
├── index.ts           # Database initialization
├── schema.ts          # Table definitions
├── migrations/        # Schema migrations
│   ├── 001-initial.ts
│   ├── 002-analytics.ts
│   └── ...
├── repositories/      # Data access layer
│   ├── audit-log.ts
│   ├── analytics.ts
│   ├── rules.ts
│   └── preferences.ts
└── types.ts           # Database types
```

### 2. Database Schema

**audit_log** - Track all actions
```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'add', 'delete', 'approve', 'deny', etc.
  service TEXT NOT NULL,          -- 'sonarr', 'radarr', 'overseerr', etc.
  entity_type TEXT NOT NULL,      -- 'movie', 'series', 'request', etc.
  entity_id TEXT NOT NULL,        -- Service-specific ID
  entity_name TEXT,               -- Human-readable name
  details TEXT,                   -- JSON with additional context
  reversible INTEGER DEFAULT 1,   -- Can this be undone?
  reversed INTEGER DEFAULT 0,     -- Has it been undone?
  reversed_at TEXT,               -- When was it undone?
  reversed_by TEXT                -- Reference to the undo action
);
```

**storage_metrics** - Track storage over time
```sql
CREATE TABLE storage_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  service TEXT NOT NULL,
  metric_type TEXT NOT NULL,      -- 'total_size', 'movie_count', etc.
  value REAL NOT NULL,
  unit TEXT                       -- 'bytes', 'count', etc.
);
```

**viewing_analytics** - Watch patterns
```sql
CREATE TABLE viewing_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  plex_rating_key TEXT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT NOT NULL,       -- 'movie', 'episode'
  action TEXT NOT NULL,           -- 'started', 'completed', 'stopped'
  duration_watched INTEGER,       -- seconds
  total_duration INTEGER          -- seconds
);
```

**rules** - Configured rules
```sql
CREATE TABLE rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,             -- 'cleanup', 'auto-approve', etc.
  conditions TEXT NOT NULL,       -- JSON conditions
  actions TEXT NOT NULL,          -- JSON actions
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  last_run TEXT,
  last_result TEXT                -- JSON result of last execution
);
```

**preferences** - User preferences
```sql
CREATE TABLE preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

**taste_profile** - Learned preferences
```sql
CREATE TABLE taste_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,         -- 'genre', 'director', 'actor', etc.
  value TEXT NOT NULL,            -- 'sci-fi', 'Denis Villeneuve', etc.
  score REAL NOT NULL,            -- Affinity score
  sample_count INTEGER DEFAULT 1,
  updated_at TEXT NOT NULL
);
```

### 3. Audit Log Tools

| Tool | Description |
|------|-------------|
| `history_list` | View recent actions with filtering |
| `history_details` | View details of a specific action |
| `history_undo` | Undo a reversible action |
| `history_stats` | Summary of actions over time |

### 4. Storage Analytics Tools

| Tool | Description |
|------|-------------|
| `storage_current` | Current storage usage by service |
| `storage_trend` | Storage growth over time |
| `storage_forecast` | Predict when storage will be full |
| `storage_record` | Manually trigger storage snapshot |

### 5. Viewing Analytics Tools

| Tool | Description |
|------|-------------|
| `viewing_recent` | Recently watched content |
| `viewing_stats` | Watch time statistics |
| `viewing_patterns` | Watch patterns (time of day, genres) |
| `viewing_incomplete` | Started but not finished |

### 6. Rule Management Tools

| Tool | Description |
|------|-------------|
| `rule_list` | List all configured rules |
| `rule_create` | Create a new rule |
| `rule_update` | Modify an existing rule |
| `rule_delete` | Remove a rule |
| `rule_preview` | Dry-run a rule (what would happen) |
| `rule_execute` | Execute a rule (with confirmation) |

### 7. Example Workflows

**Undo an accidental deletion:**
```typescript
// User: "Oops, I didn't mean to delete that movie"
history_list({ action: 'delete', limit: 5 })
// Response:
// Recent Delete Actions:
// [42] 2 minutes ago - Deleted "Inception" from Radarr (reversible)
// [38] 1 hour ago - Deleted "The Matrix" from Radarr (reversed)
// ...

history_undo({ action_id: 42 })
// Response:
// Undoing action #42: Delete "Inception"
// - Re-added "Inception" to Radarr (ID: 567)
// - Triggering search for files
// Action reversed successfully.
```

**Storage forecasting:**
```typescript
// User: "When will I run out of space?"
storage_forecast()
// Response:
// Storage Forecast
//
// Current Usage: 8.2 TB / 12 TB (68%)
// Free Space: 3.8 TB
//
// Growth Rate: 52 GB/week (avg over 30 days)
//
// Projections:
// - 80% full: ~6 weeks
// - 90% full: ~10 weeks
// - 100% full: ~14 weeks
//
// Recommendations:
// - Run cleanup_analysis() to find 525 GB of cleanup candidates
// - Consider removing unwatched movies older than 1 year
```

**Configure cleanup rule:**
```typescript
// User: "Set up a rule to flag movies I haven't watched in over a year"
rule_create({
  name: 'Old Unwatched Movies',
  type: 'cleanup',
  conditions: {
    media_type: 'movie',
    watched: false,
    added_days_ago: { gte: 365 }
  },
  actions: {
    flag_for_review: true,
    notify: true
  }
})
// Response:
// Rule created: "Old Unwatched Movies"
//
// When: Movie unwatched for 365+ days
// Then: Flag for review, send notification
//
// Use rule_preview({ rule_id: 1 }) to see what this would match.

rule_preview({ rule_id: 1 })
// Response:
// Rule Preview: "Old Unwatched Movies"
//
// Would match 23 movies (412 GB):
// - The Godfather Part II (456 days, 4.2 GB)
// - 2001: A Space Odyssey (398 days, 5.1 GB)
// ...
//
// Use rule_execute({ rule_id: 1 }) to apply this rule.
```

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Database | SQLite | No external deps, sufficient for single user |
| Location | `~/.arrs-mcp/data.db` | User data dir, not project dir |
| Migrations | Sequential numbered files | Simple, predictable |
| Undo depth | 30 days | Balance between utility and storage |
| Analytics interval | Daily snapshots | Sufficient granularity |
| Rule execution | Always confirm | No autonomous actions |

---

## Configuration

```json
{
  "database": {
    "path": "~/.arrs-mcp/data.db",
    "backupEnabled": true,
    "backupInterval": "daily"
  }
}
```

If no path specified, defaults to `~/.arrs-mcp/data.db`.

---

## Verification Gate

**Gate 8** - State Foundation:

- [ ] Database initializes correctly on first run
- [ ] Migrations run automatically
- [ ] Actions are logged to audit_log
- [ ] Undo works for movie additions
- [ ] Undo works for request approvals
- [ ] Storage metrics are collected
- [ ] Storage forecast is reasonable
- [ ] Rules can be created and previewed
- [ ] Rule execution requires confirmation
- [ ] Database survives restart

---

## Dependencies

- Phase 0070 (discovery-engine) should be complete
- All services must be updated to log actions

---

## Technical Notes

### SQLite Library

Use `better-sqlite3` for synchronous API:
```typescript
import Database from 'better-sqlite3';

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');  // Better concurrency
```

### Audit Log Integration

Every service tool that modifies state should call:
```typescript
import { auditLog } from '../database';

// After successful action
await auditLog.record({
  action: 'add',
  service: 'radarr',
  entityType: 'movie',
  entityId: movie.id.toString(),
  entityName: movie.title,
  details: { tmdbId: movie.tmdbId, quality: 'hd' },
  reversible: true
});
```

### Undo Implementation

For each action type, define a reversal:

| Action | Reversal |
|--------|----------|
| Add movie | Delete movie |
| Delete movie | Re-add movie (requires stored details) |
| Approve request | Deny request (if still pending in Sonarr/Radarr) |
| Deny request | Re-open request (limited) |

Some actions are not reversible (e.g., delete with files already removed).

### Storage Collection

Scheduled collection (or manual trigger):
```typescript
async function collectStorageMetrics() {
  const metrics = await Promise.all([
    radarrClient.getDiskSpace(),
    sonarrClient.getDiskSpace(),
    plexClient.getLibraryStats(),
  ]);

  await storageRepo.recordMetrics(metrics);
}
```

---

## Testing Checklist

- [ ] Fresh install creates database
- [ ] Existing database is migrated
- [ ] Audit log records all actions
- [ ] Undo reverses movie addition
- [ ] Undo fails gracefully for non-reversible
- [ ] Storage metrics accumulate over time
- [ ] Forecast calculation is reasonable
- [ ] Rules validate on creation
- [ ] Rule preview shows accurate matches
- [ ] Database file is portable (can backup/restore)
