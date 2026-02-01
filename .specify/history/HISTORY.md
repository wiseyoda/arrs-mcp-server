# Completed Phases

> Archive of completed development phases. Newest first.

---

## 0100 - documentation

**Completed**: 2026-02-01

# Phase 0100: Documentation & Release Prep

**Status**: Not Started
**Branch**: `0100-documentation`
**Estimated Scope**: Medium (documentation, examples, polish)

---

## Goals

1. Complete README.md overhaul for public users
2. Tool catalog with examples for every tool
3. Configuration guide with all options
4. Troubleshooting guide for common issues
5. Example conversations showing real workflows
6. Project CLAUDE.md for agent development

---

## Scope

### In Scope

- README.md rewrite (quick start, full reference)
- Tool documentation with examples
- Configuration reference
- Troubleshooting guide
- Example conversation transcripts
- CLAUDE.md project instructions
- Error message consistency review

### Out of Scope

- API documentation generation (defer to Phase 0110)
- Video tutorials
- Blog posts or external documentation
- Localization

---

## Deliverables

### 1. README.md Overhaul

Structure:
```markdown
# arrs-mcp-server

MCP server for managing your media stack through Claude.

## Quick Start (5 minutes)

1. Clone and install
2. Copy config.example.json to config.json
3. Add your first service (Sonarr or Radarr)
4. Add to Claude Desktop/Code config
5. Test with "What's downloading?"

## Features

- TV show management (Sonarr)
- Movie management (Radarr, Radarr4k)
- Media library (Plex)
- Download management (Sabnzbd)
- Request management (Overseerr)
- Discovery (TMDB collections, trending)
- Library intelligence (consistency, cleanup)

## Configuration

[Link to detailed config guide]

## Tool Reference

[Link to tool catalog]

## Troubleshooting

[Link to troubleshooting guide]

## Examples

[Link to example conversations]
```

### 2. Tool Catalog (docs/tools.md)

Every tool documented with:
- Description
- Required providers
- Parameters
- Example usage
- Example output

```markdown
## tv_search

Search for TV shows to add to Sonarr.

**Requires**: Sonarr

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| query | string | Yes | Search term |

**Example**:
```
User: "Find Breaking Bad"
Tool: tv_search({ query: "Breaking Bad" })
```

**Output**:
```
TV Search Results (1 match)

[tvdb:81189] Breaking Bad (2008)
  Seasons: 5 | Episodes: 62
  Status: Ended
  Network: AMC
  Rating: 9.5

  A high school chemistry teacher turned meth manufacturer...

To add: tv_add({ tvdb_id: 81189 })
```
```

### 3. Configuration Guide (docs/configuration.md)

Complete reference:
```markdown
# Configuration Guide

## Overview

Configuration can be provided via:
1. Environment variables (recommended for secrets)
2. config.json file (convenient for development)

Environment variables take precedence over config.json.

## Minimal Setup

You only need ONE service to start. Add more as needed.

### Sonarr Only
```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "your-api-key"
  }
}
```

### Radarr Only
```json
{
  "radarr": {
    "url": "http://localhost:7878",
    "apiKey": "your-api-key"
  }
}
```

## Full Configuration

[All services with all options]

## Finding API Keys

### Sonarr/Radarr
Settings → General → API Key

### Plex
[Instructions for getting Plex token]

### Sabnzbd
Config → General → API Key

### Overseerr
Settings → General → API Key

### TMDB
1. Create account at themoviedb.org
2. Go to Settings → API
3. Request API key (free)

## Environment Variables

| Variable | Description |
|----------|-------------|
| SONARR_URL | Sonarr server URL |
| SONARR_API_KEY | Sonarr API key |
| RADARR_URL | Radarr server URL |
| ... | ... |
```

### 4. Troubleshooting Guide (docs/troubleshooting.md)

Common issues and solutions:
```markdown
# Troubleshooting

## Connection Issues

### "ECONNREFUSED" or "Cannot connect"

**Cause**: Server URL is incorrect or service is down.

**Fix**:
1. Verify the service is running
2. Check the URL in your config
3. Ensure no firewall blocking
4. Try accessing the URL in a browser

### "401 Unauthorized"

**Cause**: API key is incorrect.

**Fix**:
1. Regenerate API key in service settings
2. Update config.json or environment variable
3. Restart Claude Desktop/Code

## Tool Errors

### "Provider not configured"

**Cause**: The tool requires a service you haven't set up.

**Fix**:
1. Run providers_status() to see what's configured
2. Add the missing service to your config
3. Restart Claude Desktop/Code

### "No results found"

**Cause**: Search didn't match anything.

**Fix**:
1. Try a simpler search term
2. Check spelling
3. For movies, try including the year

## Performance Issues

### "Timeout" on large libraries

**Cause**: Too many items to process.

**Fix**:
1. Use pagination parameters (limit, offset)
2. Add filters to reduce results
3. Check if the service is overloaded

## Claude Desktop/Code Setup

### Tools not appearing

**Fix**:
1. Verify MCP server path in claude_desktop_config.json
2. Check that config.json exists and is valid JSON
3. Restart Claude Desktop completely
4. Check Claude Desktop logs for errors
```

### 5. Example Conversations (docs/examples.md)

Real workflow examples:
```markdown
# Example Conversations

## Adding a TV Show

**User**: Add Breaking Bad to my library

**Claude**: I'll search for Breaking Bad first.
[Calls tv_search({ query: "Breaking Bad" })]

Found Breaking Bad (2008) - 5 seasons, 62 episodes.
This is an ended series rated 9.5/10.

Would you like me to add it?

**User**: Yes

**Claude**: [Calls tv_add({ tvdb_id: 81189 })]

Added Breaking Bad to Sonarr. It will start downloading automatically.
You can check progress with "What's downloading?"

---

## Checking Download Status

**User**: What's downloading?

**Claude**: [Calls downloads_status()]

Currently downloading 3 items:

1. Breaking Bad S01E01 - Pilot
   Progress: 45% | ETA: 12 minutes | Speed: 15 MB/s

2. The Bear S03E01
   Progress: 78% | ETA: 4 minutes | Speed: 22 MB/s

3. Oppenheimer (2023)
   Progress: 12% | ETA: 45 minutes | Speed: 18 MB/s

---

## Finding What to Watch

**User**: What Marvel movies am I missing?

**Claude**: [Calls tmdb_collection({ id: 529892 })]
[Calls movie_list()]

You have 28 of 35 MCU movies. Missing:

1. The Marvels (2023) - Not in library
2. Guardians of the Galaxy Vol. 3 (2023) - Not in library
...

Would you like me to add any of these?

---

## Cleanup Workflow

**User**: I'm running low on space, what can I clean up?

**Claude**: [Calls cleanup_suggestions()]

I found some cleanup opportunities:

High confidence (safe to remove):
- 28 movies watched 180+ days ago (312 GB)
- 8 ended series fully watched (156 GB)

Would you like to see the details of either category?

**User**: Show me the old watched movies

**Claude**: [Calls cleanup_watched_old({ min_days: 180 })]

[Lists movies with watch dates and sizes]

These are all movies you've watched at least 6 months ago.
To remove any, I can use radarr_delete({ id: X, delete_files: true }).

Which ones would you like to remove?
```

### 6. Project CLAUDE.md

Instructions for agents working on this project:
```markdown
# arrs-mcp-server Development Guide

## Architecture

- `src/services/{provider}/` - One directory per service
- `src/providers/` - Cross-provider utilities
- `src/tools/` - System-level tools
- `src/shared/` - Shared utilities

## Adding a New Tool

1. Add to appropriate `tools.ts` file
2. Use zod for parameter validation
3. Format output for Claude readability
4. Include provider requirements in description

## Code Style

- Use `z.coerce.number()` for numeric params (MCP passes strings)
- Log to stderr only (stdout is MCP protocol)
- Return simple text responses (no JSON unless requested)
- Include actionable next steps in responses

## Testing

Manual testing with Claude Desktop/Code is primary.
Automated tests in Phase 0110.

## Common Patterns

[Provider client pattern, tool registration, error handling]
```

---

## Implementation Plan

1. **README.md** - Complete rewrite with quick start focus
2. **docs/tools.md** - Document all tools systematically
3. **docs/configuration.md** - Full config reference
4. **docs/troubleshooting.md** - Common issues
5. **docs/examples.md** - Real conversation examples
6. **CLAUDE.md** - Agent development guide
7. **Review pass** - Consistency check across all docs

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Location | docs/ folder | Keep README clean, details in docs |
| Format | Markdown | Works everywhere, version controlled |
| Examples | Conversation style | Shows real usage patterns |
| Tool docs | Generated from code? | Defer to Phase 0110 |

---

## Verification Gate

**Gate 10** - Documentation:

- [ ] README has working quick start (tested on clean setup)
- [ ] All tools documented with examples
- [ ] Configuration guide covers all services
- [ ] Troubleshooting covers top 10 issues
- [ ] Example conversations are realistic
- [ ] CLAUDE.md is useful for development
- [ ] No broken links
- [ ] No outdated information

---

## Dependencies

- Phase 0090 (library-intelligence) should be complete
- All tools implemented and stable

---

## Testing Checklist

- [ ] Quick start works from scratch
- [ ] Config examples are valid JSON
- [ ] Tool examples produce shown output
- [ ] Troubleshooting steps actually fix issues
- [ ] Links all work
- [ ] No typos in commands/paths


