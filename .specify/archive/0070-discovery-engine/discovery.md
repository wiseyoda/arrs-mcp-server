# Discovery: Phase 0070 - Discovery & Recommendations Engine

## Session Context

**Date**: 2026-01-25
**Phase**: 0070
**Branch**: 0070-discovery-engine

---

## Codebase Findings

### Existing Service Patterns

All services follow a consistent 4-file structure:
- `client.ts` - HTTP client wrapper using shared `HttpClient`
- `types.ts` - TypeScript interfaces for API responses
- `tools.ts` - MCP tool registrations with Zod validation
- `index.ts` - Module exports

**Key patterns identified:**
- `HttpClient` from `src/shared/http.ts` handles all HTTP operations
- Tools use Zod for parameter validation with `.describe()` for Claude
- Two-tier tool design: semantic (user-facing) and service-prefixed (admin)
- Config loaded from env vars OR `config.json`

### Existing Discovery Features (Overseerr)

Phase 0060 already implemented via Overseerr:
- `overseerr_trending` - Trending movies/TV (via TMDB)
- `overseerr_upcoming` - Upcoming movie releases

These will NOT be duplicated.

### Library Cross-Reference Capability

Plex service (`src/services/plex/`) provides:
- `library_list` - List all libraries
- `library_search` - Search across libraries
- Access to TMDB IDs via Plex metadata agents

This enables cross-referencing TMDB content with existing library.

---

## Clarified Scope

### What We're Building (Unique Value)

1. **Collection Completion**
   - "What MCU movies am I missing?"
   - Cross-reference TMDB collections with Plex library
   - Show which items in a franchise are missing

2. **Library-Aware Recommendations**
   - Recommendations based on movies you OWN (not just trending)
   - "Movies like Inception that I don't have"
   - Personalized to your actual library

3. **Similar Content Discovery**
   - Find similar movies/shows to specific titles
   - Cross-reference to show what's missing from library

### What We're NOT Building (Already Have or Deferred)

- ~~Trending content~~ → Use `overseerr_trending`
- ~~Upcoming releases~~ → Use `overseerr_upcoming`
- ~~Trakt lists~~ → Deferred to future phase
- ~~Letterboxd~~ → Deferred to future phase
- ~~Taste profiles~~ → Deferred (requires more Plex integration)

---

## Technical Decisions

### API Choice: TMDB v3

- Free tier is generous (no hard rate limits since Dec 2019)
- Industry standard for movie/TV metadata
- Collections endpoint perfect for franchise completion
- Recommendations/similar endpoints built-in

### Authentication

TMDB uses API key as query parameter:
```
?api_key=YOUR_API_KEY
```

Or as Bearer token in Authorization header.

### Library Matching Strategy

Match TMDB content to Plex library by:
1. Search Plex by TMDB ID (if available in metadata)
2. Fall back to title + year matching
3. Report matches and gaps

---

## Deferred Items

| Item | Reason | Future Phase |
|------|--------|--------------|
| Trakt integration | Lower priority than collection completion | 0080+ |
| Letterboxd | Scraping complexity, no official API | 0080+ |
| Taste profiles | Requires watch history analysis | 0080+ |
| Auto-add from lists | Safety concerns | Future |

---

## Configuration Requirements

```json
{
  "tmdb": {
    "apiKey": "your-tmdb-api-key"
  }
}
```

**Obtaining TMDB API Key:**
1. Create account at themoviedb.org
2. Go to Settings → API
3. Request API key (free, instant approval)
4. Accept terms of use

---

## Success Criteria

1. Can look up any TMDB collection (MCU, Fast & Furious, etc.)
2. Can show which collection items are in Plex library
3. Can show which collection items are MISSING
4. Can get recommendations for a specific movie
5. Can filter recommendations to show only items NOT in library
6. Can add missing items to Radarr (with confirmation)
