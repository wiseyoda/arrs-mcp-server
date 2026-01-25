# arrs-mcp-server

MCP server for managing Sonarr, Radarr, Plex, Sabnzbd, Overseerr, and TMDB through Claude.

## Features

- **TV Show Management** (Sonarr): Search, add, list, and manage TV series
- **Movie Management** (Radarr): Search, add, list movies with HD/4K quality routing
- **Library Management** (Plex): Browse, search, and manage your media library
- **Download Management** (Sabnzbd): Monitor queue, pause/resume, manage downloads
- **Request Management** (Overseerr): Approve/decline requests, manage users, track issues
- **Discovery & Collections** (TMDB): Find missing movies from franchises, get recommendations
- **System Health**: Check service connectivity and identify issues
- **Cleanup Analysis**: Find unwatched content, duplicates, and cleanup opportunities
- **Natural Language**: Tools designed for intuitive Claude interaction

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/arrs-mcp-server.git
cd arrs-mcp-server

# Install dependencies
pnpm install

# Build
pnpm build
```

## Configuration

### Option 1: Environment Variables (Recommended for secrets)

```bash
# Sonarr
export SONARR_URL="http://localhost:8989"
export SONARR_API_KEY="your-api-key"

# Radarr (HD)
export RADARR_URL="http://localhost:7878"
export RADARR_API_KEY="your-api-key"

# Radarr (4K) - optional
export RADARR4K_URL="http://localhost:7879"
export RADARR4K_API_KEY="your-api-key"

# Plex
export PLEX_URL="http://localhost:32400"
export PLEX_TOKEN="your-token"

# Sabnzbd
export SABNZBD_URL="http://localhost:8080"
export SABNZBD_API_KEY="your-api-key"

# Overseerr
export OVERSEERR_URL="http://localhost:5055"
export OVERSEERR_API_KEY="your-api-key"

# TMDB (for collection and recommendation features)
export TMDB_API_KEY="your-api-key"
```

### Option 2: Config File

Create `config.json` in the project root:

```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "your-api-key"
  },
  "radarr": {
    "url": "http://localhost:7878",
    "apiKey": "your-api-key"
  },
  "radarr4k": {
    "url": "http://localhost:7879",
    "apiKey": "your-api-key"
  },
  "plex": {
    "url": "http://localhost:32400",
    "token": "your-token"
  },
  "sabnzbd": {
    "url": "http://localhost:8080",
    "apiKey": "your-api-key"
  },
  "overseerr": {
    "url": "http://localhost:5055",
    "apiKey": "your-api-key"
  },
  "tmdb": {
    "apiKey": "your-api-key"
  }
}
```

See `config.example.json` for all available options.

### Finding Your API Keys

- **Sonarr/Radarr**: Settings → General → Security → API Key
- **Plex**: [Finding your Plex Token](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)
- **Sabnzbd**: Config → General → API Key
- **Overseerr**: Settings → General → API Key
- **TMDB**: Sign up at [themoviedb.org](https://www.themoviedb.org/settings/api) and request an API key

## Claude Desktop Setup

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/absolute/path/to/arrs-mcp-server/dist/index.js"],
      "env": {
        "SONARR_URL": "http://localhost:8989",
        "SONARR_API_KEY": "your-api-key",
        "RADARR_URL": "http://localhost:7878",
        "RADARR_API_KEY": "your-api-key",
        "PLEX_URL": "http://localhost:32400",
        "PLEX_TOKEN": "your-token",
        "SABNZBD_URL": "http://localhost:8080",
        "SABNZBD_API_KEY": "your-api-key",
        "OVERSEERR_URL": "http://localhost:5055",
        "OVERSEERR_API_KEY": "your-api-key",
        "TMDB_API_KEY": "your-api-key"
      }
    }
  }
}
```

Restart Claude Desktop after adding the configuration.

## Claude Code Setup