---

## 0090 - library-intelligence

**Completed**: 2026-01-26

# Phase 0090: Library Intelligence (Stateless)

**Status**: Not Started
**Branch**: `0090-library-intelligence`
**Estimated Scope**: Medium (cross-provider tools, no persistent state)

---

## Goals

1. Single flexible `library_audit` tool for all consistency/orphan/quality analysis
2. Batch `library_sync` tool to act on audit findings
3. Smart `space_planner` with scoring algorithm for cleanup decisions
4. Basic `watch_analytics` for viewing statistics
5. Enhance existing Plex cleanup tools (no duplicates)

---

## Scope

### In Scope

- Stateless consistency analysis via unified audit tool
- Orphan detection across all services
- Incomplete collection detection
- Quality routing validation (4K mismatches)
- Batch sync operations with confirmation
- Smart space planning with value scoring
- Basic watch analytics
- Enhancement of existing `plex_watched_old` and `plex_unwatched` tools
- Uses provider registry from Phase 0080

### Out of Scope

- Undo capability (stateless - no audit log)
- Persistent rules (no database)
- Automatic remediation (always manual confirmation)
- File-level operations (moving files between libraries)
- Advanced analytics (time-of-day, seasonal patterns)

---

## Deliverables

### 1. Library Audit Tool (Unified)

Single tool replaces 5+ separate tools from original design.

| Parameter | Description |
|-----------|-------------|
| `check: "all"` | Full consistency report (default) |
| `check: "orphans"` | Plex items not tracked in Sonarr/Radarr |
| `check: "missing"` | Sonarr/Radarr items not in Plex |
| `check: "downloads"` | Downloads that never imported |
| `check: "quality"` | 4K content in wrong Radarr instance |
| `check: "collections"` | Incomplete TMDB collections in library |
| `check: "ended"` | Ended/completed series for review |

**Requires**: Plex + (Sonarr or Radarr), varies by check type

**Example - Full audit:**
```
User: "Are my libraries in sync?"

library_audit()

Response:
Library Audit Report
====================

Plex ↔ Radarr Sync:
  Movies in both: 423
  In Plex only (orphans): 12
  In Radarr only (not imported): 5

Plex ↔ Sonarr Sync:
  Series in both: 156
  In Plex only (orphans): 3
  In Sonarr only (not imported): 2

Downloads:
  Completed but not imported: 4
  Failed imports: 2

Quality Routing:
  4K content in HD Radarr: 2
  HD content in 4K Radarr: 0

Collections:
  Incomplete collections found: 8
  Total missing movies: 23

Ended Series:
  Fully watched, ended: 12
  Potential cleanup: 156 GB

Run with specific check for details:
  library_audit(check: "orphans")
  library_audit(check: "collections")
```

**Example - Orphans detail:**
```
library_audit(check: "orphans")

Response:
Plex Orphans (15 items, 186.5 GB)

Movies (12):
  [plex:12345] Avatar (2009) - 4.2 GB - IMDB: tt0499549
  [plex:12346] Titanic (1997) - 3.8 GB - IMDB: tt0120338
  ...

TV Shows (3):
  [plex:23456] The Office (US) - 45.2 GB - TVDB: 73244
  ...

To sync these to Sonarr/Radarr:
  library_sync(type: "orphans", confirm: true)
```

**Example - Collections:**
```
library_audit(check: "collections")

Response:
Incomplete Collections (8 found)

Back to the Future Collection (2/3 movies)
  ✓ Back to the Future (1985)
  ✓ Back to the Future Part II (1989)
  ✗ Back to the Future Part III (1990) - TMDB: 196

The Matrix Collection (3/4 movies)
  ✓ The Matrix (1999)
  ✓ The Matrix Reloaded (2003)
  ✓ The Matrix Revolutions (2003)
  ✗ The Matrix Resurrections (2021) - TMDB: 624860

... (6 more collections)

Total missing: 23 movies
To add missing movies: Use movie_add() with TMDB IDs shown
```

### 2. Library Sync Tool (Batch Operations)

Batch operations with dry-run preview and explicit confirmation.

| Parameter | Description |
|-----------|-------------|
| `type: "orphans"` | Add Plex orphans to Sonarr/Radarr |
| `type: "collection"` | Add missing collection movies (requires collection_id) |
| `confirm: false` | Dry-run preview (default) |
| `confirm: true` | Execute the sync |
| `collection_id` | TMDB collection ID (for type: "collection") |

**Example - Sync orphans:**
```
User: "Add those orphans to Radarr"

library_sync(type: "orphans")

Response:
Sync Preview (dry-run)

Would add to Radarr (12 movies):
  Avatar (2009) - TMDB: 19995
  Titanic (1997) - TMDB: 597
  ... (10 more)

Would add to Sonarr (3 series):
  The Office (US) - TVDB: 73244
  ... (2 more)

To execute: library_sync(type: "orphans", confirm: true)
```

```
library_sync(type: "orphans", confirm: true)

Response:
Sync Complete

Added to Radarr: 12 movies
  ✓ Avatar (2009)
  ✓ Titanic (1997)
  ... (10 more)

Added to Sonarr: 3 series
  ✓ The Office (US)
  ... (2 more)

Failed: 0
```

### 3. Space Planner Tool

Smart cleanup recommendations with value scoring.

| Parameter | Description |
|-----------|-------------|
| `target_gb` | How much space to free (required) |
| `type` | Filter: "movies", "shows", "all" (default: "all") |
| `exclude_favorites` | Skip highly-rated content (default: true) |

**Scoring Algorithm:**
```
cleanup_score = (file_size_gb × days_since_watched) / (rating × rewatch_factor)

Where:
- file_size_gb: Size in GB (bigger = higher score)
- days_since_watched: Days since last watch (older = higher score)
- rating: IMDB/TMDB rating 1-10 (higher rating = lower score, keeps good content)
- rewatch_factor: 1.0 for movies, 0.5 for rewatchable genres (comedy, kids),
                  1.5 for one-time genres (documentary, thriller)
```

Higher score = better deletion candidate.

**Example:**
```
User: "I need 100GB free, what should I delete?"

space_planner(target_gb: 100)

Response:
Space Planner - Target: 100 GB
==============================

Recommended Deletions (sorted by cleanup score):

#1 [radarr:201] Geostorm (2017) - Score: 847
   Size: 12.3 GB | Watched: 412 days ago | Rating: 5.3
   Why: Large file, low rating, watched long ago

#2 [radarr:202] The Meg (2018) - Score: 623
   Size: 8.7 GB | Watched: 389 days ago | Rating: 5.7
   Why: Medium file, below-average rating, old watch

#3 [radarr:203] Rampage (2018) - Score: 589
   Size: 9.1 GB | Watched: 356 days ago | Rating: 6.1
   Why: Medium file, average rating, moderately old

... (more items)

Running total: 98.4 GB (8 items)
Next item would exceed target.

To delete: Use movie_delete(movie_id, delete_files: true) for each
⚠️ Deletions are permanent. Review carefully.
```

### 4. Watch Analytics Tool

Basic viewing statistics without being invasive.

| Parameter | Description |
|-----------|-------------|
| `period` | Time period: "month", "year", "all" (default: "year") |
| `type` | Filter: "movies", "shows", "all" (default: "all") |

**Example:**
```
watch_analytics()

Response:
Watch Analytics (Past Year)
===========================

Overview:
  Movies watched: 142
  TV episodes watched: 847
  Total watch time: ~312 hours

Most Watched Movies:
  1. The Shawshank Redemption (4 views)
  2. Inception (3 views)
  3. The Dark Knight (3 views)

Most Watched Shows:
  1. The Office - 234 episodes
  2. Friends - 156 episodes
  3. Breaking Bad - 62 episodes

Genre Breakdown (Movies):
  Action: 28% (40 movies)
  Comedy: 22% (31 movies)
  Drama: 18% (26 movies)
  Sci-Fi: 15% (21 movies)
  Other: 17% (24 movies)

Watch Frequency:
  Average: 2.7 movies/week
  Peak month: December (18 movies)
  Slowest month: June (8 movies)
```

### 5. Enhanced Existing Tools

**`plex_watched_old` enhancements:**
- Add `show_size: true` parameter for size totals
- Add `sort: "size"` option to find largest watched items
- Add `ended_only: true` filter for ended series
- Show running total of potential space savings

**`plex_unwatched` enhancements:**
- Add `show_size: true` parameter for size totals
- Add `show_rating: true` to help identify hidden gems
- Add `sort: "size"` option
- Show running total of potential space savings

---

## Matching Logic

### ID-Based Matching (Preferred)

```typescript
// Match by IMDB ID first, then TMDB/TVDB ID, then title+year
function matchMovie(plexMovie: PlexMovie, radarrMovie: RadarrMovie): boolean {
  // IMDB ID match (most reliable)
  if (plexMovie.imdbId && radarrMovie.imdbId) {
    return plexMovie.imdbId === radarrMovie.imdbId;
  }

  // TMDB ID match
  if (plexMovie.tmdbId && radarrMovie.tmdbId) {
    return plexMovie.tmdbId === radarrMovie.tmdbId;
  }

  // Fallback: title + year (fuzzy)
  return normalizeTitle(plexMovie.title) === normalizeTitle(radarrMovie.title)
    && Math.abs(plexMovie.year - radarrMovie.year) <= 1;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^the/, '');
}
```

