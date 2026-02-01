# Configuration Reference

arrs-mcp-server connects to your media services through a configuration file, environment variables, or both. This page covers every option.

## How Configuration Works

The server reads settings from two sources:

1. **config.json** -- a JSON file in your working directory (or a custom path).
2. **Environment variables** -- individual variables for each service.

Environment variables take precedence. When both sources define the same service, the environment variable version wins and the config.json version is ignored for that service. The merge happens per-service, not per-field. See [Precedence Rules](#precedence-rules) for details.

At least one service must be fully configured or the server will refuse to start.

## Quick Start

You only need one service to get started. Copy the example config and fill in one block:

```bash
cp config.example.json config.json
```

Edit `config.json` to include just Sonarr:

```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "abc123def456ghi789jkl012mno345"
  }
}
```

That's it. The server will start with Sonarr tools available. Add more services when you are ready.

## config.json Reference

The file `config.json` sits in your working directory by default. It is gitignored so your credentials stay out of version control. Use `config.example.json` as a starting template.

To place the file elsewhere, set the `CONFIG_PATH` environment variable:

```bash
export CONFIG_PATH=/etc/arrs-mcp/config.json
```

Here is a complete example with all seven services:

```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "abc123def456ghi789jkl012mno345"
  },
  "radarr": {
    "url": "http://localhost:7878",
    "apiKey": "fed987cba654xyz321wvu098tsr765"
  },
  "radarr4k": {
    "url": "http://localhost:7879",
    "apiKey": "aaa111bbb222ccc333ddd444eee555"
  },
  "plex": {
    "url": "http://localhost:32400",
    "token": "xxxx-your-plex-token-xxxx"
  },
  "sabnzbd": {
    "url": "http://localhost:8080",
    "apiKey": "fff666ggg777hhh888iii999jjj000"
  },
  "overseerr": {
    "url": "http://localhost:5055",
    "apiKey": "kkk111lll222mmm333nnn444ooo555"
  },
  "tmdb": {
    "apiKey": "ppp666qqq777rrr888sss999ttt000"
  }
}
```

Every service block is optional. Include only the services you run.

---

## Service Configuration

### Sonarr (TV Show Management)

Sonarr manages your TV show library. It searches for episodes, monitors series, and sends downloads to your download client.

**config.json format:**

```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "abc123def456ghi789jkl012mno345"
  }
}
```

**Environment variables:**

```bash
export SONARR_URL="http://localhost:8989"
export SONARR_API_KEY="abc123def456ghi789jkl012mno345"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Base URL of your Sonarr instance. Include the port. |
| `apiKey` | Yes | API key for authentication. |

**Finding your API key:**

1. Open Sonarr in your browser.
2. Go to **Settings** then **General**.
3. Scroll to the **Security** section.
4. Copy the **API Key** value.

**Notes:**

- Default port is `8989`.
- The server uses the `/api/v3` endpoint.
- Authentication uses the `X-Api-Key` header.

---

### Radarr (Movie Management, HD)

Radarr manages your movie library. It handles searching, downloading, and organizing movies.

> **Safety by Default:** Quality defaults to `'hd'`. When you add a movie through the MCP tools, it routes to your HD Radarr instance unless you explicitly pass `quality: '4k'`. This prevents accidental 4K downloads that use large amounts of disk space.

**config.json format:**

```json
{
  "radarr": {
    "url": "http://localhost:7878",
    "apiKey": "fed987cba654xyz321wvu098tsr765"
  }
}
```

**Environment variables:**

```bash
export RADARR_URL="http://localhost:7878"
export RADARR_API_KEY="fed987cba654xyz321wvu098tsr765"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Base URL of your Radarr instance. Include the port. |
| `apiKey` | Yes | API key for authentication. |

**Finding your API key:**

1. Open Radarr in your browser.
2. Go to **Settings** then **General**.
3. Scroll to the **Security** section.
4. Copy the **API Key** value.

**Notes:**

- Default port is `7878`.
- The server uses the `/api/v3` endpoint.
- Authentication uses the `X-Api-Key` header.
- All movie tools default to this HD instance. To target 4K, pass `quality: '4k'` explicitly.

---

### Radarr 4K (Movie Management, 4K)

Radarr 4K is a second Radarr instance dedicated to 4K content. It is completely optional. If you run a single Radarr instance for all qualities, skip this section.

**config.json format:**

```json
{
  "radarr4k": {
    "url": "http://localhost:7879",
    "apiKey": "aaa111bbb222ccc333ddd444eee555"
  }
}
```

**Environment variables:**

```bash
export RADARR4K_URL="http://localhost:7879"
export RADARR4K_API_KEY="aaa111bbb222ccc333ddd444eee555"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Base URL of your 4K Radarr instance. Include the port. |
| `apiKey` | Yes | API key for authentication. |

**Finding your API key:**

1. Open your **4K Radarr instance** in your browser.
2. Go to **Settings** then **General**.
3. Scroll to the **Security** section.
4. Copy the **API Key** value.

**Notes:**

- Default port is `7879` (one above standard Radarr).
- This instance is only used when you pass `quality: '4k'` to a movie tool.
- It shares the same client code as the HD Radarr instance.

---

### Plex (Media Library)

Plex is your media server. The MCP server uses it to read library data, check watch status, and manage collections.

**config.json format:**

```json
{
  "plex": {
    "url": "http://localhost:32400",
    "token": "xxxx-your-plex-token-xxxx"
  }
}
```

**Environment variables:**

```bash
export PLEX_URL="http://localhost:32400"
export PLEX_TOKEN="xxxx-your-plex-token-xxxx"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Base URL of your Plex server. Include the port. |
| `token` | Yes | Plex authentication token. Note: this is `token`, not `apiKey`. |

**Finding your Plex token:**

Plex uses an authentication token instead of an API key. Follow the official guide:

[Finding an authentication token (X-Plex-Token)](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/)

The short version:

1. Sign into Plex Web App.
2. Browse to any media item.
3. Click **Get Info** (or **View XML**).
4. Look for `X-Plex-Token` in the URL.

**Notes:**

- Default port is `32400`.
- Authentication uses the `X-Plex-Token` header.
- Plex uses `token` in the config, not `apiKey`. This is the only service with a different field name.

---

### SABnzbd (Download Client)

SABnzbd is a Usenet download client. The MCP server uses it to monitor download queues, manage items, and check download status.

**config.json format:**

```json
{
  "sabnzbd": {
    "url": "http://localhost:8080",
    "apiKey": "fff666ggg777hhh888iii999jjj000"
  }
}
```

**Environment variables:**

```bash
export SABNZBD_URL="http://localhost:8080"
export SABNZBD_API_KEY="fff666ggg777hhh888iii999jjj000"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Base URL of your SABnzbd instance. Include the port. |
| `apiKey` | Yes | API key for authentication. |

**Finding your API key:**

1. Open SABnzbd in your browser.
2. Go to **Config** then **General**.
3. Copy the **API Key** value.

**Notes:**

- Default port is `8080`.
- Authentication passes the API key as a query parameter (not a header).

---

### Overseerr (Request Management)

Overseerr handles media requests from your users. The MCP server can list, approve, and decline requests, and manage user quotas.

**config.json format:**

```json
{
  "overseerr": {
    "url": "http://localhost:5055",
    "apiKey": "kkk111lll222mmm333nnn444ooo555"
  }
}
```

**Environment variables:**

```bash
export OVERSEERR_URL="http://localhost:5055"
export OVERSEERR_API_KEY="kkk111lll222mmm333nnn444ooo555"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `url` | Yes | Base URL of your Overseerr instance. Include the port. |
| `apiKey` | Yes | API key for authentication. |

**Finding your API key:**

1. Open Overseerr in your browser.
2. Go to **Settings** then **General**.
3. Copy the **API Key** value.

**Notes:**

- Default port is `5055`.
- The server uses the `/api/v1` endpoint.
- Authentication uses the `X-Api-Key` header.

---

### TMDB (The Movie Database)

TMDB provides movie and TV metadata, images, and recommendations. It is a free public API. No self-hosted server is needed.

**config.json format:**

```json
{
  "tmdb": {
    "apiKey": "ppp666qqq777rrr888sss999ttt000"
  }
}
```

**Environment variable:**

```bash
export TMDB_API_KEY="ppp666qqq777rrr888sss999ttt000"
```

**Fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `apiKey` | Yes | Your TMDB API key (v3 auth). |

There is no `url` field. The TMDB API endpoint (`https://api.themoviedb.org/3`) is built into the server.

**Getting your API key:**

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/).
2. Go to your account settings.
3. Click **API** in the left sidebar.
4. Request an API key (select "Developer" usage).
5. Copy the **API Key (v3 auth)** value.

