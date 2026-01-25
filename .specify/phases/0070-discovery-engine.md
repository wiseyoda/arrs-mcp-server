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
