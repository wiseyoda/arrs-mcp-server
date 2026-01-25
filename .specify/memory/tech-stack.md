# Tech Stack

> **Agents**: Reference this for approved technologies and patterns.

**Last Updated**: 2026-01-24

## Runtime

| Component | Technology | Version | Notes |
|-----------|------------|---------|-------|
| Language | TypeScript | 5.x | Strict mode enabled |
| Runtime | Node.js | 20+ LTS | ES modules |
| Package Manager | pnpm | Latest | Per global preferences |

## Dependencies

### Core

| Package | Purpose | Required |
|---------|---------|----------|
| `@modelcontextprotocol/sdk` | MCP server implementation | Yes |
| `zod` | Input validation + schema generation | Yes |

### HTTP/Networking

| Package | Purpose | Required |
|---------|---------|----------|
| Native `fetch` | HTTP client | Yes (built-in) |

### Development

| Package | Purpose | Required |
|---------|---------|----------|
| `typescript` | Type checking and compilation | Yes |
| `vitest` | Testing (if added later) | Optional |
| `prettier` | Code formatting | Yes |
| `eslint` | Linting | Yes |
| `@types/node` | Node.js type definitions | Yes |

## Configuration

### Environment Variables

```bash
# Service URLs (required)
SONARR_URL=https://your-sonarr-url.com
SONARR_API_KEY=your-api-key

RADARR_URL=https://your-radarr-url.com
RADARR_API_KEY=your-api-key

RADARR4K_URL=https://your-radarr4k-url.com
RADARR4K_API_KEY=your-api-key

PLEX_URL=https://your-plex-url.com
PLEX_TOKEN=your-plex-token

SABNZBD_URL=https://your-sabnzbd-url.com
SABNZBD_API_KEY=your-api-key
```

### Config File Alternative

```json
{
  "sonarr": {
    "url": "https://...",
    "apiKey": "..."
  },
  "radarr": {
    "url": "https://...",
    "apiKey": "..."
  },
  "radarr4k": {
    "url": "https://...",
    "apiKey": "..."
  },
  "plex": {
    "url": "https://...",
    "token": "..."
  },
  "sabnzbd": {
    "url": "https://...",
    "apiKey": "..."
  }
}
```

## Project Structure

```
arrs-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config.ts             # Configuration loading
│   ├── services/
│   │   ├── sonarr/
│   │   │   ├── client.ts     # API client
│   │   │   ├── tools.ts      # MCP tool registrations
│   │   │   ├── types.ts      # TypeScript types
│   │   │   └── index.ts      # Exports
│   │   ├── radarr/           # (Phase 0020)
│   │   ├── plex/             # (Phase 0030)
│   │   └── sabnzbd/          # (Phase 0040)
│   ├── tools/                # Cross-service tools
│   │   ├── index.ts          # Tool registration exports
│   │   ├── system-health.ts  # Health check across services
│   │   ├── media-help.ts     # Help system
│   │   └── downloads-status.ts # Unified download status
│   └── shared/
│       ├── http.ts           # Shared HTTP utilities
│       └── errors.ts         # Error handling
├── dist/                     # Compiled output (gitignored)
├── config.json               # Local config (gitignored)
├── package.json
├── tsconfig.json
└── .gitignore
```

## Build & Run

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run (for testing)
node dist/index.js

# Development (with watch)
pnpm dev
```

## MCP Configuration

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/path/to/arrs-mcp-server/dist/index.js"]
    }
  }
}
```

### Claude Code

`.claude/settings.json`:

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/path/to/arrs-mcp-server/dist/index.js"]
    }
  }
}
```

## Transport

- **Type**: stdio (stdin/stdout JSON-RPC)
- **Timeout**: 30 seconds default for all API calls
- **Logging**: stderr only (stdout reserved for MCP protocol)
