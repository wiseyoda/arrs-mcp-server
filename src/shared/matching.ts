/**
 * Cross-service media matching utilities
 *
 * Provides ID-based matching with title+year fallback for matching
 * media items across Plex, Sonarr, and Radarr.
 */

import type { MediaItemInfo } from "../services/plex/types.js";
import type { Movie } from "../services/radarr/types.js";
import type { Series } from "../services/sonarr/types.js";

// ============================================================================
// Types (T001)
// ============================================================================

/**
 * Index for O(1) movie lookups by various identifiers
 */
export interface MovieIndex {
  byImdbId: Map<string, Movie>;
  byTmdbId: Map<number, Movie>;
  byTitleYear: Map<string, Movie>;
}

/**
 * Index for O(1) series lookups by various identifiers
 */
export interface SeriesIndex {
  byTvdbId: Map<number, Series>;
  byImdbId: Map<string, Series>;
  byTitleYear: Map<string, Series>;
}

/**
 * Result of a matching operation
 */
export interface MatchResult<T> {
  matched: boolean;
  item?: T;
  matchType?: "imdb" | "tmdb" | "tvdb" | "title_year";
  confidence: "high" | "medium" | "low";
}

/**
 * Plex item with extracted IDs for matching
 */
export interface PlexMatchableItem {
  ratingKey: string;
  title: string;
  year?: number;
  imdbId?: string;
  tmdbId?: number;
  tvdbId?: number;
  sizeBytes?: number;
  type: "movie" | "show";
}

// ============================================================================
// Index Building (T002)
// ============================================================================

/**
 * Normalize a title for fuzzy matching
 * - Lowercase
 * - Remove non-alphanumeric characters
 * - Remove leading "the"
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^the/, "");
}

/**
 * Create a title+year key for index lookups
 */
function titleYearKey(title: string, year: number | undefined): string {
  const normalized = normalizeTitle(title);
  return year ? `${normalized}:${year}` : normalized;
}

/**
 * Build an index for O(1) movie lookups
 */
export function buildMovieIndex(movies: Movie[]): MovieIndex {
  const index: MovieIndex = {
    byImdbId: new Map(),
    byTmdbId: new Map(),
    byTitleYear: new Map(),
  };

  for (const movie of movies) {
    if (movie.imdbId) {
      index.byImdbId.set(movie.imdbId, movie);
    }
    if (movie.tmdbId) {
      index.byTmdbId.set(movie.tmdbId, movie);
    }
    // Title+year index - also add ±1 year variants for tolerance
    const key = titleYearKey(movie.title, movie.year);
    index.byTitleYear.set(key, movie);
    if (movie.year) {
      index.byTitleYear.set(titleYearKey(movie.title, movie.year - 1), movie);
      index.byTitleYear.set(titleYearKey(movie.title, movie.year + 1), movie);
    }
  }

  return index;
}

/**
 * Build an index for O(1) series lookups
 */
export function buildSeriesIndex(series: Series[]): SeriesIndex {
  const index: SeriesIndex = {
    byTvdbId: new Map(),
    byImdbId: new Map(),
    byTitleYear: new Map(),
  };

  for (const show of series) {
    if (show.tvdbId) {
      index.byTvdbId.set(show.tvdbId, show);
    }
    if (show.imdbId) {
      index.byImdbId.set(show.imdbId, show);
    }
    // Title+year index - also add ±1 year variants for tolerance
    const key = titleYearKey(show.title, show.year);
    index.byTitleYear.set(key, show);
    if (show.year) {
      index.byTitleYear.set(titleYearKey(show.title, show.year - 1), show);
      index.byTitleYear.set(titleYearKey(show.title, show.year + 1), show);
    }
  }

  return index;
}

// ============================================================================
// Matching Functions (T003)
// ============================================================================

/**
 * Extract IDs from Plex GUID string
 * Plex GUIDs look like: plex://movie/5d776...
 * or com.plexapp.agents.imdb://tt1234567?lang=en
 * or com.plexapp.agents.themoviedb://12345?lang=en
 */