### Performance Considerations

For large libraries (1000+ items):
1. Build indexes for O(1) lookups
2. Process in batches
3. Cache results during single audit run

```typescript
async function buildMatchIndex(movies: Movie[]): Promise<Map<string, Movie>> {
  const index = new Map<string, Movie>();
  for (const movie of movies) {
    if (movie.imdbId) index.set(`imdb:${movie.imdbId}`, movie);
    if (movie.tmdbId) index.set(`tmdb:${movie.tmdbId}`, movie);
    index.set(`title:${normalizeTitle(movie.title)}:${movie.year}`, movie);
  }
  return index;
}
```

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Single audit tool | `library_audit` with `check` param | Reduces tool count, easier discovery |
| Batch operations | `library_sync` with confirm | Actionable findings, not just reports |
| Space scoring | Formula-based | Objective, explainable recommendations |
| Analytics scope | Basic stats only | Useful without being creepy |
| Existing tools | Enhance, don't duplicate | Avoid confusion, maintain consistency |
| State | Stateless | No database, no sync issues |
| Undo | Not supported | Explicit confirmation is safer |

---

## Verification Gate

**Gate 9** - Library Intelligence:

- [ ] `library_audit()` shows accurate full report
- [ ] `library_audit(check: "orphans")` finds known orphan content
- [ ] `library_audit(check: "missing")` finds content not in Plex
- [ ] `library_audit(check: "downloads")` finds stuck downloads
- [ ] `library_audit(check: "quality")` detects misrouted 4K content
- [ ] `library_audit(check: "collections")` finds incomplete collections
- [ ] `library_sync(type: "orphans")` preview is accurate
- [ ] `library_sync(type: "orphans", confirm: true)` adds items correctly
- [ ] `space_planner` scoring produces sensible rankings
- [ ] `watch_analytics` stats are accurate
- [ ] Enhanced `plex_watched_old` shows size totals
- [ ] Enhanced `plex_unwatched` shows size and rating
- [ ] Tools error clearly when required providers missing
- [ ] Large library performance acceptable (1000+ items < 30s)

---

## Dependencies

- Phase 0080 (provider-cleanup) must be complete ✓
- Provider registry available ✓
- Cross-provider utilities available ✓

---

## Testing Checklist

- [ ] Test `library_audit` with known orphans
- [ ] Test `library_audit` with clean library (no issues)
- [ ] Test `library_audit(check: "collections")` accuracy
- [ ] Test `library_sync` dry-run vs confirm behavior
- [ ] Test `space_planner` scoring logic
- [ ] Test `watch_analytics` with various watch histories
- [ ] Test enhanced Plex tools with size/rating display
- [ ] Test with empty libraries (graceful handling)
- [ ] Test with large libraries (performance)
- [ ] Test with missing providers (clear error messages)


---

## 0080 - provider-cleanup

**Completed**: 2026-01-25

# Phase 0080: Provider Cleanup & Hardening

**Status**: Not Started
**Branch**: `0080-provider-cleanup`
**Estimated Scope**: Medium (refactoring, audit, new discovery tools)

---

## Goals

1. Formalize conditional provider registration (presence-based)
2. Create provider discovery tool for Claude
3. Build cross-provider utility foundation for Phase 0090
4. Audit and harden all existing providers
5. Improve error messages for missing/misconfigured providers

---

## Scope

### In Scope

- Provider registry abstraction
- `providers_status` discovery tool
- Cross-provider utility module
- Per-provider API audit and improvements
- Error handling improvements
- Tool description updates for provider dependencies

### Out of Scope

- New providers (covered in future phases)
- Database or persistent state
- Breaking changes to existing tool interfaces

---

## Deliverables

### 1. Provider Registry

Create a centralized provider registry that tracks which providers are configured:

```typescript
// src/providers/registry.ts
export interface ProviderStatus {
  name: string;
  configured: boolean;
  capabilities: string[];  // e.g., ['search', 'add', 'delete', 'queue']
}

export interface ProviderRegistry {
  isConfigured(provider: string): boolean;
  getConfigured(): string[];
  getMissing(): string[];
  getStatus(): ProviderStatus[];
  requireProviders(...providers: string[]): void;  // throws if missing
}
```

### 2. Provider Discovery Tool

| Tool | Description |
|------|-------------|
| `providers_status` | List configured and missing providers with their capabilities |

**Example output:**
```
Provider Status

Configured:
  ✓ Sonarr - TV show management (search, add, list, queue, calendar)
  ✓ Radarr - Movie management (search, add, list, queue)
  ✓ Radarr4k - 4K movie management (search, add, list, queue)
  ✓ Plex - Media library (search, watch status, recently added)
  ✓ Sabnzbd - Download client (queue, history, pause/resume)
  ✓ TMDB - Movie/TV database (search, details, collections, trending)

Not Configured:
  ✗ Overseerr - Request management
    → Configure with OVERSEERR_URL and OVERSEERR_API_KEY

Cross-Provider Features:
  ✓ Library Intelligence (requires: Plex + Sonarr/Radarr)
  ✗ Request Workflow (requires: Overseerr)
```

### 3. Cross-Provider Utilities

Foundation for Phase 0090's library intelligence:

```typescript
// src/providers/cross-provider.ts
export function requireProviders(
  registry: ProviderRegistry,
  ...providers: string[]
): void {
  const missing = providers.filter(p => !registry.isConfigured(p));
  if (missing.length > 0) {
    throw new ProviderNotConfiguredError(missing);
  }
}

export function getAvailableMediaProviders(registry: ProviderRegistry): string[] {
  return ['sonarr', 'radarr', 'radarr4k', 'plex']
    .filter(p => registry.isConfigured(p));
}
```

### 4. Provider Audit & Hardening

Audit each provider for improvements:

#### Sonarr
| Area | Current | Improvement |
|------|---------|-------------|
| Episode details | Basic info | Add file quality, size, release group |
| Calendar | Date range | Add download status for upcoming |
| Queue | Basic status | Add ETA, progress percentage |
| Series | Core fields | Add ratings, network, certification |

#### Radarr
| Area | Current | Improvement |
|------|---------|-------------|
| Movie details | Basic info | Add file quality, size, audio format |
| Queue | Basic status | Add ETA, progress percentage |
| Collection | Not exposed | Add collection membership info |
| Credits | Not exposed | Add director/cast for recommendations |

#### Plex
| Area | Current | Improvement |
|------|---------|-------------|
| Watch history | Basic | Add watch count, last watched date |
| On Deck | Not exposed | Add continue watching list |
| Collections | Not exposed | Add Plex collection support |
| Audio/Subtitle | Not exposed | Add track info for quality assessment |

#### Sabnzbd
| Area | Current | Improvement |
|------|---------|-------------|
| Queue items | Basic | Add category, priority, post-processing |
| History | Basic | Add failure reason details |
| Server stats | Not exposed | Add connection status, bandwidth |

#### Overseerr
| Area | Current | Improvement |
|------|---------|-------------|
| Request details | Basic | Add requester quota usage |
| Media info | Basic | Add availability per quality |

#### TMDB
| Area | Current | Improvement |
|------|---------|-------------|
| Credits | Not exposed | Add for recommendation context |
| Keywords | Not exposed | Add for better discovery |
| Watch providers | Not exposed | Add streaming availability |

### 5. Error Message Improvements

**Current:**
```
Error: Cannot read property 'url' of undefined
```

**Improved:**
```
Overseerr is not configured. This tool requires Overseerr.

To configure Overseerr, add to config.json:
{
  "overseerr": {
    "url": "http://your-overseerr:5055",
    "apiKey": "your-api-key"
  }
}

Or set environment variables:
  OVERSEERR_URL=http://your-overseerr:5055
  OVERSEERR_API_KEY=your-api-key
```

### 6. Tool Description Updates

Update tool descriptions to indicate provider dependencies:

```typescript
server.tool(
  "consistency_check",
  "Check library consistency across services. " +
    "Requires: Plex + (Sonarr or Radarr)",
  { /* params */ },
  async (params) => { /* ... */ }
);
```

---

## Implementation Plan

### Step 1: Provider Registry
1. Create `src/providers/registry.ts`
2. Create `src/providers/types.ts`
3. Create `src/providers/errors.ts`
4. Update `src/index.ts` to build registry at startup

### Step 2: Discovery Tool
1. Add `providers_status` to system tools
2. Format output for Claude readability
3. Include configuration hints for missing providers

### Step 3: Provider Audit
For each provider:
1. Review API documentation for unused endpoints
2. Check response types for unused fields
3. Add new fields to types
4. Update client methods
5. Update tool outputs

### Step 4: Error Handling
1. Create `ProviderNotConfiguredError`
2. Update all tools to use registry checks
3. Improve error message formatting

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Registration | Presence-based | Already working, no config change needed |
| Registry pattern | Singleton at startup | Simple, no runtime overhead |
| Capability list | Static per provider | Avoids runtime API checks |
| Audit scope | Useful fields only | Don't expose everything, just what helps |

---

## Verification Gate

**Gate 8** - Provider Cleanup:

