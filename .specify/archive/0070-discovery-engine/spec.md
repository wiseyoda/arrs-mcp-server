# Specification: Phase 0070 - Discovery & Recommendations Engine

## Overview

Add TMDB integration for collection completion and library-aware recommendations. Enable users to discover what's missing from movie franchises and get personalized recommendations based on their existing Plex library.

---

## User Stories

### US1: Collection Completion (Priority: HIGH)

**As a** media library owner
**I want to** see what movies are missing from a franchise
**So that** I can complete my collection of related movies

**Acceptance Criteria:**
- Can search for collections by name (e.g., "Marvel", "Star Wars")
- Shows all movies in collection with release dates
- Indicates which movies are already in my Plex library
- Shows count: "You have X of Y movies"
- Can add missing movies to Radarr

### US2: Similar Content Discovery (Priority: HIGH)

**As a** media library owner
**I want to** find movies similar to ones I already have
**So that** I can discover new content matching my taste

**Acceptance Criteria:**
- Can get similar movies for any TMDB ID or title
- Results show title, year, rating, overview
- Indicates which similar movies are already in library
- Can filter to show only movies NOT in library

### US3: Recommendations Based on Library (Priority: MEDIUM)

**As a** media library owner
**I want to** get recommendations based on a movie I own
**So that** I can find related content I might enjoy

**Acceptance Criteria:**
- Can get recommendations for any movie by title or TMDB ID
- Results filtered against Plex library
- Shows "You might also like..." style results
- Can add recommended movies to Radarr

---

## Functional Requirements

### FR-001: TMDB Service Integration

Create new service at `src/services/tmdb/` with:
- HTTP client configured for TMDB API v3
- Support for API key authentication
- Type definitions for TMDB responses

### FR-002: Collection Lookup

Implement `tmdb_collection` tool:
- Search collections by name
- Retrieve full collection details by ID
- Return all movies in collection with metadata

### FR-003: Library Cross-Reference

Implement library matching:
- Match TMDB movies against Plex library
- Support matching by TMDB ID (preferred) or title+year
- Return match status for each item

### FR-004: Collection Status Tool

Implement `collection_status` tool:
- Show collection name and total count
- List all movies with library status (owned/missing)
- Summary: "X of Y movies in library"

### FR-005: Collection Missing Tool

Implement `collection_missing` tool:
- Return only movies NOT in library
- Include TMDB ID for adding to Radarr
- Show release date and rating

### FR-006: Similar Movies Tool

Implement `tmdb_similar` tool:
- Get similar movies for a given TMDB ID
- Cross-reference against library
- Option to show only missing items

### FR-007: Recommendations Tool

Implement `tmdb_recommendations` tool:
- Get TMDB recommendations for a movie
- Cross-reference against library
- Filter to missing items only

### FR-008: Add Missing to Radarr

Implement `collection_add_missing` tool:
- Add missing collection items to Radarr
- Require explicit confirmation
- Support adding single item or all missing
- Use existing Radarr integration

---

## Non-Functional Requirements

### NFR-001: Rate Limiting

- Implement reasonable delays between TMDB requests
- Handle 429 responses with exponential backoff
- No caching (per Constitution - stateless operation)

### NFR-002: Error Handling

- Handle TMDB API errors gracefully
- Handle Plex connection failures
- Provide meaningful error messages

### NFR-003: Performance

- Collection lookups should complete in <5 seconds
- Library cross-reference should be efficient
- Paginate large result sets

---

## Tool Inventory

### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `collection_status` | Check completion status of a movie collection |
| `collection_missing` | List missing movies from a collection |
| `collection_add_missing` | Add missing collection items to Radarr |

### Service Tools (Admin)

| Tool | Description |
|------|-------------|
| `tmdb_collection` | Look up a TMDB collection by name or ID |
| `tmdb_similar` | Find similar movies to a given title |
| `tmdb_recommendations` | Get recommendations based on a movie |
| `tmdb_search` | Search TMDB for movies (utility) |

---

## Configuration

### Environment Variables

```bash
TMDB_API_KEY=your-api-key
```

### Config File

```json
{
  "tmdb": {
    "apiKey": "your-api-key"
  }
}
```

---

## Out of Scope

- Trending/popular content (use Overseerr)
- Upcoming releases (use Overseerr)
- TV show collections (movies only for now)
- Trakt integration (deferred)
- Letterboxd integration (deferred)
- Taste profile analysis (deferred)

---

## Dependencies

- Phase 0060 (Overseerr) - Complete ✓
- Plex integration - Required for library cross-reference
- Radarr integration - Required for adding movies
