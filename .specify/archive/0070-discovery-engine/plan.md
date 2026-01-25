# Implementation Plan: Phase 0070 - Discovery & Recommendations Engine

## Technical Context

| Aspect | Value |
|--------|-------|
| Language | TypeScript 5.x (strict mode) |
| Runtime | Node.js 20+ |
| Framework | MCP SDK (@modelcontextprotocol/sdk) |
| Validation | Zod |
| HTTP | Native fetch via shared HttpClient |

---

## Architecture

### New Service Structure

```
src/services/tmdb/
├── client.ts      # TMDB API client
├── types.ts       # TypeScript interfaces
├── tools.ts       # MCP tool registrations
└── index.ts       # Module exports
```

### Integration Points

1. **TMDB API v3** - External API for movie metadata
2. **Plex Service** - Existing service for library cross-reference
3. **Radarr Service** - Existing service for adding movies

---

## Component Design

### TmdbClient

```typescript
class TmdbClient {
  private http: HttpClient;
  private apiKey: string;

  constructor(config: TmdbConfig) {
    this.apiKey = config.apiKey;
    this.http = new HttpClient({
      baseUrl: "https://api.themoviedb.org/3",
      serviceName: "TMDB",
    });
  }

  // Collection methods
  async searchCollections(query: string): Promise<CollectionSearchResult[]>;
  async getCollection(id: number): Promise<Collection>;

  // Movie methods
  async getMovie(id: number): Promise<Movie>;
  async getSimilar(id: number): Promise<Movie[]>;
  async getRecommendations(id: number): Promise<Movie[]>;
  async searchMovies(query: string): Promise<Movie[]>;
}
```

### Library Matcher

```typescript
// In tools.ts - utility for cross-referencing
async function matchAgainstLibrary(
  plexClient: PlexClient,
  tmdbMovies: TmdbMovie[]
): Promise<MovieWithLibraryStatus[]> {
  // Search Plex for each movie
  // Return with owned: true/false flag
}
```

---

## API Endpoints

### TMDB Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /search/collection` | Search collections by name |
| `GET /collection/{id}` | Get collection details with all movies |
| `GET /movie/{id}` | Get movie details |
| `GET /movie/{id}/similar` | Get similar movies |
| `GET /movie/{id}/recommendations` | Get recommendations |
| `GET /search/movie` | Search movies by title |

### Authentication

All requests include: `?api_key={TMDB_API_KEY}`

---

## Data Flow

### Collection Completion Flow

```
User: "What MCU movies am I missing?"
  │
  ├─► tmdb_collection(query: "Marvel Cinematic Universe")
  │     └─► TMDB: GET /search/collection?query=Marvel...
  │     └─► TMDB: GET /collection/{id}
  │     └─► Returns: 32 movies with metadata
  │
  ├─► collection_status(collection_id: 86311)
  │     └─► For each movie: search Plex library
  │     └─► Returns: "24 of 32 movies in library"
  │
  └─► collection_missing(collection_id: 86311)
        └─► Filter to movies NOT in library
        └─► Returns: 8 missing movies with TMDB IDs
```

### Add Missing Flow

```
User: "Add missing MCU movies"
  │
  └─► collection_add_missing(collection_id: 86311, confirm: true)
        └─► For each missing movie:
        │     └─► Radarr: POST /movie (add movie)
        └─► Returns: "Added 8 movies to Radarr"
```

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Invalid API key | Return clear error with setup instructions |
| Collection not found | Return "No collection found for query" |
| TMDB rate limit (429) | Exponential backoff, retry 3x |
| Plex unavailable | Return partial results with warning |
| Radarr unavailable | Error on add, don't affect lookup |

---

## Configuration Changes

### config.ts Updates

```typescript
interface TmdbConfig {
  apiKey: string;
}

interface Config {
  // ... existing
  tmdb?: TmdbConfig;
}
```

### Environment Variables

```bash
TMDB_API_KEY=your-api-key
```

---

## Testing Strategy

### Manual Testing

1. Search for known collections (MCU, Star Wars)
2. Verify library matching accuracy
3. Test adding movies to Radarr
4. Test error cases (invalid key, bad collection ID)

### Test Collections

| Collection | TMDB ID | Movies |
|------------|---------|--------|
| Marvel Cinematic Universe | 86311 | 32+ |
| Star Wars | 10 | 12 |
| Fast & Furious | 9485 | 11 |
| James Bond | 645 | 27 |

---

## Constraints

1. **Movies only** - TV collections deferred to future phase
2. **No auto-add** - Always require explicit confirmation
3. **Plex required** - Library cross-reference needs Plex configured
4. **Single Radarr** - Add to default Radarr (not 4K) unless specified

---

## Dependencies

| Dependency | Status |
|------------|--------|
| Plex service | Required - existing |
| Radarr service | Required - existing |
| TMDB API key | Required - user must obtain |