- [ ] `providers_status` shows all configured providers
- [ ] `providers_status` shows helpful hints for missing providers
- [ ] Cross-provider tools fail gracefully with clear message
- [ ] At least 3 improvements per major provider (Sonarr, Radarr, Plex)
- [ ] Error messages include configuration instructions
- [ ] Tool descriptions mention provider requirements
- [ ] Server starts with minimal config (single provider)
- [ ] All existing tests still pass

---

## Dependencies

- Phase 0070 (discovery-engine) complete
- No external dependencies

---

## Testing Checklist

- [ ] Server starts with only Sonarr configured
- [ ] Server starts with only Plex configured
- [ ] `providers_status` accurate for partial config
- [ ] Cross-provider tools error clearly when provider missing
- [ ] New provider fields appear in tool outputs
- [ ] Error messages are actionable


---

## 0070 - discovery-engine

**Completed**: 2026-01-25

# Phase 0070: Discovery & Recommendations Engine

**Status**: Not Started
**Branch**: `0070-discovery-engine`
**Estimated Scope**: Large (multiple external API integrations)

---

## Goals

1. TMDB integration for trending, popular, and recommendations
2. Trakt integration for personal lists, community lists, and history
3. Letterboxd integration for curated film lists
4. Collection completion ("You have 4 MCU movies, here are the 28 missing")
5. Personal taste profiles based on watch history and ratings
6. Cross-reference external lists with existing library

---

## Scope

### In Scope

- New service: `src/services/tmdb/`
- New service: `src/services/trakt/`
- New service: `src/services/letterboxd/`
- Collection/franchise detection and completion
- "What's missing from X" workflows
- Bulk add from external lists
- Personal recommendation engine

### Out of Scope

- Automatic additions (always require confirmation)
- Syncing watch history TO external services (read-only)
- Premium Trakt features requiring VIP subscription
- Letterboxd authentication (public lists only initially)

---

## Deliverables

### 1. Service Structure

```
src/services/tmdb/
├── client.ts      # TMDB API client
├── types.ts       # TypeScript interfaces
├── tools.ts       # MCP tool registrations
└── index.ts       # Exports

src/services/trakt/
├── client.ts      # Trakt API client
├── types.ts       # TypeScript interfaces
├── tools.ts       # MCP tool registrations
└── index.ts       # Exports

src/services/letterboxd/
├── client.ts      # Letterboxd scraper/API client
├── types.ts       # TypeScript interfaces
├── tools.ts       # MCP tool registrations
└── index.ts       # Exports
```

### 2. TMDB Tools

| Tool | Description |
|------|-------------|
| `tmdb_trending` | Trending movies/TV today or this week |
| `tmdb_popular` | Popular content by type |
| `tmdb_upcoming` | Upcoming theatrical releases |
| `tmdb_recommendations` | Based on a specific movie/show |
| `tmdb_similar` | Find similar content |
| `tmdb_collection` | Get full collection (MCU, Fast & Furious, etc.) |

### 3. Trakt Tools

| Tool | Description |
|------|-------------|
| `trakt_trending` | Trending content on Trakt |
| `trakt_popular` | Most popular by type and time period |
| `trakt_list` | Import a specific Trakt list |
| `trakt_user_lists` | Browse user's public lists |
| `trakt_community_lists` | Popular community lists |
| `trakt_anticipated` | Most anticipated upcoming |

### 4. Letterboxd Tools

| Tool | Description |
|------|-------------|
| `letterboxd_list` | Import a Letterboxd list by URL |
| `letterboxd_popular_lists` | Popular/featured lists |
| `letterboxd_film_info` | Details about a specific film |

### 5. Collection Completion Tools

| Tool | Description |
|------|-------------|
| `collection_status` | Check completion status of a collection |
| `collection_missing` | List missing items from a collection |
| `collection_add_missing` | Add all missing items (with confirmation) |

### 6. Smart Recommendation Tools

| Tool | Description |
|------|-------------|
| `recommend_movies` | Personalized movie recommendations |
| `recommend_shows` | Personalized TV recommendations |
| `taste_profile` | View/analyze taste profile |

### 7. Example Workflows

**Collection completion:**
```typescript
// User: "What Marvel movies am I missing?"
collection_missing({ collection: 'marvel-cinematic-universe' })
// Response:
// Marvel Cinematic Universe - You have 24/32 movies
//
// Missing (8):
// [tmdb:505642] Black Panther: Wakanda Forever (2022)
// [tmdb:640146] Ant-Man and the Wasp: Quantumania (2023)
// [tmdb:447365] Guardians of the Galaxy Vol. 3 (2023)
// [tmdb:609681] The Marvels (2023)
// ...
//
// Would you like to add these to Radarr?

// User: "Yes, add them all"
collection_add_missing({ collection: 'marvel-cinematic-universe', confirm: true })
// Response:
// Added 8 movies to Radarr:
// - Black Panther: Wakanda Forever (searching)
// - Ant-Man and the Wasp: Quantumania (searching)
// ...
```

**Import Trakt list:**
```typescript
// User: "Import the 'Best Horror Movies of 2024' list from Trakt"
trakt_list({ url: 'https://trakt.tv/users/x/lists/best-horror-2024' })
// Response:
// List: Best Horror Movies of 2024 (45 items)
//
// Already in library: 12
// Not in library: 33
//
// Top missing items:
// [tmdb:1234] Longlegs (2024) - 8.2 rating
// [tmdb:2345] A Quiet Place: Day One (2024) - 7.8 rating
// ...
//
// Use collection_add_missing({ source: 'trakt', list_id: 'xyz' }) to add all missing.
```

**Personal recommendations:**
```typescript
// User: "What movies would I like based on my watch history?"
recommend_movies({ limit: 10 })
// Response:
// Based on your taste profile (loves: sci-fi, thriller, director: Denis Villeneuve):
//
// High Confidence:
// [tmdb:438631] Dune (2021) - 8.0 - Sci-fi epic you'd love
// [tmdb:76600] Avatar: The Way of Water (2022) - Visual spectacle
//
// Worth Trying:
// [tmdb:346698] Barbie (2023) - Surprising depth, great reviews
// ...
//
// Note: Analysis based on your Plex watch history and ratings.
```

---

## API Integrations

### TMDB API (v3)

**Base URL**: `https://api.themoviedb.org/3`
**Auth**: API key as query param or bearer token

Key endpoints:
- `/trending/{media_type}/{time_window}` - Trending
- `/movie/popular`, `/tv/popular` - Popular
- `/movie/upcoming` - Upcoming theatrical
- `/movie/{id}/recommendations` - Recommendations
- `/movie/{id}/similar` - Similar content
- `/collection/{id}` - Full collection details

### Trakt API (v2)

**Base URL**: `https://api.trakt.tv`
**Auth**: Client ID header + optional OAuth for user data

Key endpoints:
- `/movies/trending`, `/shows/trending` - Trending
- `/movies/popular`, `/shows/popular` - Popular
- `/users/{id}/lists/{list_id}/items` - List items
- `/movies/anticipated`, `/shows/anticipated` - Anticipated
- `/lists/popular` - Popular community lists

### Letterboxd

**Note**: Letterboxd has no official public API. Options:
1. Use their RSS feeds for public lists
2. Web scraping (with rate limiting)
3. Third-party APIs if available

We'll start with RSS feeds for lists and basic scraping for film info.

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| TMDB as primary | TMDB for metadata, IDs | Industry standard, free tier generous |
| Trakt for lists | Lists and community features | Best list ecosystem |
| Letterboxd read-only | No auth, public lists only | Simpler, respects their terms |
| Confirmation required | Never auto-add | User always in control |
| Taste profile | Analyze Plex watch history | Leverage existing data |
| Collection matching | By TMDB collection ID | Most accurate |

---

## Configuration

```json
{
  "tmdb": {
    "apiKey": "your-tmdb-api-key"
  },
  "trakt": {
    "clientId": "your-trakt-client-id",
    "clientSecret": "optional-for-user-auth"
  }
}
```

**Note**: Letterboxd doesn't require API key for public data.

---

## Verification Gate

**Gate 7** - Discovery Engine:

- [ ] TMDB trending returns valid results
- [ ] TMDB collection lookup works (test with MCU)
- [ ] Trakt list import works
- [ ] Collection completion shows correct missing items
- [ ] Can add missing collection items to Radarr
- [ ] Personal recommendations consider watch history
- [ ] Cross-references correctly identify what's already in library
- [ ] Error handling for rate limits, invalid lists

---

## Dependencies

- Phase 0060 (overseerr) should be complete
- TMDB API key (free tier)
- Trakt API application created
- Plex integration working (for taste analysis)

---

## Technical Notes

### Rate Limiting

| Service | Limit | Strategy |
|---------|-------|----------|
| TMDB | 40 req/10s | Simple delay, no retry |
| Trakt | 1000 req/5min | Track and backoff |
| Letterboxd | Respect robots.txt | 1 req/second max |

### ID Mapping

Challenge: Different services use different IDs.
- TMDB uses tmdb_id
- Trakt uses trakt_id, imdb_id, tmdb_id
- Letterboxd uses letterboxd slug, has tmdb_id

Solution: Normalize to TMDB ID for library matching.

### Collection Detection

TMDB provides collection info in movie details:
```json
{
  "belongs_to_collection": {
    "id": 86311,
    "name": "The Avengers Collection"
  }
}
```

We can use this to offer collection completion.

---

## Testing Checklist

