# arrs-mcp-server

MCP server for managing Sonarr, Radarr, Plex, and Sabnzbd through Claude.

## Features

- **TV Show Management** (Sonarr): Search, add, list, and manage TV series
- **Download Monitoring**: View queue, track progress, fix stuck imports
- **System Health**: Check service connectivity and identify issues
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
export SONARR_URL="http://localhost:8989"
export SONARR_API_KEY="your-api-key"
```

### Option 2: Config File

Create `config.json` in the project root:

```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "your-api-key"
  }
}
```

See `config.example.json` for all available options.

### Finding Your API Key

- **Sonarr**: Settings → General → Security → API Key

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
        "SONARR_API_KEY": "your-api-key"
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
| `system_health` | Check health of all configured services |
| `downloads_status` | Unified download status across all services |
| `media_help` | Get help and list available tools |

### TV Show Tools (Sonarr)

#### Semantic Tools (User-Facing)

| Tool | Description |
|------|-------------|
| `tv_search` | Search for TV series by name |
| `tv_add` | Add a TV series to Sonarr |
| `tv_list` | List all TV series |
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

## Example Usage

Once configured, you can interact naturally with Claude:

- "Add Breaking Bad to my TV library"
- "What TV shows do I have?"
- "What's downloading right now?"
- "Are there any stuck imports?"
- "Check system health"
- "Search for missing episodes"

## Development

```bash
# Build
pnpm build

# Type check
pnpm typecheck

# Watch mode
pnpm dev
```

## Roadmap

- [ ] Phase 1: Foundation + Sonarr (current)
- [ ] Phase 2: Radarr (HD and 4K)
- [ ] Phase 3: Plex
- [ ] Phase 4: Sabnzbd
- [ ] Phase 5: Polish & Extended Features

## License

MIT
