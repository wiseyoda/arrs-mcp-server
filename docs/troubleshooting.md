# Troubleshooting

This guide covers the most common errors you may encounter with arrs-mcp-server. Each section describes what went wrong, why, and how to fix it.

## Quick Diagnostic Steps

Before diving into specific errors, run these two built-in tools. They cover most problems in under a minute.

**Step 1: Check which services are configured.**

Ask Claude to run the `providers_status` tool. It lists every provider, shows which ones are configured, and prints setup instructions for missing ones.

**Step 2: Check service health.**

Ask Claude to run the `system_health` tool with `verbose: true`. It connects to each configured service and reports errors, warnings, and basic stats.

If both tools return clean results, your server is configured correctly and all services are reachable.

---

## Connection Errors

### ECONNREFUSED

**What you see:**

```
[Sonarr] Cannot connect to the server. Please verify:
- The service is running
- The URL is correct
- Your network connection is working
```

**Why it happens:** The server tried to open a TCP connection, but nothing was listening on that host and port. The service is either stopped, on a different port, or blocked by a firewall.

**How to fix:**

1. Confirm the service is running. Open its web UI in a browser (for example, `http://192.168.1.50:8989` for Sonarr).
2. Check your config.json or environment variables for typos in the URL.
   ```json
   {
     "sonarr": {
       "url": "http://192.168.1.50:8989",
       "apiKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
     }
   }
   ```
3. If the service runs in Docker, make sure the container is started and the port is published (`docker ps`).
4. If a firewall is active, allow the port through (for example, `sudo ufw allow 8989` on Linux).

**Verify:** Open the service URL in a browser. If the web UI loads, the connection will work.

---

### ETIMEDOUT / Request Timed Out

**What you see:**

```
[Radarr] The request timed out. The server may be slow or unavailable.
```

**Why it happens:** The server accepted the connection but did not respond within the 30-second timeout. Common causes: the service is overloaded, the network path is slow, or the host exists but the port is wrong. When the port is wrong, traffic is silently dropped instead of refused.

**How to fix:**

1. Try opening the service web UI in a browser. If it loads slowly, the service itself is the bottleneck.
2. Check for a network issue between the machine running arrs-mcp-server and the service host. Run `ping 192.168.1.50` to test basic connectivity.
3. If you are reaching across VPNs or subnets, confirm that routing is working.
4. For large Plex libraries, the initial library scan may be slow. Wait for it to finish before retrying.

**Verify:** The web UI responds quickly in a browser.

---

### DNS Resolution Failure

**What you see:**

```
[Plex] Network error: getaddrinfo ENOTFOUND my-plex-server
```

**Why it happens:** The hostname in your URL cannot be resolved to an IP address. This is usually a typo, a local DNS name that only works on certain networks, or a `.local` mDNS name that is not resolvable from the current machine.

**How to fix:**

1. Double-check the hostname in your config. Common mistake: using `plex.local` when the machine does not support mDNS.
2. Try replacing the hostname with an IP address.
   ```json
   {
     "plex": {
       "url": "http://192.168.1.50:32400",
       "token": "Abc123XyZ456Def789Ghi012"
     }
   }
   ```
3. If you need the hostname, add it to `/etc/hosts` on the machine running the MCP server.

**Verify:** Run `nslookup my-plex-server` or `ping my-plex-server` to confirm the name resolves.

---

## Authentication Errors

### 401 Unauthorized

**What you see:**

```
[Sonarr] Authentication failed. Please check your API key.
```

**Why it happens:** The API key you provided is wrong, expired, or was recently rotated. The service rejected the request.

**How to fix:**

1. Open the service web UI. Navigate to Settings > General to find the current API key.
   - Sonarr: `http://192.168.1.50:8989/settings/general`
   - Radarr: `http://192.168.1.50:7878/settings/general`
   - SABnzbd: `http://192.168.1.50:8080/config/general/`
   - Overseerr: `http://192.168.1.50:5055/settings`
