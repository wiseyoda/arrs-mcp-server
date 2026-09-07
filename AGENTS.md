# arrs-mcp-server (active)

MCP server for managing media services (Sonarr, Radarr, Plex, SABnzbd, Overseerr, TMDB) through
Claude. `@modelcontextprotocol/sdk` + `zod` only, stdio transport. Node.js 20+, TypeScript strict,
ESM. Loaded as an MCP server in every Claude Code session on this machine — treat every command
and trap here as load-bearing.

## Commands

```bash
pnpm typecheck && pnpm lint   # verify gate — run before committing
pnpm build                    # tsc -> dist/
pnpm dev                      # tsc --watch
pnpm start                    # run the compiled server
pnpm format                   # prettier
```

## Layout

- `src/index.ts` — entry: config load, tool registration, stdio transport.
- `src/config.ts` — `config.json` + env vars; env wins.
- `src/services/<name>/` — 4-file pattern (`client.ts`, `tools.ts`, `types.ts`, `index.ts`) per
  service: sonarr, radarr, plex, sabnzbd, overseerr, tmdb.
- `src/providers/registry.ts` — `ProviderRegistry`: detects configured services, capability queries.
- `src/shared/` — `ArrsError` hierarchy (`errors.ts`), `HttpClient` (`http.ts`).
- `src/tools/` — cross-service system tools, always registered (`system_health`, `library_audit`, ...).
- Full diagrams, directory tree, and code patterns: `docs/ARCHITECTURE.md`.
- Step-by-step for adding a tool or a whole new service: `docs/EXTENDING.md`.
- Config reference: `docs/configuration.md`. Tool reference: `docs/tools.md`. Usage: `docs/examples.md`.
  Debugging: `docs/troubleshooting.md`.

## Rules

- Semantic names for user-facing tools (`tv_search`, not `sonarr_series_lookup`); service-prefixed
  for admin tools (`sonarr_queue`). Tool names are permanent once published — clients depend on them.
- 4K instances require explicit opt-in; destructive operations default to safe; always confirm
  before an irreversible action.
- Plugin architecture: a new service is a new `src/services/<name>/` directory plus one conditional
  registration line in `src/index.ts` — zero changes to existing services.
- Stateless: no DB, no cache; the external services (Sonarr/Radarr/Plex/...) are the source of
  truth; every tool call is a fresh API request.
- Cross-service tools (`src/tools/`) must call `registry.requireProviders()` / `isConfigured()`
  before building any service client.

## Traps

1. MCP transports send all params as strings -> plain `z.number()`/`z.boolean()` silently
   mis-validate -> always use `z.coerce.number()` / `z.coerce.boolean()` on tool parameters.
2. An uncaught tool error crashes the server (MCP framework doesn't catch) -> every handler
   try/catches and returns `{ content, isError: true }` via `formatErrorResponse()`.
3. `console.log()` writes to stdout, which is the MCP protocol channel -> corrupts the stream ->
   log only via `console.error()` (stderr).
4. Local imports without `.js` fail Node16 module resolution at runtime -> always
   `import { x } from "./y.js"`, even from `.ts` sources.
5. Sonarr/Radarr DELETE endpoints return empty bodies -> calling `.json()` on an empty response
   throws -> go through `HttpClient`, which already handles it.
6. Radarr 4K is a separate instance (own URL/API key, `config.radarr4k`) -> conflating it with
   standard Radarr in error messages confuses users -> pass a display name to `RadarrClient`.
7. Env vars silently override `config.json` -> a stale env var can mask a config.json edit that
   looks like it should have taken effect -> check both when a config change seems to not apply.

## Cross-CLI

`.mcp.json` and `.codex/` wire the same MCP servers Claude Code loads here; this AGENTS.md is
canonical for all of them.