- [ ] TMDB API key works
- [ ] Trakt client ID works
- [ ] Trending endpoints return data
- [ ] Collection lookup finds MCU movies
- [ ] Collection missing correctly identifies gaps
- [ ] Trakt list import parses correctly
- [ ] Library cross-reference accurate
- [ ] Rate limiting doesn't cause failures
- [ ] Graceful degradation if service unavailable


---

## 0060 - overseerr

**Completed**: 2026-01-25

# Phase 0060: Overseerr Integration

**Status**: Not Started
**Branch**: `0060-overseerr`
**Estimated Scope**: Large (new service with full API coverage)

---

## Goals

1. Full request lifecycle management (view, approve, deny, delete)
2. User management (list users, view history, quotas)
3. Issue tracking (view and respond to reported issues)
4. Discovery features (trending, popular, recommendations via Overseerr)
5. Auto-approval rule configuration
6. Settings visibility and management

---

## Scope

### In Scope

- New service: `src/services/overseerr/`
- Full Overseerr API client
- Request management tools (semantic + admin)
- User management tools
- Issue management tools
- Discovery/trending tools
- Integration with existing Sonarr/Radarr workflows

### Out of Scope

- Jellyseerr (Overseerr fork) - different API nuances
- Direct Plex authentication through Overseerr
- Custom notification configurations (use existing Overseerr settings)

---

## Deliverables

### 1. Service Structure

```
src/services/overseerr/
├── client.ts      # Overseerr API client
├── types.ts       # TypeScript interfaces
├── tools.ts       # MCP tool registrations
└── index.ts       # Exports
```

### 2. Request Management Tools

**Semantic Tools (User-Facing):**

| Tool | Description |
|------|-------------|
| `request_list` | List all requests with filtering (status, type, user) |
| `request_approve` | Approve a pending request |
| `request_deny` | Deny a request with optional reason |
| `request_status` | Check status of a specific request |

**Admin Tools:**

| Tool | Description |
|------|-------------|
| `overseerr_request_details` | Full details of a request |
| `overseerr_request_delete` | Delete a request |
| `overseerr_request_retry` | Retry a failed request |

### 3. User Management Tools

| Tool | Description |
|------|-------------|
| `overseerr_users` | List all Overseerr users |
| `overseerr_user_requests` | View requests by specific user |
| `overseerr_user_quota` | Check user's request quota and limits |

### 4. Issue Management Tools

| Tool | Description |
|------|-------------|
| `overseerr_issues` | List reported issues |
| `overseerr_issue_details` | View issue details |
| `overseerr_issue_comment` | Add comment to an issue |
| `overseerr_issue_resolve` | Mark issue as resolved |

### 5. Discovery Tools

| Tool | Description |
|------|-------------|
| `overseerr_trending` | Trending movies and TV shows |
| `overseerr_popular` | Popular content |
| `overseerr_upcoming` | Upcoming releases |
| `overseerr_discover` | Personalized recommendations |

### 6. Example Workflows

**Approve a request:**
```typescript
// User: "What requests are pending?"
request_list({ status: 'pending' })
// Response:
// Pending Requests (3):
// [1234] Movie: Dune Part 3 - Requested by john_doe (2 days ago)
// [1235] TV: The Last of Us S2 - Requested by jane_smith (1 day ago)
// [1236] Movie: Oppenheimer - Requested by john_doe (3 hours ago)

// User: "Approve Dune"
request_approve({ request_id: 1234 })
// Response:
// Request #1234 approved.
// Dune Part 3 has been sent to Radarr for download.
```

**Check user activity:**
```typescript
// User: "What has john_doe requested lately?"
overseerr_user_requests({ username: 'john_doe', limit: 10 })
// Response:
// john_doe's Recent Requests:
// [1234] Dune Part 3 - Approved (downloading)
// [1236] Oppenheimer - Pending
// [1200] Barbie - Available (completed 5 days ago)
```

---

## API Endpoints to Implement

### Requests
- `GET /api/v1/request` - List requests
- `GET /api/v1/request/:id` - Get request details
- `POST /api/v1/request/:id/approve` - Approve request
- `POST /api/v1/request/:id/decline` - Decline request
- `DELETE /api/v1/request/:id` - Delete request
- `POST /api/v1/request/:id/retry` - Retry request

### Users
- `GET /api/v1/user` - List users
- `GET /api/v1/user/:id` - Get user details
- `GET /api/v1/user/:id/requests` - User's requests
- `GET /api/v1/user/:id/quota` - User's quota

### Issues
- `GET /api/v1/issue` - List issues
- `GET /api/v1/issue/:id` - Get issue details
- `POST /api/v1/issue/:id/comment` - Add comment
- `POST /api/v1/issue/:id/status` - Update status

### Discovery
- `GET /api/v1/discover/movies` - Discover movies
- `GET /api/v1/discover/tv` - Discover TV
- `GET /api/v1/discover/trending` - Trending content
- `GET /api/v1/discover/movies/upcoming` - Upcoming movies

### Settings (Read-only for now)
- `GET /api/v1/settings/main` - Main settings
- `GET /api/v1/status` - System status

---

## Design Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Request confirmation | Always confirm approve/deny | Safety - prevent accidental approvals |
| User lookup | By username or ID | Flexibility in conversation |
| Discovery integration | Via Overseerr's APIs | Leverages existing TMDB integration |
| Auto-approval rules | Store in config, execute on-demand | No autonomous actions per user preference |

---

## Verification Gate

**Gate 6** - Overseerr Integration:

- [ ] Can list pending requests
- [ ] Can approve a request (sends to Sonarr/Radarr)
- [ ] Can deny a request with reason
- [ ] Can view user list and their request history
- [ ] Can view reported issues
- [ ] Trending/discovery tools return valid results
- [ ] Error handling works (invalid request ID, user not found)
- [ ] Works with both movies and TV requests

---

## Dependencies

- Phase 0050 (polish-extended) must be complete
- Overseerr instance configured and accessible
- Overseerr API key available

---

## Technical Notes

### Authentication

Overseerr uses API key authentication via header:
```typescript
headers: {
  'X-Api-Key': config.overseerr.apiKey,
  'Content-Type': 'application/json'
}
```

### Request Types

Overseerr requests can be:
- Movie requests (type: 'movie')
- TV requests (type: 'tv')

TV requests may be for specific seasons or full series.

### Status Values

Request statuses:
- `1` = Pending
- `2` = Approved
- `3` = Declined
- `4` = Available (completed)

### Integration with Sonarr/Radarr

When a request is approved, Overseerr automatically:
1. Adds to Sonarr/Radarr
2. Starts search for content
3. Updates request status

Our tools should cross-reference with Sonarr/Radarr queue to show download progress.

---

## Testing Checklist

- [ ] Test with movie requests
- [ ] Test with TV show requests (full series)
- [ ] Test with TV show requests (specific seasons)
- [ ] Test approve workflow
- [ ] Test deny workflow with reason
- [ ] Test user quota limits
- [ ] Test issue creation and resolution
- [ ] Test discovery endpoints
- [ ] Test error handling (invalid IDs)
- [ ] Test with no pending requests


---

## 0050 - polish-extended

**Completed**: 2026-01-25

# Phase 0050: Polish & Extended Features

**Status**: Not Started
**Branch**: `0050-polish-extended`
**Estimated Scope**: Medium (refinement and edge cases)

---

## Goals

1. Implement all Extended tier tools from api-standards.md
2. Add unified cleanup workflows across services
3. Polish error messages and edge case handling
4. Add comprehensive media_help with tool catalog
5. Performance optimization for large libraries
6. Documentation updates and final testing

---

## Scope

### In Scope

- Extended tools not implemented in previous phases
- Cross-service cleanup workflows
- Enhanced error messages
- Large library pagination/limits
- README polish and examples
- End-to-end workflow testing

### Out of Scope

- New services (Overseerr, Tautulli, etc.)
- Web UI
- Automated testing infrastructure
- CI/CD pipeline

---

## Deliverables

### 1. Extended Tools

**Sonarr Extended:**
- `sonarr_rename` - Rename episode files
- `sonarr_refresh` - Refresh series metadata
- `sonarr_upcoming` - More detailed upcoming view

**Radarr Extended:**
- `radarr_rename` - Rename movie files
- `radarr_refresh` - Refresh movie metadata
- `radarr_discover` - Discovery/recommendations

**Plex Extended:**
- `plex_collections` - List/manage collections
- `plex_duplicates` - Find duplicate files
- `plex_optimize` - Optimize database

**Sabnzbd Extended:**
- `sabnzbd_quota` - Quota status
- `sabnzbd_warnings` - System warnings

### 2. Unified Workflows

**Cleanup Assistant:**

```typescript
// Comprehensive cleanup analysis
cleanup_analysis()

// Response:
// Cleanup Analysis
//
// Unwatched Movies (365+ days): 15 items, 156.2 GB
// Watched Movies (180+ days): 8 items, 89.3 GB
// Ended Series (no recent episodes): 5 series, 234.5 GB
// Duplicate Files: 3 items, 45.2 GB
// Failed Downloads: 2 items (retry or blacklist)
//
// Total potential savings: 525.2 GB
//
// Use specific tools to investigate each category.
```

**Health Dashboard:**