2. Copy the API key exactly. No trailing spaces, no extra quotes.
3. Update your config.json or environment variable with the correct key.
   ```json
   {
     "sonarr": {
       "url": "http://192.168.1.50:8989",
       "apiKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
     }
   }
   ```
4. Restart arrs-mcp-server (or restart Claude Desktop / Claude Code).

**Verify:** Ask Claude to run `system_health`. The service should show status OK.

---

### 403 Forbidden

**What you see:**

```
[Radarr] Access denied. Your API key may not have sufficient permissions.
```

**Why it happens:** The API key is valid but does not have permission for the requested action. Some services allow read-only keys or restrict certain operations.

**How to fix:**

1. In the service web UI, check if your API key has full access (not read-only).
2. In Sonarr/Radarr, go to Settings > General and verify the API key type. The default key has full access.
3. If you regenerated the key, update your config to match.

**Verify:** Try a read-only operation (like listing shows or movies) first. If that works but writes fail, the key is restricted.

---

## Configuration Errors

### No Services Configured

**What you see:**

```
No services configured. Please set environment variables
(SONARR_URL, SONARR_API_KEY, etc.) or create a config.json file.
See config.example.json for the expected format.
```

**Why it happens:** arrs-mcp-server could not find any service configuration. Neither config.json nor environment variables were set.

**How to fix:**

1. Create a `config.json` file in the project root (next to `package.json`).
   ```json
   {
     "sonarr": {
       "url": "http://192.168.1.50:8989",
       "apiKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
     },
     "radarr": {
       "url": "http://192.168.1.50:7878",
       "apiKey": "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5"
     }
   }
   ```
2. Or set environment variables:
   ```bash
   export SONARR_URL="http://192.168.1.50:8989"
   export SONARR_API_KEY="a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
   ```
3. You only need to configure the services you actually use. At least one service must be configured.

**Verify:** Run `providers_status` through Claude. At least one provider should appear under "Configured."

---

### Provider Not Configured

**What you see:**

```
Sonarr is not configured. This tool requires Sonarr.

To configure, add to config.json:
{
  "sonarr": {
    "url": "http://your-sonarr:8989",
    "apiKey": "your-api-key"
  }
}

Or set environment variables:
  SONARR_URL=<value>
  SONARR_API_KEY=<value>
```

**Why it happens:** You tried to use a tool that requires a specific service, but that service is not in your configuration. For example, asking about TV shows requires Sonarr.

**How to fix:**

1. Add the missing service to your config.json using the format shown in the error.
2. Or set the environment variables listed in the error.
3. Restart arrs-mcp-server.

**Verify:** Run `providers_status`. The service should move from "Not Configured" to "Configured."

---

### Invalid JSON in config.json

**What you see:**

```
Warning: Failed to parse config file at /path/to/config.json: SyntaxError: Unexpected token
```

Then later:

```
No services configured.
```

**Why it happens:** Your config.json has a JSON syntax error. Common causes are trailing commas, missing quotes, or missing commas between entries.

**How to fix:**

1. Open your config.json and look for syntax issues. Here are common mistakes:

   **Trailing comma (invalid JSON):**
   ```json
   {
     "sonarr": {
       "url": "http://192.168.1.50:8989",
       "apiKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
     }
   }
   ```
   Remove the comma after the last property in each object.

   **Missing comma between sections:**
   ```json
   {
     "sonarr": {
       "url": "http://192.168.1.50:8989",
       "apiKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
     }
     "radarr": {
       "url": "http://192.168.1.50:7878",
       "apiKey": "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5"
     }
   }
   ```
   Add a comma after the closing `}` of the sonarr block.

