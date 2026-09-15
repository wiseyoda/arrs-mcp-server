# Repository audit and Hermes acceptance guide

## Candidate scope

The September 2026 audit covers the whole `src/` tree, configuration, provider
registration, all published tool schemas, service clients, dependency lockfile,
build/lint setup, documentation, and MCP transport. The historical source-checkout
planning WIP was preserved, not copied into this candidate.

The server is stdio-only: there is no web UI to browser-test or HTTP listener to
expose. Automated tests use temporary loopback services, MCP in-memory transport,
and the actual compiled subprocess over stdio. They do not contact real services.
All tools are registered and outage-exercised; representative read/write contracts,
confirmation safety, 4K routing, config, pagination, matching, and timeouts have
focused regression tests. This is not exhaustive live API coverage.

### Fixed in this candidate

- Working TypeScript-aware ESLint gate; current tooling and patched SDK/transitives.
- Strict credential-safe configuration validation and per-field environment overrides.
- Seerr config aliases with legacy tool/provider compatibility and unchanged `/api/v1` routing.
- Explicit boolean parsing; positive integer IDs; explicit removal confirmation gates.
- HTTP timeout covers streamed bodies; empty DELETE responses remain supported.
  Authenticated redirects are refused, and malformed JSON errors do not echo bodies.
- SAB API `status:false` is a failure, not a successful operation.
- Plex/Radarr authentication/outage errors no longer become false “missing” results.
- Full cross-service Plex scans paginate and request external GUIDs.
- Unicode-aware title matching and exact-year precedence; TMDB library matching
  no longer trusts any same-year search hit or treats search outages as absence.
- Correct Seerr issue-comment response contract.
- Explicitly requested missing profiles/folders no longer silently select defaults.
- Confirmed queue blocklisting; sync considers both Radarr inventories and aborts on
  unavailable 4K inventory; explicit quality audits load the correct data.
- Radarr RenameMovie payload; Plex multi-version duplicates, actual recently-added
  sorting, no mutation replay after an optimization failure, and authoritative ended status.
- Seerr failed/completed statuses, quota limits, locally filtered declined requests,
  complete user-request history, and true trending routes.

## Fetch the testing candidate

Use the branch/PR and exact SHA from the task handoff, not a blind `git pull main`.
Do not overwrite a dirty Thinkstation checkout. In a clean dedicated checkout:

```sh
git fetch origin
git switch --track origin/openclaw/arrs-mcp-server-32449c89b48f
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm audit --prod
```

Requires Node >=20.19.0; Node 22/24 LTS preferred. pnpm is pinned in package.json.
Use `corepack enable` if needed. `pnpm test` rebuilds `dist/` before running tests.
No secrets or node_modules are committed. Configure Thinkstation's own service
credentials and an absolute `CONFIG_PATH` in the MCP launcher. Register
`node /absolute/checkout/dist/index.js` in Hermes's stdio MCP configuration.
Restart/reconnect that MCP server after building; do not replace a running working
installation until the candidate passes this checklist.

## Live verification (Hermes / Patrick)

Record candidate SHA, OS, Node/pnpm versions, and actual service versions. Do not
include credentials, private media inventories, or raw authenticated URLs in PRs.

1. Initialize MCP, list tools, call `providers_status`, `media_help`, and
   `system_health`. Ensure only configured service tools are exposed and the
   4K instance remains distinct. No protocol noise should appear on stdout.
2. Sonarr: `tv_search`, `tv_list`, `tv_episodes`, profiles, folders, queue/calendar.
   Radarr: `movie_search` (text, TMDB and IMDb), `movie_list`, details/profiles/queue.
   Verify default HD and explicitly selected 4K against distinct known titles.
3. Plex: list/search libraries and media, unwatched/recent items, collections,
   duplicates, and a full-library scan. Check counts against Plex, including
   large and non-English libraries. Check cross-service matching against known IDs.
4. SABnzbd: queue, history, quota, categories, warnings. Confirm auth failures are
   errors; do not clear existing downloads as a test.
5. Seerr: record version, use `SEERR_URL`/`SEERR_API_KEY` (base URL only), list
   requests/users/issues and discovery. Verify legacy `OVERSEERR_*` configuration
   still registers the same tools. Test comment/resolve/approve/decline only on
   an explicitly designated disposable request/issue.
6. TMDB: movie/collection search and details, similar/recommendations; compare
   collection missing/owned results with Plex and Radarr.
7. Cross-service: `downloads_status`, `library_audit` (each check),
   `cleanup_analysis`, `space_planner`, `watch_analytics`, and `library_sync`
   with omitted/false confirmation. Confirm previews make no changes and
   service outages are not interpreted as clean/missing inventory.
8. Mutation checks only with designated disposable media/downloads and explicit
   approval: add with `search_now:false`, verify chosen profile/root; then remove
   with `confirm:true` and `delete_files:false`. Omitted/false confirmation must
   never delete. Plex file deletion requires a truly disposable media fixture.
   Do not invoke bulk sync execution or searches against the working library
   merely to finish this checklist.

## Material limits and sign-off

Local fixtures verify our contracts, not the running Thinkstation stack. Seerr
upstream compatibility was checked against its v3.4.1 API source; installation
versions, reverse proxies, permissions, and service-specific response differences
still require live validation. Existing analytics use library metadata rather
than playback history: period episode counts/watch time are estimates. Plex
show-level sizes may be absent; space recommendations can omit those shows.
No production data mutations or releases are part of this audit.

Final P1 review evidence, checks, candidate SHA, and GitHub CI results are recorded
in the PR/task handoff. Passing local checks is readiness for Hermes testing,
not an unconditional sign-off on every live service operation. Report any failure
with the tool, sanitized input, expected/actual outcome, service version and SHA.

### Upstream contract references

- [Seerr v3.4.1 API mount](https://github.com/seerr-team/seerr/blob/v3.4.1/server/index.ts)
- [Seerr request statuses](https://github.com/seerr-team/seerr/blob/v3.4.1/server/constants/media.ts)
- [Seerr request filtering](https://github.com/seerr-team/seerr/blob/v3.4.1/server/routes/request.ts)
- [Seerr quota semantics](https://github.com/seerr-team/seerr/blob/v3.4.1/server/entity/User.ts)
- [Seerr issue comments](https://github.com/seerr-team/seerr/blob/v3.4.1/server/routes/issue.ts)
- [Radarr rename handler](https://github.com/Radarr/Radarr/blob/develop/src/NzbDrone.Core/MediaFiles/RenameMovieFileService.cs)
