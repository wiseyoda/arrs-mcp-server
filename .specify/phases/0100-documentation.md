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
