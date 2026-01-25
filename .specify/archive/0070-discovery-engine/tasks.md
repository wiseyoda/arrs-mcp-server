# Tasks: Phase 0070 - Discovery & Recommendations Engine

## Phase Goals Coverage

| # | Phase Goal | Spec Requirement(s) | Task(s) | Status |
|---|------------|---------------------|---------|--------|
| 1 | TMDB integration for trending, popular, and recommendations | FR-001, FR-007 | T001-T005, T017-T019 | COVERED |
| 2 | Trakt integration for personal lists, community lists, and history | - | - | DEFERRED |
| 3 | Letterboxd integration for curated film lists | - | - | DEFERRED |
| 4 | Collection completion (missing items from franchises) | FR-002, FR-003, FR-004, FR-005, FR-008 | T006-T016 | COVERED |
| 5 | Personal taste profiles based on watch history and ratings | - | - | DEFERRED |
| 6 | Cross-reference external lists with existing library | FR-003 | T009-T011 | COVERED |

Coverage: 3/6 goals COVERED (Goals 2, 3, 5 deferred per scope refinement)

---

## Progress Dashboard

| Status | Count |
|--------|-------|
| Total | 24 |
| Completed | 0 |
| In Progress | 0 |
| Blocked | 0 |

---

## Phase 1: Setup

- [x] T001 Create service directory structure at `src/services/tmdb/`
- [x] T002 Add TMDB to Config interface in `src/config.ts`
- [x] T003 Add environment variable loading for TMDB_API_KEY in `src/config.ts`
- [x] T004 Add TMDB validation in validateConfig() in `src/config.ts`
- [x] T005 Create module exports in `src/services/tmdb/index.ts`

## Phase 2: Types & Client

- [x] T006 [US1] Define collection types (Collection, CollectionPart) in `src/services/tmdb/types.ts`
- [x] T007 [US1] Define movie types (Movie, MovieSearchResult) in `src/services/tmdb/types.ts`
- [x] T008 [US1] Implement TmdbClient constructor with API key auth in `src/services/tmdb/client.ts`
- [x] T009 [US1] Implement searchCollections method in `src/services/tmdb/client.ts`
- [x] T010 [US1] Implement getCollection method in `src/services/tmdb/client.ts`
- [x] T011 [US1] Implement getMovie method in `src/services/tmdb/client.ts`

## Phase 3: Library Cross-Reference (US1)

- [x] T012 [US1] Create matchAgainstLibrary utility function in `src/services/tmdb/tools.ts`
- [x] T013 [US1] Implement tmdb_collection tool in `src/services/tmdb/tools.ts`
- [x] T014 [US1] Implement collection_status tool in `src/services/tmdb/tools.ts`
- [x] T015 [US1] Implement collection_missing tool in `src/services/tmdb/tools.ts`
- [x] T016 [US1] Implement collection_add_missing tool in `src/services/tmdb/tools.ts`

## Phase 4: Similar & Recommendations (US2, US3)

- [x] T017 [US2] Implement getSimilar method in `src/services/tmdb/client.ts`
- [x] T018 [US3] Implement getRecommendations method in `src/services/tmdb/client.ts`
- [x] T019 [US2] Implement tmdb_similar tool in `src/services/tmdb/tools.ts`
- [x] T020 [US3] Implement tmdb_recommendations tool in `src/services/tmdb/tools.ts`

## Phase 5: Search & Utility

- [x] T021 Implement searchMovies method in `src/services/tmdb/client.ts`
- [x] T022 Implement tmdb_search tool in `src/services/tmdb/tools.ts`

## Phase 6: Integration & Polish

- [x] T023 Register TMDB tools in main `src/index.ts`
- [x] T024 Update README.md with TMDB configuration and tool documentation

---

## Dependencies

```
T001 → T002-T005 (directory must exist first)
T005 → T006-T024 (exports needed for registration)
T006-T007 → T008-T011 (types needed for client)
T008 → T009-T011 (client constructor needed)
T011 → T012 (need getMovie for matching)
T012 → T013-T016 (matcher needed for collection tools)
T009-T010 → T013-T016 (collection methods needed)
T017-T018 → T019-T020 (similar/rec methods needed)
T023 → T024 (registration needed for docs)
```

---

## Deferred Items

The following phase goals are deferred to a future phase:

1. **Trakt integration** - Would require:
   - OAuth authentication flow
   - Additional API client
   - User-specific data handling
   - Significant additional complexity

2. **Letterboxd integration** - Would require:
   - Web scraping (no official API)
   - Rate limiting considerations
   - HTML parsing

3. **Taste profiles** - Would require:
   - Plex watch history analysis
   - Rating aggregation
   - ML/recommendation algorithms