2. Validate your JSON with an online tool or run:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('config.json','utf-8'))"
   ```

**Verify:** The command above exits without error. Then restart arrs-mcp-server.

---

### Missing Required Fields

**What you see:**

```
Warning: Some services have incomplete configuration: Sonarr (incomplete - need both url and apiKey)
```

**Why it happens:** You provided a URL for a service but forgot the API key, or vice versa. Both fields are required.

**How to fix:**

1. Check your config.json. Every service (except TMDB) needs both `url` and `apiKey`. TMDB only needs `apiKey`. Plex needs `url` and `token`.
   ```json
   {
     "sonarr": {
       "url": "http://192.168.1.50:8989",
       "apiKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
     },
     "plex": {
       "url": "http://192.168.1.50:32400",
       "token": "Abc123XyZ456Def789Ghi012"
     },
     "tmdb": {
       "apiKey": "f8e7d6c5b4a3f8e7d6c5b4a3f8e7d6c5"
     }
   }
   ```
2. If using environment variables, make sure you set both. For example, setting `SONARR_URL` without `SONARR_API_KEY` means Sonarr will not be registered.

**Verify:** Run `providers_status` and confirm the service is listed as "Configured."

---

## Service-Specific Issues

### Sonarr / Radarr: API Version Mismatch

**What you see:**

```
[Sonarr] Request failed with status 404: API request failed: 404 Not Found
```

On every request, even simple list calls.

**Why it happens:** arrs-mcp-server uses the v3 API (`/api/v3`). If you are running a very old version of Sonarr or Radarr that only supports v1 or v2, all requests will return 404.

**How to fix:**

1. Open the Sonarr/Radarr web UI and check the version at the bottom of the page.
2. Sonarr v3+ and Radarr v3+ are required. Update if you are on an older version.
3. Confirm the API works by visiting `http://192.168.1.50:8989/api/v3/system/status?apikey=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4` in your browser. You should see JSON output.

**Verify:** The browser test above returns valid JSON with version information.

---

### Plex: Token vs. API Key

**What you see:**

```
[Plex] Authentication failed. Please check your API key.
```

Or the server connects but returns empty results.

**Why it happens:** Plex uses an authentication token, not an API key. The config field is `token`, not `apiKey`. The token is sent as the `X-Plex-Token` header.

**How to fix:**

1. Find your Plex token. The easiest way:
   - Sign in to Plex Web App at `https://app.plex.tv`.
   - Browse to any media item and click "Get Info" > "View XML."
   - Look at the URL. The `X-Plex-Token` parameter at the end is your token.
2. Use `token` (not `apiKey`) in your config.json:
   ```json
   {
     "plex": {
       "url": "http://192.168.1.50:32400",
       "token": "Abc123XyZ456Def789Ghi012"
     }
   }
   ```
3. Or set environment variables:
   ```bash
   export PLEX_URL="http://192.168.1.50:32400"
   export PLEX_TOKEN="Abc123XyZ456Def789Ghi012"
   ```

**Verify:** Open `http://192.168.1.50:32400/?X-Plex-Token=Abc123XyZ456Def789Ghi012` in a browser. You should see Plex server information as XML.

---

### SABnzbd: API Key as Query Parameter

**What you see:**

```
[SABnzbd] Authentication failed. Please check your API key.
```

Even though you are sure the API key is correct.

**Why it happens:** SABnzbd sends the API key as a URL query parameter, not as a header. If your SABnzbd instance requires a specific "Full Access" API key and you are using the "NZB" key instead, authentication will fail.

**How to fix:**

1. Open SABnzbd web UI: `http://192.168.1.50:8080/config/general/`.
2. Under "Security," find the "API Key" field. This is the Full Access API key. Copy it.
3. Do not use the "NZB Key" -- that one only allows adding NZBs.
4. Update your config:
   ```json
   {
     "sabnzbd": {
       "url": "http://192.168.1.50:8080",
       "apiKey": "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6"
     }
   }
   ```

**Verify:** Visit `http://192.168.1.50:8080/api?mode=version&apikey=c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6&output=json` in a browser. You should see a version number.

---

### Overseerr: Service Not Reachable

**What you see:**

```
[Overseerr] Cannot connect to the server. Please verify:
- The service is running
- The URL is correct
- Your network connection is working
```

