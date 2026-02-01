# arrs-mcp-server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server that lets Claude manage your media stack -- Sonarr, Radarr, Plex, SABnzbd, Overseerr, and TMDB -- through natural conversation.

Ask Claude to add a show, check what's downloading, clean up your library, or complete a movie franchise. The server translates your requests into the right API calls across all your services.

## Quick Start

**Prerequisites**: Node.js 20+ and pnpm.

```bash
git clone https://github.com/yourusername/arrs-mcp-server.git
cd arrs-mcp-server
pnpm install
pnpm build
```

Create a `config.json` in the project root with at least one service:

```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "your-sonarr-api-key"
  }
}
```

That's enough to start. Add more services as you go -- see [Configuration](docs/configuration.md) for all options.

## Connect to Claude

### Claude Desktop

Add the server to your Claude Desktop config file:

| OS | Config file path |
|----|------------------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/absolute/path/to/arrs-mcp-server/dist/index.js"],
      "env": {
        "SONARR_URL": "http://localhost:8989",
        "SONARR_API_KEY": "your-sonarr-api-key",
        "RADARR_URL": "http://localhost:7878",
        "RADARR_API_KEY": "your-radarr-api-key",
        "PLEX_URL": "http://localhost:32400",
        "PLEX_TOKEN": "your-plex-token"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Claude Code

Add to your project settings (`.claude/settings.json`) or user settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/absolute/path/to/arrs-mcp-server/dist/index.js"],
      "env": {
        "SONARR_URL": "http://localhost:8989",
        "SONARR_API_KEY": "your-sonarr-api-key"
      }
    }
  }
}
```

Include only the environment variables for services you use. See the full [environment variable reference](docs/configuration.md#environment-variable-reference).

## What You Can Do

88 tools across 7 services. You don't need to know tool names -- just describe what you want.

**Manage TV shows and movies**
- "Add Breaking Bad to Sonarr"
- "Add Inception to my movies in 4K"
- "What movies do I have?"

**Monitor downloads**
- "What's downloading right now?"
- "Pause all downloads"
- "Are there any stuck imports?"

**Browse and clean your library**
- "Show me movies I haven't watched in over a year"
- "I need to free up 100 GB -- what should I delete?"
- "Find duplicate movies"

**Complete franchises**
- "What MCU movies am I missing?"
- "Add all missing Star Wars movies"

**Handle requests**
- "Any pending requests?"
- "Approve the request for Oppenheimer"

**Check system health**
- "Is everything working?"
- "Run a library audit"

> **Safety by Default**: Movie tools route to your HD Radarr instance unless you explicitly say "in 4K" or pass `quality: '4k'`. This prevents accidental 4K downloads that consume large amounts of disk space.

See [Example Conversations](docs/examples.md) for complete workflows.

## Features

| Service | What it does | Tool count |
|---------|-------------|------------|
| **Sonarr** | Search, add, and manage TV series. Monitor episodes, check calendars, handle stuck imports. | 17 |
| **Radarr** | Search, add, and manage movies. Supports dual HD/4K instances with safe quality routing. | 15 |
| **Plex** | Browse libraries, check watch status, find unwatched content, manage collections, delete items. | 12 |
| **SABnzbd** | Monitor download queue, pause/resume, manage priorities, handle failures. | 14 |
| **Overseerr** | List, approve, and decline requests. Manage users, quotas, issues. Browse trending titles. | 14 |
| **TMDB** | Look up franchises, find similar movies, get recommendations. Identify missing collection items. | 7 |
| **Cross-service** | System health, unified download status, cleanup analysis, library audit, space planning, watch analytics. | 9 |

Only configured services register their tools. If you only set up Sonarr and Plex, you get 29 tools instead of 88.

Browse the full [Tool Catalog](docs/tools.md) for parameters, examples, and cross-references.

## Configuration

Two ways to configure:

1. **config.json** in your working directory (or a custom path via `CONFIG_PATH`)
2. **Environment variables** for each service

Environment variables take precedence per-service. You only need one service to start.

See [Configuration Reference](docs/configuration.md) for all 7 services, Docker setup, and precedence rules.

## Documentation

| Guide | Description |
|-------|-------------|
| [Configuration](docs/configuration.md) | All services, environment variables, Docker, precedence rules |
| [Tool Catalog](docs/tools.md) | All 88 tools with parameters, examples, and cross-references |
| [Example Conversations](docs/examples.md) | 7 real workflows showing multi-step tool usage |
| [Troubleshooting](docs/troubleshooting.md) | 16+ error scenarios with causes and fixes |
| [CLAUDE.md](CLAUDE.md) | Architecture and development guide for contributors |

## Development

```bash
pnpm build        # Compile TypeScript
pnpm typecheck    # Type check without emitting
pnpm dev          # Watch mode
pnpm lint         # ESLint
pnpm format       # Prettier
```

See [CLAUDE.md](CLAUDE.md) for architecture, patterns, and how to add new tools or services.

## License

MIT