Add to your Claude Code settings (`.claude/settings.json` or via the settings UI):

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/absolute/path/to/arrs-mcp-server/dist/index.js"],
      "env": {
        "SONARR_URL": "http://localhost:8989",
        "SONARR_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### Cross-Service Tools

| Tool | Description |
|------|-------------|
| `system_health` | Check health of all configured services (use `verbose:true` for details) |
| `downloads_status` | Unified download status across all services |
| `cleanup_analysis` | Find cleanup opportunities: unwatched, duplicates, ended series |
| `media_help` | Get help and list available tools |

### TV Show Tools (Sonarr)

#### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `tv_search` | Search for TV series by name |
| `tv_add` | Add a TV series to Sonarr |
| `tv_list` | List all TV series with filtering, sorting, pagination |
| `tv_episodes` | View episode status for a series |
| `tv_search_missing` | Trigger search for missing episodes |

#### Admin Tools

| Tool | Description |
|------|-------------|
| `sonarr_queue` | View download queue with progress |
| `sonarr_details` | Get detailed series information |
| `sonarr_delete` | Remove a series from Sonarr |
| `sonarr_profiles` | List available quality profiles |
| `sonarr_folders` | List root folders |
| `sonarr_stuck` | Find items stuck importing |
| `sonarr_import` | Trigger manual import |
| `sonarr_blacklist` | Blacklist a release and re-search |
| `sonarr_calendar` | View upcoming episodes |

#### Extended Tools

| Tool | Description |
|------|-------------|
| `sonarr_rename` | Rename episode files using naming rules |
| `sonarr_refresh` | Refresh series metadata from TVDB |
| `sonarr_upcoming` | Show upcoming episodes with details |

### Movie Tools (Radarr)

#### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `movie_search` | Search for movies by name (supports IMDB ID) |
| `movie_add` | Add a movie to Radarr (use `quality:'hd'` or `quality:'4k'`) |
| `movie_list` | List all movies with filtering, sorting, pagination |
| `movie_upgrade` | Search for quality upgrades |
| `movie_delete` | Remove a movie from Radarr |

#### Admin Tools

| Tool | Description |
|------|-------------|
| `radarr_queue` | View download queue with progress |
| `radarr_details` | Get detailed movie information |
| `radarr_profiles` | List available quality profiles |
| `radarr_folders` | List root folders |
| `radarr_stuck` | Find items stuck importing |
| `radarr_import` | Trigger manual import |
| `radarr_blacklist` | Blacklist a release and re-search |

#### Extended Tools

| Tool | Description |
|------|-------------|
| `radarr_rename` | Rename movie files using naming rules |
| `radarr_refresh` | Refresh movie metadata |
| `radarr_discover` | Get movie recommendations |

### Library Tools (Plex)

#### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `library_list` | List all Plex libraries |
| `library_search` | Search across libraries |
| `library_watched` | Get watch status for items |
| `library_list_movies` | List movies with filtering and sorting |

#### Admin Tools

| Tool | Description |
|------|-------------|
| `plex_recent` | Recently added content |
| `plex_refresh` | Trigger library scan |
| `plex_unwatched` | Find old unwatched content |
| `plex_watched_old` | Find old watched content |
| `plex_delete` | Delete content (with confirmation) |

#### Extended Tools

| Tool | Description |
|------|-------------|
| `plex_collections` | List collections in libraries |
| `plex_duplicates` | Find duplicate items |
| `plex_optimize` | Trigger database optimization |

### Download Tools (Sabnzbd)

#### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `downloads_queue` | View current download queue |
| `downloads_history` | View download history |
| `downloads_pause` | Pause all downloads |
| `downloads_resume` | Resume all downloads |
| `downloads_speed` | Set speed limit |

#### Admin Tools

| Tool | Description |
|------|-------------|
| `sabnzbd_delete` | Delete a queue item |
| `sabnzbd_failed` | List failed downloads |
| `sabnzbd_retry` | Retry a failed download |
| `sabnzbd_priority` | Change queue priority |
| `sabnzbd_pause_item` | Pause specific item |
| `sabnzbd_resume_item` | Resume specific item |
| `sabnzbd_categories` | List download categories |

#### Extended Tools

| Tool | Description |
|------|-------------|
| `sabnzbd_quota` | Show quota usage and limits |
| `sabnzbd_warnings` | Show system warnings |

### Request Tools (Overseerr)

#### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `request_list` | List media requests with status filtering |
| `request_approve` | Approve a pending request |
| `request_decline` | Decline a request with optional reason |

#### Admin Tools

| Tool | Description |
|------|-------------|
| `overseerr_request_details` | Get detailed request information |
| `overseerr_request_delete` | Delete a request (requires confirmation) |
| `overseerr_users` | List all Overseerr users |
| `overseerr_user_requests` | View a user's request history |
| `overseerr_user_quota` | Check user quota limits |
| `overseerr_issues` | List reported issues |
| `overseerr_issue_details` | Get detailed issue information |
| `overseerr_issue_comment` | Add comment to an issue |
| `overseerr_issue_resolve` | Mark an issue as resolved |
| `overseerr_trending` | Get trending movies and TV shows |
| `overseerr_upcoming` | Get upcoming movie releases |

### Discovery Tools (TMDB)

#### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `collection_status` | Check how many movies from a franchise you own |
| `collection_missing` | List missing movies from a collection |
| `collection_add_missing` | Add missing collection items to Radarr |

#### Admin Tools

| Tool | Description |
|------|-------------|
| `tmdb_collection` | Look up a movie collection by name or ID |
| `tmdb_similar` | Find movies similar to a given title |
| `tmdb_recommendations` | Get recommendations based on a movie |
| `tmdb_search` | Search TMDB for movies by title |

## Example Usage

Once configured, you can interact naturally with Claude:

- "Add Breaking Bad to my TV library"
- "What TV shows do I have?"
- "Add Inception to my movie library in 4K"
- "What's downloading right now?"
- "Are there any stuck imports?"
- "Check system health"
- "Find cleanup opportunities"
- "Show me movies I haven't watched in over a year"
- "Find duplicate movies in Plex"
- "Pause all downloads"
- "What requests are pending?"
- "Approve the request for Inception"
- "Show me trending movies"
- "What issues have been reported?"
- "What MCU movies am I missing?"
- "Find movies similar to Inception that I don't own"
- "Show me the Star Wars collection"
- "Add missing Marvel movies to Radarr"

## Development

```bash
# Build
pnpm build

# Type check
pnpm typecheck

# Watch mode
pnpm dev
```

## License

MIT