**Why it happens:** Overseerr must be running and accessible. It uses `/api/v1` for its REST API. If Overseerr is behind a reverse proxy, the proxy may not pass requests to the API path correctly.

**How to fix:**

1. Open the Overseerr web UI at `http://192.168.1.50:5055`. If the UI loads, the service is running.
2. Test the API directly: `http://192.168.1.50:5055/api/v1/status`.
3. If you use a reverse proxy, make sure it forwards `/api/v1` paths.
4. Get your API key from Overseerr Settings > General.
   ```json
   {
     "overseerr": {
       "url": "http://192.168.1.50:5055",
       "apiKey": "d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1"
     }
   }
   ```

**Verify:** The status endpoint returns JSON in a browser.

---

### TMDB: Rate Limiting

**What you see:**

```
[TMDB] Too many requests. Please wait a moment and try again.
```

**Why it happens:** TMDB limits requests to approximately 40 per 10 seconds. If you make many collection or search requests in a row, you will hit this limit.

**How to fix:**

1. Wait 10-15 seconds and try again. The rate limit resets quickly.
2. Avoid running multiple TMDB-heavy operations at the same time.
3. If you consistently hit the limit, reduce the number of concurrent searches or collection lookups.

**Verify:** Wait a moment and retry the request. It should succeed.

---

## Claude Desktop Setup

### Config File Location

Claude Desktop reads its MCP server configuration from a JSON file. The location depends on your operating system:

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Correct Configuration

Add `arrs-mcp-server` to the `mcpServers` section. Use the absolute path to `dist/index.js`:

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/Users/yourname/dev/arrs-mcp-server/dist/index.js"],
      "env": {
        "SONARR_URL": "http://192.168.1.50:8989",
        "SONARR_API_KEY": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "RADARR_URL": "http://192.168.1.50:7878",
        "RADARR_API_KEY": "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5",
        "PLEX_URL": "http://192.168.1.50:32400",
        "PLEX_TOKEN": "Abc123XyZ456Def789Ghi012"
      }
    }
  }
}
```

You can also use a config.json file instead of `env` variables. Set the `CONFIG_PATH` environment variable to point to it:

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/Users/yourname/dev/arrs-mcp-server/dist/index.js"],
      "env": {
        "CONFIG_PATH": "/Users/yourname/dev/arrs-mcp-server/config.json"
      }
    }
  }
}
```

### Wrong Path to dist/index.js

**What you see:** Claude Desktop does not show any arrs-mcp-server tools. No errors appear, but the MCP server is not loaded.

**Why it happens:** The path to `dist/index.js` is wrong or the project was not built.

**How to fix:**

1. Build the project first:
   ```bash
   cd /Users/yourname/dev/arrs-mcp-server
   pnpm build
   ```
2. Verify the file exists:
   ```bash
   ls -la /Users/yourname/dev/arrs-mcp-server/dist/index.js
   ```
3. Use an absolute path in the Claude Desktop config. Do not use `~` or relative paths.

**Verify:** The `dist/index.js` file exists and is not empty.

---

### Not Restarting After Config Change

**What you see:** You updated the Claude Desktop config file but nothing changed. Old configuration is still in effect.

**Why it happens:** Claude Desktop reads the config file at startup. Changes take effect only after a restart.

**How to fix:**

1. Quit Claude Desktop completely (not just close the window).
2. Reopen Claude Desktop.
3. Verify by asking Claude to run `providers_status`.

**Verify:** The tools appear and `providers_status` reflects your updated configuration.

---

### JSON Syntax Errors in Claude Desktop Config

**What you see:** Claude Desktop launches but no MCP servers load. No tools appear.

**Why it happens:** The `claude_desktop_config.json` file has a JSON syntax error.

**How to fix:**

1. Open the config file and check for common JSON errors:
   - Trailing commas after the last item in an object or array.
   - Missing commas between entries.
   - Unquoted keys or single quotes instead of double quotes.