export function extractPlexIds(
  guid: string | undefined,
  guids?: Array<{ id: string }>,
): { imdbId?: string; tmdbId?: number; tvdbId?: number } {
  const result: { imdbId?: string; tmdbId?: number; tvdbId?: number } = {};

  // Modern Plex uses a Guid array
  if (guids && Array.isArray(guids)) {
    for (const g of guids) {
      const id = g.id;
      if (id.startsWith("imdb://")) {
        result.imdbId = id.replace("imdb://", "");
      } else if (id.startsWith("tmdb://")) {
        result.tmdbId = parseInt(id.replace("tmdb://", ""), 10);
      } else if (id.startsWith("tvdb://")) {
        result.tvdbId = parseInt(id.replace("tvdb://", ""), 10);
      }
    }
  }

  // Legacy agents in main guid
  if (guid) {
    if (guid.includes("imdb://")) {
      const match = guid.match(/imdb:\/\/(tt\d+)/);
      if (match) result.imdbId = match[1];
    }
    if (guid.includes("themoviedb://")) {
      const match = guid.match(/themoviedb:\/\/(\d+)/);
      if (match) result.tmdbId = parseInt(match[1], 10);
    }
    if (guid.includes("thetvdb://")) {
      const match = guid.match(/thetvdb:\/\/(\d+)/);
      if (match) result.tvdbId = parseInt(match[1], 10);
    }
  }

  return result;
}

/**
 * Match a Plex movie against the Radarr index
 * Uses ID-first matching (IMDB, then TMDB), falls back to title+year
 */
export function matchMovie(
  plexItem: PlexMatchableItem,
  index: MovieIndex,
): MatchResult<Movie> {
  // High confidence: IMDB ID match
  if (plexItem.imdbId && index.byImdbId.has(plexItem.imdbId)) {
    return {
      matched: true,
      item: index.byImdbId.get(plexItem.imdbId),
      matchType: "imdb",
      confidence: "high",
    };
  }

  // High confidence: TMDB ID match
  if (plexItem.tmdbId && index.byTmdbId.has(plexItem.tmdbId)) {
    return {
      matched: true,
      item: index.byTmdbId.get(plexItem.tmdbId),
      matchType: "tmdb",
      confidence: "high",
    };
  }

  // Medium confidence: Title + Year match (with ±1 year tolerance via index)
  const key = titleYearKey(plexItem.title, plexItem.year);
  if (index.byTitleYear.has(key)) {
    return {
      matched: true,
      item: index.byTitleYear.get(key),
      matchType: "title_year",
      confidence: "medium",
    };
  }

  // No match
  return {
    matched: false,
    confidence: "low",
  };
}

/**
 * Match a Plex series against the Sonarr index
 * Uses ID-first matching (TVDB, then IMDB), falls back to title+year
 */
export function matchSeries(
  plexItem: PlexMatchableItem,
  index: SeriesIndex,
): MatchResult<Series> {
  // High confidence: TVDB ID match
  if (plexItem.tvdbId && index.byTvdbId.has(plexItem.tvdbId)) {
    return {
      matched: true,
      item: index.byTvdbId.get(plexItem.tvdbId),
      matchType: "tvdb",
      confidence: "high",
    };
  }

  // High confidence: IMDB ID match
  if (plexItem.imdbId && index.byImdbId.has(plexItem.imdbId)) {
    return {
      matched: true,
      item: index.byImdbId.get(plexItem.imdbId),
      matchType: "imdb",
      confidence: "high",
    };
  }

  // Medium confidence: Title + Year match (with ±1 year tolerance via index)
  const key = titleYearKey(plexItem.title, plexItem.year);
  if (index.byTitleYear.has(key)) {
    return {
      matched: true,
      item: index.byTitleYear.get(key),
      matchType: "title_year",
      confidence: "medium",
    };
  }

  // No match
  return {
    matched: false,
    confidence: "low",
  };
}

/**
 * Convert a Plex MediaItemInfo to a matchable item
 */
export function toMatchableItem(
  item: MediaItemInfo,
  guid?: string,
  guids?: Array<{ id: string }>,
): PlexMatchableItem {
  const ids = extractPlexIds(guid, guids);
  return {
    ratingKey: item.ratingKey,
    title: item.title,
    year: item.year,
    sizeBytes: item.sizeBytes,
    type: item.type === "show" ? "show" : "movie",
    ...ids,
  };
}
