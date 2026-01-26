# Requirements Checklist: Library Intelligence

**Purpose**: Track requirement implementation status for Phase 0090
**Created**: 2026-01-25
**Feature**: [spec.md](spec.md)

## Library Audit Tool

- [ ] REQ-FR001 `library_audit` tool with `check` parameter accepting all check types
- [ ] REQ-FR002 check="all" returns summary counts for all check types
- [ ] REQ-FR003 check="orphans" identifies Plex items not tracked in *arr
- [ ] REQ-FR004 check="missing" identifies *arr items not in Plex
- [ ] REQ-FR005 check="downloads" identifies stuck downloads
- [ ] REQ-FR006 check="quality" identifies bidirectional 4K/HD routing issues
- [ ] REQ-FR007 check="collections" auto-detects and reports incomplete collections
- [ ] REQ-FR008 check="ended" identifies ended/completed series

## Library Sync Tool

- [ ] REQ-FR009 `library_sync` tool with `type` and `confirm` parameters
- [ ] REQ-FR010 confirm=false returns dry-run preview
- [ ] REQ-FR011 confirm=true executes sync with per-item reporting
- [ ] REQ-FR012 type="orphans" adds Plex orphans to appropriate *arr service
- [ ] REQ-FR013 type="collection" adds missing collection movies

## Space Planner Tool

- [ ] REQ-FR014 `space_planner` tool with target_gb, type, exclude_favorites parameters
- [ ] REQ-FR015 Scoring formula: (size × age) / (rating × rewatch_factor)
- [ ] REQ-FR016 Uses stored ratings (not live TMDB)
- [ ] REQ-FR017 Sorted by cleanup score (highest first)
- [ ] REQ-FR018 Stops listing when approaching target_gb

## Watch Analytics Tool

- [ ] REQ-FR019 `watch_analytics` tool with period and type parameters
- [ ] REQ-FR020 Computes movies/episodes watched and estimated time
- [ ] REQ-FR021 Shows most-watched content and genre breakdown

## Enhanced Plex Tools

- [ ] REQ-FR022 `plex_watched_old` with show_size, sort, ended_only params
- [ ] REQ-FR023 `plex_unwatched` with show_size, show_rating, sort params
- [ ] REQ-FR024 Running total of space savings when show_size=true

## Non-Functional Requirements

- [ ] REQ-NFR001 All tools complete within 30s for 1000+ item libraries
- [ ] REQ-NFR002 Uses provider registry for service validation
- [ ] REQ-NFR003 Clear error when required providers missing
- [ ] REQ-NFR004 Error isolation (one service failure doesn't crash analysis)
- [ ] REQ-NFR005 Stateless operation (no database, no caching)

## Notes

- Check items off as implementation is verified
- Link to implementation files in comments
- NFR items verified during testing phase