```typescript
// Enhanced system_health
system_health({ verbose: true })

// Response:
// System Health: WARNING
//
// Sonarr: OK
//   Version: 4.0.13.2932
//   Shows: 160 | Episodes: 12,345
//   Queue: Empty | Stuck: 0
//
// Radarr: OK
//   Version: 5.18.4.9674
//   Movies: 450 | Downloaded: 423
//   Queue: 2 items | Stuck: 0
//
// Radarr4K: OK
//   Version: 5.18.4.9674
//   Movies: 85 | Downloaded: 82
//   Queue: 1 item | Stuck: 0
//
// Plex: OK
//   Libraries: 4
//   Movies: 508 | TV: 160 series
//   Recently Added: 12 items (7 days)
//
// Sabnzbd: WARNING
//   Queue: 3 items (25.5 MB/s)
//   Warnings: 1 (disk space low)
//
// Issues:
//   - Sabnzbd: Low disk space warning
```

### 3. Error Message Polish

Review and improve all error messages:

| Scenario | Before | After |
|----------|--------|-------|
| Invalid API key | "401 Unauthorized" | "Invalid Sonarr API key. Check your configuration." |
| Service down | "ECONNREFUSED" | "Cannot connect to Sonarr at http://... Is the service running?" |
| Movie not found | "Movie with ID 999 not found" | "No movie found with ID 999. Use movie_list to find valid IDs." |
| 4K not configured | "radarr4k.url is undefined" | "Radarr4K is not configured. Add radarr4k settings or use quality: 'hd'" |

### 4. Large Library Handling

For libraries with thousands of items:

**Pagination:**
```typescript
tv_list({ limit: 50, offset: 100 })
movie_list({ limit: 50, offset: 100 })
```

**Summary Mode:**
```typescript
tv_list({ summary: true })
// Response: "160 TV series (89 continuing, 71 ended). Use filters to narrow down."
```

**Smart Defaults:**
- Default limit of 100 for list operations
- Warn when results exceed 500
- Suggest filters for large result sets

### 5. media_help Enhancement

Comprehensive help system:

```typescript
media_help()
// Response:
// Media Management Server
//
// Connected Services:
//   - Sonarr (TV Shows) ✓
//   - Radarr (Movies) ✓
//   - Radarr4K (4K Movies) ✓
//   - Plex (Library) ✓
//   - Sabnzbd (Downloads) ✓
//
// Quick Start:
//   "Add Breaking Bad" → Search and add TV show
//   "Get Inception in 4K" → Search and add 4K movie
//   "What's downloading?" → Check download status
//   "Do I have The Office?" → Search Plex library
//
// For detailed help: media_help({ topic: 'tv' | 'movies' | 'library' | 'downloads' | 'cleanup' })

media_help({ topic: 'cleanup' })
// Response:
// Cleanup Tools
//
// Find Candidates:
//   plex_unwatched({ days: 365 }) - Movies not watched in a year
//   plex_watched_old({ days: 180 }) - Watched movies ready to delete
//   plex_duplicates() - Duplicate files wasting space
//
// Analysis:
//   cleanup_analysis() - Overview of all cleanup opportunities
//
// Delete (with confirmation):
//   plex_delete({ rating_key: 12345, confirm: true })
//   movie_delete({ movie_id: 123, delete_files: true })
//   sonarr_delete({ series_id: 456, delete_files: true })
```

---

## Design Decisions (Inherited)

### From Phase 0010

| Decision | Value |
|----------|-------|
| HTTP Client | Native fetch |
| Output Format | Simple text |
| Parameter Types | z.coerce.number() |
| List Tools | Filtering + sorting + display options |

### New Decisions

| Decision | Value | Rationale |
|----------|-------|-----------|
| Default Limit | 100 items | Prevent token overflow |
| Summary Mode | Available for all list tools | Quick counts without full data |
| Verbose Health | Optional detailed view | Balance between quick check and full status |

---

## Verification Gate

**USER GATE** - Complete end-to-end verification:

- [ ] All core workflows work smoothly:
  - [ ] "Add Breaking Bad" → searches, adds, reports
  - [ ] "Get Inception in 4K" → routes to Radarr4K correctly
  - [ ] "What's downloading?" → unified view with sources
  - [ ] "Something is stuck" → health check + fix workflow
  - [ ] "Do I have The Office?" → library search with context
- [ ] Large libraries handled gracefully (no timeouts, no token overflow)
- [ ] Error messages are actionable
- [ ] 4K routing is safe (never accidental)
- [ ] All extended tools work
- [ ] README is complete and accurate
- [ ] Works with Claude Desktop
- [ ] Works with Claude Code

---

## Dependencies

- Phase 0010 (Sonarr) must be complete
- Phase 0020 (Radarr) must be complete
- Phase 0030 (Plex) must be complete
- Phase 0040 (Sabnzbd) must be complete

---

## Technical Notes

### Performance Considerations

1. **Parallel API calls** where possible:
   ```typescript
   const [sonarr, radarr, plex, sabnzbd] = await Promise.all([
     sonarrClient.health(),
     radarrClient.health(),
     plexClient.health(),
     sabnzbdClient.health(),
   ]);
   ```

2. **Early termination** for large results:
   ```typescript
   if (results.length > MAX_RESULTS) {
     return {
       content: [{
         type: "text",
         text: `Found ${results.length} items. Showing first ${MAX_RESULTS}.\n` +
               `Use filters to narrow down: status, network, genre, etc.`
       }]
     };
   }
   ```

3. **Lazy loading** for cross-references:
   ```typescript
   // Don't fetch *arr queue data unless needed
   if (includeSource) {
     await loadArrReferences(downloads);
   }
   ```

### Testing Checklist

Before marking complete:

- [ ] Test each tool individually
- [ ] Test common workflows end-to-end
- [ ] Test with empty libraries
- [ ] Test with large libraries (100+ items)
- [ ] Test error scenarios (service down, bad config)
- [ ] Test 4K safety (verify no accidental 4K)
- [ ] Test with Claude Desktop
- [ ] Test with Claude Code
- [ ] Review all error messages
- [ ] Verify README accuracy


---

## 0040 - sabnzbd

**Completed**: 2026-01-25

# Phase 0040: Sabnzbd (Downloads)

**Status**: Not Started
**Branch**: `0040-sabnzbd`
**Estimated Scope**: Medium (simpler API, focus on queue management)

---

## Goals

