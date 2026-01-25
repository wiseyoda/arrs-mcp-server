# Requirements Checklist: Radarr Integration

**Purpose**: Track completion of all functional and non-functional requirements from spec.md
**Created**: 2026-01-25
**Feature**: [spec.md](spec.md)

---

## Core Module Requirements

- [ ] REQ-001 RadarrClient class implements all Radarr v3 API operations
- [ ] REQ-002 Uses shared HttpClient with X-Api-Key authentication
- [ ] REQ-003 Supports both radarr and radarr4k configuration
- [ ] REQ-004 Quality parameter defaults to 'hd' when not specified
- [ ] REQ-005 Only routes to Radarr4K when quality='4k' explicitly provided

## Semantic Tools Requirements

### movie_search
- [ ] REQ-010 Searches movies by name
- [ ] REQ-011 Returns title, year, TMDB ID in results
- [ ] REQ-012 Supports IMDB ID search (imdb:ttXXXXXXX format)

### movie_add
- [ ] REQ-013 Adds movie with configurable quality profile and root folder
- [ ] REQ-014 Triggers automatic search after adding if requested
- [ ] REQ-015 Checks for existing movie and reports duplicate

### movie_list
- [ ] REQ-016 Filters by status (released, inCinemas, announced, all)
- [ ] REQ-017 Filters by genre (partial match)
- [ ] REQ-018 Filters by missing_only (movies without files)
- [ ] REQ-019 Filters by unmonitored_only
- [ ] REQ-020 Sorts by title (default)
- [ ] REQ-021 Sorts by size (largest first)
- [ ] REQ-022 Sorts by added (newest first)
- [ ] REQ-023 Sorts by year (newest first)
- [ ] REQ-024 Sorts by rating (highest first)
- [ ] REQ-025 Displays show_size option
- [ ] REQ-026 Displays show_rating option
- [ ] REQ-027 Displays show_runtime option
- [ ] REQ-028 Displays show_added option
- [ ] REQ-029 Supports limit parameter

### movie_upgrade
- [ ] REQ-030 Triggers search for better quality version

### movie_delete
- [ ] REQ-031 Removes movie from library
- [ ] REQ-032 Supports delete_files parameter

## Admin Tools Requirements

### radarr_queue
- [ ] REQ-040 Shows all download queue items
- [ ] REQ-041 Shows progress, ETA, and status
- [ ] REQ-042 Highlights items with errors or warnings

### radarr_details
- [ ] REQ-043 Shows complete info for single movie by ID or name

### radarr_profiles
- [ ] REQ-044 Lists all quality profiles with IDs

### radarr_folders
- [ ] REQ-045 Lists all root folders with free space

### radarr_stuck
- [ ] REQ-046 Identifies items in importPending state
- [ ] REQ-047 Identifies items in warning or error state

### radarr_import
- [ ] REQ-048 Triggers manual import scan

### radarr_blacklist
- [ ] REQ-049 Blacklists queue item
- [ ] REQ-050 Optionally re-searches after blacklist

## Cross-Service Integration

- [ ] REQ-060 downloads_status includes Radarr queue items
- [ ] REQ-061 system_health checks Radarr connectivity
- [ ] REQ-062 system_health reports Radarr stuck items

## Non-Functional Requirements

- [ ] NFR-001 All tools return user-friendly error messages
- [ ] NFR-002 All tools complete within 30 second timeout
- [ ] NFR-003 Module self-contained in src/services/radarr/
- [ ] NFR-004 Module does not affect Sonarr or other services
- [ ] NFR-005 All logging goes to stderr

---

## Notes

- Check items off as completed: `[x]`
- Items are numbered for traceability to spec.md
- REQ-### maps to FR-### in spec
- NFR-### maps to non-functional requirements