2. Validate the file:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('$HOME/Library/Application Support/Claude/claude_desktop_config.json','utf-8'))"
   ```
3. Fix any syntax errors and restart Claude Desktop.

**Verify:** The validation command above exits without error.

---

### Checking Claude Desktop Logs

If tools fail to load and you cannot determine why, check the Claude Desktop logs:

- **macOS:** `~/Library/Logs/Claude/` -- look for the most recent log file.
- **Windows:** `%APPDATA%\Claude\logs\`
- **Linux:** `~/.config/Claude/logs/`

Search for "arrs" or "mcp" in the log file to find relevant error messages.

---

## Claude Code Setup

### Config Locations

Claude Code reads MCP server configuration from:

- **Project-level:** `.mcp.json` in the project root.
- **User-level:** `~/.claude/settings.json` in the `mcpServers` section.

### Project-Level Config (.mcp.json)

Create a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "arrs": {
      "command": "node",
      "args": ["/Users/yourname/dev/arrs-mcp-server/dist/index.js"],
      "env": {
        "SONARR_URL": "http://192.168.1.50:8989",
        "SONARR_API_KEY": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
        "RADARR_URL": "http://192.168.1.50:7878",
        "RADARR_API_KEY": "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5"
      }
    }
  }
}
```

### Common Issues with Claude Code

**Relative paths do not work.**

The `args` array must contain absolute paths. This will fail:

```json
{
  "args": ["./dist/index.js"]
}
```

Use the full path instead:

```json
{
  "args": ["/Users/yourname/dev/arrs-mcp-server/dist/index.js"]
}
```

**Project not built.**

If you see errors about missing files or modules, build first:

```bash
cd /Users/yourname/dev/arrs-mcp-server
pnpm install
pnpm build
```

### Debugging Checklist for Claude Code

1. Confirm the project is built: `ls /Users/yourname/dev/arrs-mcp-server/dist/index.js`
2. Confirm the path in `.mcp.json` or `settings.json` is absolute and correct.
3. Confirm at least one service is configured via `env` in the MCP config.
4. Restart Claude Code after any config change.
5. Ask Claude to run `providers_status` to verify the server loaded.

---

## Timeout Issues

### Default Timeout Behavior

The HTTP client uses a 30-second timeout for all requests. If a service does not respond within 30 seconds, the request is aborted and a timeout error is returned.

**What you see:**

```
[Plex] The request timed out. The server may be slow or unavailable.
```

**Why it happens:**

- The service is under heavy load (for example, Plex scanning a large library).
- A network issue is causing slow responses.
- The service is hung or in a bad state.

**How to fix:**

1. Check if the service web UI is responsive. If it is slow there too, the service itself is the problem.
2. Wait for resource-intensive operations to finish (library scans, large imports).
3. Restart the service if it appears hung.
4. If you consistently hit timeouts, check the service host for resource issues (CPU, memory, disk).

**Verify:** The service web UI loads quickly and responds to clicks without delay.

---

## Rate Limiting

### TMDB Rate Limits

TMDB enforces a limit of approximately 40 requests per 10 seconds. This applies to all API calls including search, collection lookup, recommendations, and trending.

**What you see:**

```
[TMDB] Too many requests. Please wait a moment and try again.
```

**How to fix:**

1. Wait 10-15 seconds. The limit resets automatically.
2. Avoid running bulk operations that make many TMDB calls at once.

### Local Services

Sonarr, Radarr, Plex, SABnzbd, and Overseerr generally do not rate limit local connections. If you see 429 errors from these services, it is unusual. Check if a reverse proxy or security layer is throttling requests.

---

## Service Unavailability

### Docker Containers Not Started

**What you see:**

```
[Sonarr] Cannot connect to the server.
```

**Why it happens:** If your services run in Docker, the containers may not have started after a reboot or Docker restart.

**How to fix:**

1. Check running containers:
   ```bash
   docker ps
   ```
2. Start stopped containers:
   ```bash
   docker compose up -d
   ```
3. Check container logs for errors:
   ```bash
   docker logs sonarr
   ```