1. Build Sabnzbd API client with query-parameter authentication
2. Implement download semantic tools (queue, history, pause, resume, speed)
3. Implement admin tools (delete, failed, retry, priority, categories)
4. Enhance downloads_status with full Sabnzbd integration
5. Enable cross-service download tracking (what's in Sabnzbd for which *arr)
6. Complete the unified download management experience

---

## Scope

### In Scope

- `src/services/sabnzbd/` module (client.ts, types.ts, tools.ts, index.ts)
- All download tools from api-standards.md
- Queue management (pause, resume, priority, delete)
- History and retry workflows
- Speed limiting
- Integration with *arr tracking

### Out of Scope

- NZB file uploads (use *arr for adding content)
- Sabnzbd configuration/settings
- Server administration
- RSS feed management

---

## Deliverables

1. **Sabnzbd API Client**
   - `src/services/sabnzbd/client.ts` - API client
   - `src/services/sabnzbd/types.ts` - TypeScript types
   - `src/services/sabnzbd/tools.ts` - MCP tool registrations
   - `src/services/sabnzbd/index.ts` - Exports

2. **Semantic Tools (5)**
   - `downloads_queue` - Current download queue with full details
   - `downloads_history` - Download history with status/size/time/errors
   - `downloads_pause` - Pause all downloads
   - `downloads_resume` - Resume all downloads
   - `downloads_speed` - Set speed limit

3. **Admin Tools (7)**
   - `sabnzbd_delete` - Remove item from queue
   - `sabnzbd_failed` - Get failed downloads for investigation
   - `sabnzbd_retry` - Retry a failed download
   - `sabnzbd_priority` - Change queue priority
   - `sabnzbd_categories` - List download categories
   - `sabnzbd_pause_item` - Pause specific item
   - `sabnzbd_resume_item` - Resume specific item

4. **Cross-Service Updates**
   - Full integration of `downloads_status` with Sabnzbd queue
   - Cross-reference downloads with Sonarr/Radarr (which *arr is this for?)

---

## Design Decisions (Inherited from Phase 0010)

### Technical Patterns

| Decision | Value | Rationale |
|----------|-------|-----------|
| HTTP Client | Native fetch | Consistent with other services |
| Output Format | Simple text | Readable, token-efficient |
| Parameter Types | z.coerce.number() | MCP passes numbers as strings |
| Module Pattern | client/types/tools per service | Clean separation |

### Sabnzbd-Specific Considerations

| Decision | Value | Rationale |
|----------|-------|-----------|
| Authentication | apikey query parameter | Sabnzbd API standard |
| Output Format | JSON | Request `output=json` |
| Cross-Reference | Match by title/nzo_id | Link to *arr sources |

---

## Sabnzbd API Reference

### Authentication

```typescript
// API key via query parameter
const url = `${baseUrl}/api?mode=${mode}&apikey=${apiKey}&output=json`;
```

### Key Modes (Endpoints)

| Mode | Description |
|------|-------------|
| `queue` | Get download queue |
| `history` | Get download history |
| `pause` | Pause all downloads |
| `resume` | Resume all downloads |
| `config` | Get speed limit and other settings |
| `speedlimit` | Set speed limit |
| `queue&name=delete&value=` | Delete from queue |
| `retry&value=` | Retry failed download |
| `queue&name=priority&value=&value2=` | Change priority |

### Key Types

```typescript
interface SabnzbdQueue {
  status: 'Downloading' | 'Paused' | 'Idle';
  speed: string;           // "25.5 M" (MB/s)
  timeleft: string;        // "2:30:45"
  mb: string;              // Total MB remaining
  mbleft: string;          // MB left for current item
  slots: SabnzbdQueueSlot[];
}

interface SabnzbdQueueSlot {
  nzo_id: string;          // Unique ID
  filename: string;        // Display name
  status: 'Downloading' | 'Queued' | 'Paused' | 'Verifying' | 'Extracting';
  mb: string;              // Total size
  mbleft: string;          // Remaining
  percentage: string;      // "45"
  timeleft: string;        // ETA
  cat: string;             // Category (tv, movies, etc.)
  priority: string;        // Priority level
}

interface SabnzbdHistorySlot {
  nzo_id: string;
  name: string;
  status: 'Completed' | 'Failed' | 'Queued';
  fail_message?: string;
  bytes: number;
  download_time: number;   // seconds
  completed: number;       // timestamp
  category: string;
  storage: string;         // Final path
}
```

---

## downloads_status Enhancement

This tool becomes the unified download view:

```text
Downloads Status

Speed: 25.5 MB/s | Queue: 3 items | ETA: 2:30:45

Queue:
  1. Show.S01E05.720p.WEB-DL [Sonarr] - 45% (1.2 GB / 2.7 GB) - ETA: 15m
  2. Movie.2024.1080p.BluRay [Radarr] - Queued (8.5 GB)
  3. Show.S01E06.720p.WEB-DL [Sonarr] - Queued (2.8 GB)

Issues:
  - Radarr: 2 stuck imports
  - Sonarr: 1 failed download

Recent Completions:
  - Movie.2023.1080p.BluRay - Completed 15m ago (12.3 GB)
```

### Cross-Reference Logic

To determine which *arr a download belongs to:

1. Check Sabnzbd category (often `tv`, `movies`, `movies-4k`)
2. Query Sonarr/Radarr queues for matching download IDs
3. Match by title if ID not found

```typescript
interface EnhancedDownload {
  nzo_id: string;
  title: string;
  progress: number;
  eta: string;
  status: string;
  size: number;
  source: 'sonarr' | 'radarr' | 'radarr4k' | 'unknown';
  issues?: string[];
}
```

---

## Queue Management Workflows

### "Pause downloads"

```typescript
downloads_pause()
// Response: "Downloads paused. 3 items in queue."
```

### "Resume downloads"

```typescript
downloads_resume()
// Response: "Downloads resumed. Speed: 25.5 MB/s"
```

### "Slow down downloads" / "Limit speed"

```typescript
downloads_speed({ speed: 10 })  // 10 MB/s
// Response: "Speed limit set to 10 MB/s"

downloads_speed({ speed: 'unlimited' })
// Response: "Speed limit removed"
```

### "Move X to top of queue"

```typescript
sabnzbd_priority({ nzo_id: 'abc123', position: 'top' })
// Response: "Moved 'Show.S01E05' to top of queue"
```

---

## Failed Download Handling

### Investigation

```typescript
sabnzbd_failed()
// Response:
// 2 failed downloads:
//
// 1. Show.S01E03.720p - Failed: "Incomplete download"
//    Category: tv | Size: 2.1 GB | Completed: 2024-01-15 10:30
//
// 2. Movie.2024.1080p - Failed: "Unpacking failed"
//    Category: movies | Size: 8.5 GB | Completed: 2024-01-15 09:15
```

### Retry

```typescript
sabnzbd_retry({ nzo_id: 'abc123' })
// Response: "Retrying 'Show.S01E03.720p'. Added to queue."
```

---

## Verification Gate

Download tools work correctly:

- [ ] `downloads_queue` shows current queue with details
- [ ] `downloads_history` shows history with status
- [ ] `downloads_pause` pauses all downloads
- [ ] `downloads_resume` resumes downloads
- [ ] `downloads_speed` sets speed limit correctly
- [ ] `sabnzbd_delete` removes items from queue
- [ ] `sabnzbd_failed` lists failed downloads
- [ ] `sabnzbd_retry` retries failed downloads
- [ ] `sabnzbd_priority` changes queue order
- [ ] `downloads_status` shows unified view with *arr cross-references
- [ ] `system_health` includes Sabnzbd status

---

## Dependencies

- Phase 0010 (Sonarr) must be complete
- Phase 0020 (Radarr) should be complete for full cross-reference

---

## Technical Notes

### Speed Parsing

Sabnzbd returns speed as string like "25.5 M". Parse for display:

```typescript
function formatSpeed(speed: string): string {
  // "25.5 M" -> "25.5 MB/s"
  return speed.replace(' M', ' MB/s').replace(' K', ' KB/s');
}
```

### Category Mapping

Common category-to-source mapping:

| Category | Likely Source |
|----------|---------------|
| `tv`, `sonarr` | Sonarr |
| `movies`, `radarr` | Radarr |
| `movies-4k`, `radarr4k` | Radarr4K |
| `audio`, `lidarr` | Lidarr (not supported) |

### NZO ID

The `nzo_id` is Sabnzbd's unique identifier for each download. Use it for:
- Delete operations
- Retry operations
- Priority changes
- Pause/resume individual items


---

## 0030 - plex

**Completed**: 2026-01-25

# Phase 0030: Plex (Library)

**Status**: Not Started
**Branch**: `0030-plex`
**Estimated Scope**: Medium (different API pattern than *arr apps)

---

## Goals

1. Build Plex API client with token-based authentication
2. Implement Plex semantic tools (library_list, library_search, library_watched)
3. Implement Plex admin tools (delete, unwatched, watched_old, recent, refresh)
4. Provide library-aware search ("Do I have...?" queries)
5. Enable watch status tracking and cleanup workflows
6. Update cross-service tools to include Plex

---

## Scope

### In Scope

- `src/services/plex/` module (client.ts, types.ts, tools.ts, index.ts)
- All library tools from api-standards.md
- Multi-library support (Movies, TV Shows, Kids Shows, Movies (4K))
- Watch status queries
- Cleanup candidate identification

### Out of Scope

- Sabnzbd (Phase 0040)
- Plex playback control
- Plex user management
- Plex sharing/permissions
- Tautulli integration

---

## Deliverables

1. **Plex API Client**
   - `src/services/plex/client.ts` - API client
   - `src/services/plex/types.ts` - TypeScript types for Plex API
   - `src/services/plex/tools.ts` - MCP tool registrations
   - `src/services/plex/index.ts` - Exports

2. **Semantic Tools (3)**
   - `library_list` - List all Plex libraries
   - `library_search` - Search across libraries ("Do I have...?")
   - `library_watched` - Get watched/unwatched status

3. **Admin Tools (5)**
   - `plex_delete` - Delete media from Plex (destructive!)
   - `plex_unwatched` - Find unwatched content (cleanup candidates)
   - `plex_watched_old` - Find old watched content (cleanup candidates)
   - `plex_recent` - Recently added content
   - `plex_refresh` - Trigger library scan

4. **Cross-Service Updates**
   - Update `system_health` to check Plex connectivity
   - Consider `library_search` in "do I have" workflows

---

## Design Decisions (Inherited from Phase 0010)

### Technical Patterns

| Decision | Value | Rationale |
|----------|-------|-----------|
| HTTP Client | Native fetch | Consistent with other services |
| Output Format | Simple text | Readable, token-efficient |
| Parameter Types | z.coerce.number() | MCP passes numbers as strings |
| Module Pattern | client/types/tools per service | Clean separation |

### Plex-Specific Considerations

| Decision | Value | Rationale |
|----------|-------|-----------|
| Authentication | X-Plex-Token header | Standard Plex auth method |
| Library Filtering | Always show which library | User needs context for results |
| Delete Confirmation | Require `confirm: true` | Destructive operation |

---

## Plex API Reference

### Authentication

```typescript
// Token via header (preferred)
headers: { 'X-Plex-Token': token }

// Or via query parameter
url: `${baseUrl}/library/sections?X-Plex-Token=${token}`
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/library/sections` | GET | List all libraries |
| `/library/sections/{id}/all` | GET | List all items in library |
| `/search?query=` | GET | Search across libraries |
| `/library/metadata/{id}` | GET | Item details |
| `/library/metadata/{id}` | DELETE | Delete item |
| `/library/sections/{id}/refresh` | GET | Trigger library scan |
| `/status/sessions/history/all` | GET | Watch history |

### Key Types

```typescript
interface PlexLibrary {
  key: string;        // Library ID
  title: string;      // "Movies", "TV Shows", etc.
  type: 'movie' | 'show' | 'artist' | 'photo';
  agent: string;
  scanner: string;
}

interface PlexMediaItem {
  ratingKey: string;  // Unique ID
  title: string;
  type: 'movie' | 'show' | 'season' | 'episode';
  year?: number;
  summary?: string;
  viewCount?: number;
  lastViewedAt?: number;
  addedAt: number;
  duration: number;   // milliseconds
  Media?: PlexMedia[];
}

interface PlexMedia {
  videoResolution: string;
  bitrate: number;
  Part: Array<{
    file: string;
    size: number;
  }>;
}
```

---

## library_search Enhancement

Following the pattern established for tv_list:

**Filters:**
- `library`: filter to specific library
- `type`: movie | show | episode
- `unwatched_only`: only unwatched content
- `year`: filter by release year

**Display Options:**
- `show_size`: disk size
- `show_watched`: watch count and last watched date
- `show_added`: date added to library
- `limit`: max results

**Response Format:**

```text
Found 3 results:

Movies:
  Inception (2010) - 4.2 GB, Watched 3 times (last: 2024-12-15)

TV Shows:
  The Office (US) - 201 episodes, 180 watched
  The Office (UK) - 14 episodes, Unwatched
```

---

## Cleanup Workflow Tools

### plex_unwatched

Find unwatched content older than N days (cleanup candidates):

```typescript
plex_unwatched({ days: 365, library: "Movies" })

// Response:
// 15 movies unwatched for 365+ days:
// - Movie Title (2020) - 8.5 GB - Added 2023-01-15
// - Movie Title 2 (2019) - 12.1 GB - Added 2022-06-20
// ...
// Total: 156.2 GB potential savings
```

### plex_watched_old

Find watched content you might want to remove:

```typescript
plex_watched_old({ days: 180, library: "Movies" })

// Response:
// 8 movies watched 180+ days ago:
// - Movie Title (2020) - 8.5 GB - Last watched 2024-03-15
// ...
// Total: 89.3 GB potential savings
```

---

## Safety Considerations

### plex_delete

This is a **destructive operation** that deletes actual files.

```typescript
// Requires explicit confirmation
plex_delete({ rating_key: 12345 })
// Error: "Delete requires confirmation. Use confirm: true to proceed."

plex_delete({ rating_key: 12345, confirm: true })
// Success: "Deleted 'Movie Title' (8.5 GB freed)"
```

---

## Verification Gate

Library tools work correctly:

- [ ] `library_list` shows all Plex libraries
- [ ] `library_search` finds content across libraries
- [ ] `library_search` shows which library results come from
- [ ] `library_watched` shows watch status correctly
- [ ] `plex_unwatched` finds cleanup candidates
- [ ] `plex_watched_old` finds old watched content
- [ ] `plex_delete` requires confirmation
- [ ] `plex_delete` actually deletes (test with dummy file)
- [ ] `plex_refresh` triggers library scan
- [ ] `system_health` includes Plex status

---

## Dependencies

- Phase 0020 (Radarr) should be complete for full media stack
- Can be developed in parallel with 0020 if needed

---

## Technical Notes

### XML vs JSON

Plex API returns XML by default. Add `Accept: application/json` header:

```typescript
const response = await fetch(url, {
  headers: {
    'Accept': 'application/json',
    'X-Plex-Token': token,
  },
});
```

### Rating Key vs Key

- `ratingKey`: Unique identifier for an item (use for delete, details)
- `key`: API endpoint path (e.g., `/library/metadata/12345`)

### Time Handling

Plex uses Unix timestamps for dates:
- `addedAt`: seconds since epoch
- `lastViewedAt`: seconds since epoch
- `duration`: milliseconds


---

## 0020 - radarr

**Completed**: 2026-01-25

# Phase 0020: Radarr (Movies)

**Status**: Not Started
**Branch**: `0020-radarr`
**Estimated Scope**: Medium (follows established patterns from Phase 0010)

---

## Goals

1. Build Radarr API client following the established service module pattern
2. Implement all Radarr semantic tools (movie_search, movie_add, movie_list, movie_upgrade, movie_delete)
3. Implement Radarr admin tools (queue, details, profiles, stuck, import, blacklist)
4. Add Radarr4K routing with safety-first defaults (HD unless explicitly requested)
5. Update cross-service tools (downloads_status, system_health) to include Radarr
6. Enhance movie_list with filtering/sorting/display options (like tv_list)

---

## Scope

### In Scope

- `src/services/radarr/` module (client.ts, types.ts, tools.ts, index.ts)
- All movie tools from api-standards.md
- Radarr4K routing via `quality` parameter
- Integration with existing cross-service tools
- Configuration schema for radarr and radarr4k

### Out of Scope

- Plex, Sabnzbd (Phase 0030, 0040)
- Overseerr integration (future consideration)
- Collection management (future enhancement)

---

## Deliverables

1. **Radarr API Client**
   - `src/services/radarr/client.ts` - API client with all methods
   - `src/services/radarr/types.ts` - TypeScript types for Radarr v3 API
   - `src/services/radarr/tools.ts` - MCP tool registrations
   - `src/services/radarr/index.ts` - Exports

2. **Semantic Tools (5)**
   - `movie_search` - Search for movies by name
   - `movie_add` - Add movie to library
   - `movie_list` - List all movies with filtering/sorting
   - `movie_upgrade` - Search for better quality version
   - `movie_delete` - Remove movie from library

3. **Admin Tools (6)**
   - `radarr_queue` - Download queue with progress/ETA/errors
   - `radarr_details` - Detailed info for one movie
   - `radarr_profiles` - List quality profiles
   - `radarr_stuck` - Stuck imports
   - `radarr_import` - Trigger manual import
   - `radarr_blacklist` - Blacklist and re-search

4. **Cross-Service Updates**
   - Update `downloads_status` to include Radarr queues
   - Update `system_health` to check Radarr connectivity

---

## Design Decisions (Inherited from Phase 0010)

### Technical Patterns

| Decision | Value | Rationale |
|----------|-------|-----------|
| HTTP Client | Native fetch | No external dependencies, sufficient for needs |
| Output Format | Simple text | Readable, token-efficient |
| Parameter Types | z.coerce.number() | MCP passes numbers as strings |
| Module Pattern | client/types/tools per service | Clean separation, testable |
| List Tools | Filtering + sorting + display options | User requested during Phase 0010 |

### Radarr4K Safety (Constitution Principle II)

```typescript
// Default: HD (regular Radarr) - SAFE
movie_search({ query: "inception" })  // quality defaults to 'hd'

// 4K only when explicitly requested
movie_search({ query: "inception", quality: "4k" })

// Implementation pattern
function getRadarrConfig(quality: 'hd' | '4k' = 'hd') {
  return quality === '4k' ? config.radarr4k : config.radarr;
}
```

**Trigger words for 4K**: "4K", "4k", "UHD", "2160p"

---

## Radarr API Reference

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v3/movie/lookup?term=` | GET | Search for movies |
| `/api/v3/movie` | GET | List all movies |
| `/api/v3/movie` | POST | Add movie |
| `/api/v3/movie/{id}` | DELETE | Delete movie |
| `/api/v3/queue` | GET | Download queue |
| `/api/v3/qualityprofile` | GET | Quality profiles |
| `/api/v3/rootfolder` | GET | Root folders |
| `/api/v3/command` | POST | Trigger commands |

### Authentication

- Header: `X-Api-Key: {apiKey}`
- Same pattern as Sonarr

### Key Types

```typescript
interface Movie {
  id: number;
  title: string;
  tmdbId: number;
  imdbId?: string;
  year: number;
  status: 'released' | 'inCinemas' | 'announced' | 'deleted';
  hasFile: boolean;
  monitored: boolean;
  path: string;
  qualityProfileId: number;
  sizeOnDisk: number;
  runtime: number;
  genres: string[];
  ratings: { imdb?: number; tmdb?: number; rottenTomatoes?: number };
  added: string;
}
```

---

## movie_list Enhancement

Following the pattern established for tv_list, movie_list should support:

**Filters:**
- `status`: released | inCinemas | announced | all
- `quality`: hd | 4k (routes to appropriate Radarr instance)
- `genre`: partial match filter
- `missing_only`: only movies without files
- `unmonitored_only`: only unmonitored movies

**Sorting:**
- `title`: A-Z (default)
- `size`: largest first
- `added`: newest first
- `year`: newest first
- `rating`: highest rated first

**Display Options:**
- `show_size`: disk size
- `show_rating`: IMDB/TMDB rating
- `show_runtime`: movie length
- `show_added`: date added
- `limit`: max results

---

## Verification Gate

Movie tools work correctly:

- [ ] `movie_search` finds movies by name
- [ ] `movie_add` adds with HD quality by default
- [ ] `movie_add` with `quality: '4k'` routes to Radarr4K
- [ ] `movie_list` shows all movies with filtering/sorting
- [ ] `movie_delete` removes movies correctly
- [ ] `radarr_queue` shows queue for both HD and 4K
- [ ] 4K routing ONLY happens with explicit request
- [ ] `downloads_status` includes Radarr queues
- [ ] `system_health` checks Radarr connectivity

---

## Dependencies

- Phase 0010 (Foundation + Sonarr) must be complete

---

## Technical Notes

### Dual Instance Configuration

```json
{
  "radarr": {
    "url": "http://localhost:7878",
    "apiKey": "..."
  },
  "radarr4k": {
    "url": "http://localhost:7879",
    "apiKey": "..."
  }
}
```

### Quality Parameter Pattern

Every tool that interacts with movies should accept `quality?: 'hd' | '4k'` parameter with `'hd'` as default. This ensures:

1. Safe default behavior
2. Explicit 4K routing when requested
3. Consistent interface across all movie tools


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

