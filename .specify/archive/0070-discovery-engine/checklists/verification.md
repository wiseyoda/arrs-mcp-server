# Verification Checklist: Phase 0070

## Acceptance Criteria

### US1: Collection Completion

- [ ] V-001: Can search for collections by name (e.g., "Marvel")
- [ ] V-002: Collection shows all movies with release dates
- [ ] V-003: Library status indicated for each movie (owned/missing)
- [ ] V-004: Count shown: "You have X of Y movies"
- [ ] V-005: Can add missing movies to Radarr

### US2: Similar Content Discovery

- [ ] V-006: Can get similar movies for any TMDB ID
- [ ] V-007: Results show title, year, rating, overview
- [ ] V-008: Indicates which similar movies are in library
- [ ] V-009: Can filter to show only missing movies

### US3: Recommendations

- [ ] V-010: Can get recommendations for any movie
- [ ] V-011: Results filtered against Plex library
- [ ] V-012: Can add recommended movies to Radarr

## Non-Functional Requirements

- [ ] V-013: Collection lookup completes in <5 seconds
- [ ] V-014: TMDB rate limiting handled gracefully
- [ ] V-015: Error messages are user-friendly

## Phase Goals Verification

- [ ] V-016: TMDB integration working (Goal 1)
- [ ] V-017: Collection completion working (Goal 4)
- [ ] V-018: Library cross-reference working (Goal 6)

## Integration Testing

- [ ] V-019: Tools appear in system_health when TMDB configured
- [ ] V-020: Collection add works with Radarr
- [ ] V-021: Library matching accurate against Plex

## Known Test Collections

| Collection | TMDB ID | Expected Movies |
|------------|---------|-----------------|
| Marvel Cinematic Universe | 86311 | 32+ |
| Star Wars | 10 | 12 |
| Fast & Furious | 9485 | 11 |
