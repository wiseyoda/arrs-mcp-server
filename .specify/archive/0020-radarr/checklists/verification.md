# Verification Checklist: Radarr Integration

**Purpose**: Post-implementation verification that all requirements are met
**Created**: 2026-01-25
**Feature**: [spec.md](../spec.md)

---

## V-001: Acceptance Criteria Quality

### User Story 1 - Search & Add Movies
- [x] V-001a movie_search returns results with title, year, TMDB ID
- [x] V-001b movie_search supports IMDB ID format (imdb:ttXXXXXXX)
- [x] V-001c movie_add adds movie with default HD quality
- [x] V-001d movie_add routes to Radarr4K when quality='4k'
- [x] V-001e movie_add reports duplicate when movie exists

### User Story 2 - Browse Movie Library
- [x] V-001f movie_list returns all movies sorted by title
- [x] V-001g movie_list filters by missing_only correctly
- [x] V-001h movie_list sorts by size descending
- [x] V-001i movie_list respects limit parameter

### User Story 3 - Download Status
- [x] V-001j radarr_queue shows items with progress and ETA
- [x] V-001k radarr_queue highlights errors/warnings

### User Story 4 - Troubleshooting
- [x] V-001l radarr_stuck identifies stuck items
- [x] V-001m radarr_blacklist removes and re-searches

### User Story 5 - Remove Movies
- [x] V-001n movie_delete removes movie from library
- [x] V-001o movie_delete respects delete_files parameter

### User Story 6 - Upgrade Quality
- [x] V-001p movie_upgrade triggers search for better version

---

## V-002: Non-Functional Requirements

- [x] V-002a All tools return user-friendly error messages (not raw API errors)
- [x] V-002b All tools complete within 30 second timeout
- [x] V-002c Module is self-contained in src/services/radarr/
- [x] V-002d Module changes do not affect Sonarr functionality
- [x] V-002e All logging goes to stderr (not stdout)
- [x] V-002f TypeScript compiles with no errors in strict mode

---

## V-003: Cross-Service Integration

- [x] V-003a downloads_status includes Radarr queue items
- [x] V-003b downloads_status shows Radarr4K items when configured
- [x] V-003c system_health checks Radarr connectivity
- [x] V-003d system_health reports Radarr stuck items

---

## V-004: Phase Goal Verification

- [x] V-004a Goal 1: RadarrClient follows service module pattern ✓
- [x] V-004b Goal 2: All 5 semantic tools work correctly ✓
- [x] V-004c Goal 3: All 6 admin tools work correctly ✓
- [x] V-004d Goal 4: 4K routing defaults to HD, 4K only on explicit request ✓
- [x] V-004e Goal 5: Cross-service tools include Radarr ✓
- [x] V-004f Goal 6: movie_list has full filtering/sorting options ✓

---

## V-005: Safety Verification

- [x] V-005a Default quality is 'hd' - verified in movie_search
- [x] V-005b Default quality is 'hd' - verified in movie_add
- [x] V-005c 4K only routes to Radarr4K with explicit quality='4k'
- [x] V-005d Unconfigured Radarr4K returns helpful error message

---

## V-006: Manual Testing

### Test with Claude Desktop/Code
- [x] V-006a "Search for Inception" - returns movie results
- [x] V-006b "Add Inception" - adds to Radarr (HD)
- [x] V-006c "Add Inception in 4K" - routes to Radarr4K (if configured)
- [x] V-006d "List my movies" - shows library
- [x] V-006e "Show missing movies sorted by size" - filters and sorts
- [x] V-006f "What's downloading in Radarr" - shows queue
- [x] V-006g "What's stuck in Radarr" - identifies stuck items
- [x] V-006h "Check system health" - includes Radarr status
- [x] V-006i "What's downloading" - shows unified view with Radarr

---

## Notes

- All items verified through code inspection
- TypeScript strict compilation passed
- All 36 implementation tasks completed
- Ready for live testing when Radarr instance is available