**Verify:** `docker ps` shows all expected containers with status "Up."

---

### Service Crashed or Updating

**What you see:** Connection errors or 502/503 status codes.

```
[Radarr] The server is experiencing issues. Please try again later.
```

**Why it happens:** The service crashed, is in the middle of an update, or is restarting.

**How to fix:**

1. Check the service logs for crash information.
2. If updating, wait for the update to complete.
3. Restart the service:
   ```bash
   docker restart radarr
   ```
   Or restart the system service:
   ```bash
   sudo systemctl restart radarr
   ```

**Verify:** The web UI loads successfully.

---

### Port Conflicts

**What you see:** ECONNREFUSED or the wrong service responds to requests.

**Why it happens:** Two services are configured to use the same port. One of them fails to start or you connect to the wrong one.

**How to fix:**

1. Check if the port is in use:
   ```bash
   lsof -i :8989
   ```
2. Make sure each service uses a unique port. Default ports:
   | Service | Default Port |
   |---|---|
   | Sonarr | 8989 |
   | Radarr | 7878 |
   | Radarr 4K | 7879 |
   | Plex | 32400 |
   | SABnzbd | 8080 |
   | Overseerr | 5055 |
3. Update your config to match the actual ports.

**Verify:** Each service web UI loads on its expected port.

---

## Missing API Keys

### TMDB API Key Not Set

**What you see:**

```
TMDB is not configured. This tool requires TMDB.

To configure, add to config.json:
{
  "tmdb": {
    "apiKey": "your-tmdb-api-key"
  }
}

Or set environment variables:
  TMDB_API_KEY=<value>
```

**Why it happens:** TMDB requires a free API key from The Movie Database. Unlike the other services, TMDB is an external API.

**How to fix:**

1. Go to [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) and sign up for a free account.
2. Request an API key (v3 auth).
3. Add it to your config:
   ```json
   {
     "tmdb": {
       "apiKey": "f8e7d6c5b4a3f8e7d6c5b4a3f8e7d6c5"
     }
   }
   ```
4. Or set the environment variable:
   ```bash
   export TMDB_API_KEY="f8e7d6c5b4a3f8e7d6c5b4a3f8e7d6c5"
   ```

**Verify:** Run `providers_status`. TMDB should appear under "Configured."

---

## General Tips

### Always Build Before Running

arrs-mcp-server is written in TypeScript. You must compile it before use:

```bash
cd /Users/yourname/dev/arrs-mcp-server
pnpm install
pnpm build
```

If you pull new code or switch branches, rebuild:

```bash
pnpm build
```

### Check Service Web UIs First

If something is not working, open the service web UI in a browser. If the UI does not load, the problem is with the service itself, not arrs-mcp-server.

| Service | Default URL |
|---|---|
| Sonarr | `http://localhost:8989` |
| Radarr | `http://localhost:7878` |
| Plex | `http://localhost:32400/web` |
| SABnzbd | `http://localhost:8080` |
| Overseerr | `http://localhost:5055` |

### Verify API Keys in Service Web UIs

Each service shows its API key in the settings. Compare what is in your config to what the service shows:

- **Sonarr/Radarr:** Settings > General > API Key
- **SABnzbd:** Config > General > API Key (use the Full Access key, not the NZB key)
- **Overseerr:** Settings > General > API Key
- **Plex:** Not shown directly. Get your token from `https://app.plex.tv` (see the Plex section above).
- **TMDB:** [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

### Environment Variables Override config.json

If a service is configured in both config.json and environment variables, the environment variables win. This is useful for:

- Keeping secrets out of config files in version control.
- Overriding settings in Docker or CI environments.
- Testing different configurations without editing files.

The override is per-service. If `SONARR_URL` and `SONARR_API_KEY` are both set, the entire Sonarr config comes from environment variables. The Sonarr section in config.json is ignored.

### Node.js Version

arrs-mcp-server requires Node.js 20 or later. Check your version:

```bash
node --version
```

If you see `v18` or lower, update Node.js before running the server.
