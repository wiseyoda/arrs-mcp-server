# Implementation Checklist: Radarr Integration

**Purpose**: Guidance for implementing Radarr service module correctly
**Created**: 2026-01-25
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

---

## I-001: Requirements Completeness

- [x] I-001a All Radarr v3 API endpoints needed for tools are identified
- [x] I-001b All type definitions match Radarr API response shapes
- [x] I-001c Quality routing logic covers both HD and 4K scenarios
- [x] I-001d Error messages cover all common failure modes

## I-002: Requirements Clarity

- [x] I-002a movie_list filter parameters are unambiguous
- [x] I-002b movie_list sort options have clear behavior
- [x] I-002c delete_files parameter behavior is explicit
- [x] I-002d IMDB ID search format is documented (imdb:ttXXXXXXX)

## I-003: Scenario Coverage

- [x] I-003a Search with results scenario handled
- [x] I-003b Search with no results scenario handled
- [x] I-003c Add existing movie scenario handled
- [x] I-003d Add to unconfigured 4K instance scenario handled
- [x] I-003e Queue with errors/warnings scenario handled
- [x] I-003f Stuck items identification scenario handled

## I-004: Edge Case Coverage

- [x] I-004a Empty movie library handled in movie_list
- [x] I-004b Movie not found handled in movie_delete
- [x] I-004c Invalid quality profile ID handled
- [x] I-004d Invalid root folder path handled
- [x] I-004e Network timeout handled gracefully
- [x] I-004f Authentication failure handled with clear message

## I-005: Pattern Compliance

- [x] I-005a File structure matches Sonarr service module
- [x] I-005b RadarrClient follows SonarrClient patterns
- [x] I-005c Tool registration follows tools.ts pattern
- [x] I-005d Error handling uses formatErrorResponse
- [x] I-005e Output formatting matches Sonarr tools
- [x] I-005f Parameter coercion uses z.coerce for numbers/booleans

## I-006: Constitution Compliance

- [x] I-006a Tool names are natural language (movie_search not radarr_lookup)
- [x] I-006b Quality defaults to 'hd' when not specified
- [x] I-006c Module is self-contained in src/services/radarr/
- [x] I-006d No persistent state or caching
- [x] I-006e Two-tier tool structure (semantic + admin)

---

## Notes

- All items verified complete through code inspection
- Implementation follows patterns established in Phase 0010
- TypeScript strict mode compilation passes
