# Discovery: Library Intelligence

**Phase**: `0090-library-intelligence`
**Created**: 2026-01-25
**Status**: Complete

## Phase Context

**Source**: ROADMAP Phase 0090 / `.specify/phases/0090-library-intelligence.md`
**Goal**: Add stateless library intelligence tools for consistency analysis, batch sync operations, smart cleanup recommendations, and viewing analytics.

---

## Codebase Examination

### Related Implementations

| Location | Description | Relevance |
|----------|-------------|-----------|
| `src/tools/cleanup-analysis.ts` | Cross-provider cleanup analysis with service aggregation | **Primary pattern reference** - demonstrates multi-service aggregation, category-based results, error isolation |
| `src/services/plex/tools.ts:952-1184` | `plex_unwatched` and `plex_watched_old` tools | Target for enhancement with size totals and sorting |
| `src/services/plex/client.ts:239-373` | `getCollections()` and `getDuplicates()` methods | Pattern for library-wide analysis operations |
| `src/services/radarr/client.ts:30-62` | `searchMovies()` with ID-prefix handling | Pattern for IMDB/TMDB ID-based lookups |
| `src/providers/registry.ts` | Provider registry with capability checking | Use `requireProviders()` for service validation |
| `src/tmdb/tools.ts:475-560` | `collection_status` with library matching | Pattern for Plex-TMDB cross-matching |
| `src/services/sonarr/client.ts:78-90` | `getEpisodesWithFiles()` Map-based indexing | Pattern for O(1) lookups in large datasets |

### Existing Patterns & Conventions

- **Service Aggregation Pattern**: Try/catch per service, collect results even if some fail, report service status alongside results (cleanup-analysis.ts:77-351)
- **Category-Based Results**: Group findings by type with counts, size totals, and item lists (CleanupCategory interface)
- **Semantic Tool Naming**: User-facing tools use intuitive names (`library_search`, `plex_unwatched`) per constitution
- **Result Limiting**: Large result sets truncated with "... and N more" pattern, warn at 500+ items
- **Size-Based Sorting**: Cleanup candidates sorted largest-first for maximum ROI
- **Stateless Design**: No database, no caching - fresh data on each request
- **HD-First Default**: Quality routing defaults to HD Radarr, 4K only when explicit

### Integration Points

- **Provider Registry**: Use `registry.requireProviders()` for validation before cross-service operations
- **Existing Clients**: Extend PlexClient, SonarrClient, RadarrClient with index-building methods
- **Tool Registration**: Register new tools via `registerSystemTools()` in `src/tools/index.ts`
- **Config**: Use existing `config.plex`, `config.sonarr`, `config.radarr`, `config.radarr4k`

### Constraints Discovered

- **No Persistent State**: Constitution mandates stateless operation - cannot store audit history
- **No Plex IDs**: Plex doesn't reliably store IMDB/TMDB IDs - must use title+year matching
- **Year Tolerance**: Need ±1 year tolerance for release date vs theatrical date variations
- **Radarr4K Separation**: Two separate Radarr instances, quality parameter routes between them
- **Performance**: Large libraries (1000+ items) require batch processing and Map-based indexes

---

## Requirements Sources

### From ROADMAP/Phase File

1. Single flexible `library_audit` tool with `check` parameter for all analysis types
2. Batch `library_sync` tool with dry-run preview and confirmation
3. Smart `space_planner` with scoring algorithm for cleanup decisions
4. Basic `watch_analytics` for viewing statistics
5. Enhance existing `plex_watched_old` and `plex_unwatched` tools

### From Related Issues

No open issues for this phase.

### From Previous Phase Handoffs

None - this is new functionality building on Phase 0080 provider registry.

### From Memory Documents

- **Constitution**:
  - Natural language first (semantic tool names)
  - Safety by default (HD quality, explicit confirmations for batch ops)
  - Stateless operation (no database)
  - Two-tier tool design (core tools for 80% use cases)
- **Tech Stack**: TypeScript 5.x, zod validation, native fetch, @modelcontextprotocol/sdk

---

## Scope Clarification

### Questions Asked

#### Question 1: Quality Check Direction

**Context**: Phase doc mentions checking "4K content in wrong Radarr instance" but also shows "HD content in 4K Radarr: 0" in examples

**Question**: For library_audit quality check, should we check both directions (HD↔4K)?

**Options Presented**:
- A (Recommended): Both directions - complete coverage
- B: 4K in HD only - focus on the more common misroute
- C: Only if Radarr4K configured

**User Answer**: Both directions (Recommended)

---

#### Question 2: Rating Source for Space Planner

**Context**: Scoring algorithm uses rating factor, could come from stored metadata or live API

**Question**: Should space_planner fetch ratings live from TMDB or use stored Plex/Radarr ratings?

**Options Presented**:
- A (Recommended): Use stored ratings - faster, works offline
- B: Fetch from TMDB - more accurate but slower
- C: Skip rating factor - simpler algorithm

**User Answer**: Use stored ratings (Recommended)

---

#### Question 3: Collection Detection Mode

**Context**: Collection completion checking could be auto-discovery or user-specified

**Question**: Should library_audit auto-detect collections from owned movies or require user to specify?

**Options Presented**:
- A (Recommended): Auto-detect from library - find all incomplete collections
- B: Use TMDB collection IDs - explicit only
- C: Both modes - auto with optional filtering

**User Answer**: Auto-detect from library (Recommended)

---

### Confirmed Understanding

**What the user wants to achieve**:
Create a unified library intelligence suite with:
- Single `library_audit` tool handling all consistency/orphan/quality analysis
- `library_sync` for batch operations with dry-run + confirmation
- `space_planner` with size×age/rating scoring
- `watch_analytics` for viewing statistics
- Enhanced Plex tools with size/rating display

**How it relates to existing code**:
- Follows `cleanup-analysis.ts` aggregation pattern
- Extends Plex/Sonarr/Radarr clients with matching methods
- Uses provider registry for service validation
- Enhances existing `plex_watched_old` and `plex_unwatched`

**Key constraints and requirements**:
- Stateless operation (no database, no undo)
- ID-based matching with title+year fallback
- Both HD↔4K quality direction checks
- Use stored ratings (not live TMDB)
- Auto-detect collections from library

**Technical approach (if discussed)**:
- Build Map-based indexes for O(1) lookups on large libraries
- Process in batches for performance
- Error isolation per service
- Size-based sorting for cleanup recommendations

**User confirmed**: Yes - 2026-01-25

---

## Recommendations for SPECIFY

### Should Include in Spec

- `library_audit` with all check types (all, orphans, missing, downloads, quality, collections, ended)
- `library_sync` with type and confirm parameters
- `space_planner` with stored rating scoring
- `watch_analytics` with period and type filters
- Enhanced `plex_watched_old` and `plex_unwatched` with size/rating

### Should Exclude from Spec (Non-Goals)

- Undo capability (stateless design)
- Persistent rules or audit history
- Automatic remediation (always manual confirmation)
- File-level operations (moving between libraries)
- Advanced analytics (time-of-day patterns, seasonal analysis)
- Live TMDB rating lookups

### Potential Risks

- **Performance**: Large libraries may timeout - need pagination and batch processing
- **Matching Accuracy**: Title+year matching has edge cases (remakes, regional titles)
- **Radarr4K Detection**: Need reliable way to detect 4K content in wrong instance

### Questions to Address in CLARIFY

None - all key decisions made during discovery.