**Notes:**

- TMDB is the only service that requires just one field (`apiKey`).
- No URL configuration is needed or supported.
- The environment variable `TMDB_API_KEY` alone is sufficient (no pair needed).

---

## Environment Variable Reference

All 14 environment variables in one table:

| Variable | Service | Maps to config.json | Required with |
|----------|---------|---------------------|---------------|
| `CONFIG_PATH` | System | Path to config.json file | (standalone) |
| `SONARR_URL` | Sonarr | `sonarr.url` | `SONARR_API_KEY` |
| `SONARR_API_KEY` | Sonarr | `sonarr.apiKey` | `SONARR_URL` |
| `RADARR_URL` | Radarr | `radarr.url` | `RADARR_API_KEY` |
| `RADARR_API_KEY` | Radarr | `radarr.apiKey` | `RADARR_URL` |
| `RADARR4K_URL` | Radarr 4K | `radarr4k.url` | `RADARR4K_API_KEY` |
| `RADARR4K_API_KEY` | Radarr 4K | `radarr4k.apiKey` | `RADARR4K_URL` |
| `PLEX_URL` | Plex | `plex.url` | `PLEX_TOKEN` |
| `PLEX_TOKEN` | Plex | `plex.token` | `PLEX_URL` |
| `SABNZBD_URL` | SABnzbd | `sabnzbd.url` | `SABNZBD_API_KEY` |
| `SABNZBD_API_KEY` | SABnzbd | `sabnzbd.apiKey` | `SABNZBD_URL` |
| `OVERSEERR_URL` | Overseerr | `overseerr.url` | `OVERSEERR_API_KEY` |
| `OVERSEERR_API_KEY` | Overseerr | `overseerr.apiKey` | `OVERSEERR_URL` |
| `TMDB_API_KEY` | TMDB | `tmdb.apiKey` | (standalone) |

Most services need both variables set. If you set only one of a pair (for example `SONARR_URL` without `SONARR_API_KEY`), the environment configuration for that service is ignored.

The two exceptions are `CONFIG_PATH` (system-level, not a service) and `TMDB_API_KEY` (TMDB has no URL to configure).

---

## Docker and Container Configuration

Environment variables are the recommended approach for containers. You never need to mount a config.json file.

**Docker run example:**

```bash
docker run -d \
  -e SONARR_URL="http://sonarr:8989" \
  -e SONARR_API_KEY="abc123def456ghi789jkl012mno345" \
  -e RADARR_URL="http://radarr:7878" \
  -e RADARR_API_KEY="fed987cba654xyz321wvu098tsr765" \
  -e PLEX_URL="http://plex:32400" \
  -e PLEX_TOKEN="xxxx-your-plex-token-xxxx" \
  arrs-mcp-server
```

**Docker Compose example:**

```yaml
services:
  arrs-mcp:
    image: arrs-mcp-server
    environment:
      SONARR_URL: "http://sonarr:8989"
      SONARR_API_KEY: "abc123def456ghi789jkl012mno345"
      RADARR_URL: "http://radarr:7878"
      RADARR_API_KEY: "fed987cba654xyz321wvu098tsr765"
      RADARR4K_URL: "http://radarr4k:7879"
      RADARR4K_API_KEY: "aaa111bbb222ccc333ddd444eee555"
      PLEX_URL: "http://plex:32400"
      PLEX_TOKEN: "xxxx-your-plex-token-xxxx"
      SABNZBD_URL: "http://sabnzbd:8080"
      SABNZBD_API_KEY: "fff666ggg777hhh888iii999jjj000"
      OVERSEERR_URL: "http://overseerr:5055"
      OVERSEERR_API_KEY: "kkk111lll222mmm333nnn444ooo555"
      TMDB_API_KEY: "ppp666qqq777rrr888sss999ttt000"
```

In Docker networking, use container names (like `http://sonarr:8989`) instead of `localhost`.

---

## Precedence Rules

When both config.json and environment variables define the same service, the environment variable version replaces the config.json version entirely.

The merge is **per-service, not per-field**. This means you cannot set the URL in config.json and the API key in an environment variable for the same service. If you set `SONARR_URL` and `SONARR_API_KEY` as environment variables, the entire `sonarr` block from config.json is ignored.

**Example:**

Given this config.json:

```json
{
  "sonarr": {
    "url": "http://localhost:8989",
    "apiKey": "key-from-file"
  },
  "radarr": {
    "url": "http://localhost:7878",
    "apiKey": "key-from-file"
  }
}
```

And these environment variables:

```bash
export SONARR_URL="http://nas:8989"
export SONARR_API_KEY="key-from-env"
```

The result:

- **Sonarr** uses `http://nas:8989` with `key-from-env` (environment wins).
- **Radarr** uses `http://localhost:7878` with `key-from-file` (file is used, no env vars set).

**What does NOT work:**

```bash
# Setting only one of the pair does nothing for env-based config
export SONARR_URL="http://nas:8989"
# SONARR_API_KEY is not set
# Result: Sonarr falls back entirely to config.json
```

Both environment variables in a pair must be set for the environment configuration to take effect. The only exception is `TMDB_API_KEY`, which stands alone.

---

## Troubleshooting

If the server fails to start, check these common issues:

- **"No services configured"** -- No service has both required fields set. Verify your config.json exists and is valid JSON, or check that your environment variables are exported.
- **Incomplete service warning** -- You set one field but not the other (for example, a URL without an API key). Both fields are required.
- **Wrong config.json location** -- The server looks in the current working directory by default. Use `CONFIG_PATH` to point to a different location.
- **Invalid JSON** -- The server logs a warning and continues without file config. Check for trailing commas or missing quotes in your config.json.
- **Plex not connecting** -- Verify you used `token` (not `apiKey`) in the Plex config block.

For more troubleshooting help, see [troubleshooting.md](troubleshooting.md).
