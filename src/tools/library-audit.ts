/**
 * Library Audit Tool
 *
 * Unified tool for library consistency analysis, orphan detection,
 * quality routing validation, and collection completeness checking.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import type { ProviderRegistry } from "../providers/index.js";
import { PlexClient } from "../services/plex/client.js";
import { SonarrClient } from "../services/sonarr/client.js";
import { RadarrClient } from "../services/radarr/client.js";
import { SabnzbdClient } from "../services/sabnzbd/client.js";
import { TmdbClient } from "../services/tmdb/client.js";
import { formatErrorResponse } from "../shared/errors.js";
import {
  buildMovieIndex,
  buildSeriesIndex,
  matchMovie,
  matchSeries,
  extractPlexIds,
  normalizeTitle,
  type PlexMatchableItem,
  type MovieIndex,
  type SeriesIndex,
} from "../shared/matching.js";
import type { Movie } from "../services/radarr/types.js";
import type { Series } from "../services/sonarr/types.js";
import type { PlexMediaItem } from "../services/plex/types.js";

// ============================================================================
// Types (T004)
// ============================================================================

// AuditCategory kept for potential future use in aggregated reports
// interface AuditCategory {
//   name: string;
//   count: number;
//   sizeBytes: number;
//   items: AuditItem[];
// }

interface AuditItem {
  id: string;
  title: string;
  year?: number;
  size: string;
  sizeBytes: number;
  details?: string;
  imdbId?: string;
  tmdbId?: number;
  tvdbId?: number;
}

interface OrphanItem extends AuditItem {
  type: "movie" | "show";
  ratingKey: string;
}

interface MissingItem extends AuditItem {
  type: "movie" | "show";
  monitored: boolean;
  serviceId: number;
}

interface QualityIssue extends AuditItem {
  direction: "4k_in_hd" | "hd_in_4k";
  resolution?: string;
}

interface CollectionInfo {
  collectionId: number;
  collectionName: string;
  totalMovies: number;
  ownedMovies: number;
  missingMovies: Array<{
    tmdbId: number;
    title: string;
    year: string;
  }>;
}

interface EndedSeriesInfo extends AuditItem {
  episodeCount: number;
  status: string;
}

interface ServiceStatus {
  name: string;
  available: boolean;
  error?: string;
}

interface AuditResult {
  services: ServiceStatus[];
  orphans: { movies: OrphanItem[]; shows: OrphanItem[] };
  missing: { movies: MissingItem[]; shows: MissingItem[] };
  downloads: AuditItem[];
  quality: QualityIssue[];
  collections: CollectionInfo[];
  ended: EndedSeriesInfo[];
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function plexItemToMatchable(
  item: PlexMediaItem,
  type: "movie" | "show",
): PlexMatchableItem {
  // Extract IDs from Plex GUID
  const guids = (item as unknown as { Guid?: Array<{ id: string }> }).Guid;
  const ids = extractPlexIds(item.guid, guids);

  let sizeBytes = 0;
  if (item.Media && item.Media.length > 0 && item.Media[0].Part) {
    sizeBytes = item.Media[0].Part.reduce(
      (sum, part) => sum + (part.size || 0),
      0,
    );
  }

  return {
    ratingKey: item.ratingKey,
    title: item.title,
    year: item.year,
    sizeBytes,
    type,
    ...ids,
  };
}

// ============================================================================
// Audit Functions (T006-T011)
// ============================================================================

async function auditOrphans(
  plexClient: PlexClient,
  movieIndex: MovieIndex | undefined,
  seriesIndex: SeriesIndex | undefined,
): Promise<{ movies: OrphanItem[]; shows: OrphanItem[] }> {
  const orphanMovies: OrphanItem[] = [];
  const orphanShows: OrphanItem[] = [];

  const libraries = await plexClient.getLibraries();

  // Check movies
  if (movieIndex) {
    const movieLibraries = libraries.filter((l) => l.type === "movie");
    for (const lib of movieLibraries) {
      const { items } = await plexClient.getLibraryItems(lib.key, {
        size: 10000,
      });
      for (const item of items) {
        const matchable = plexItemToMatchable(item, "movie");
        const result = matchMovie(matchable, movieIndex);
        if (!result.matched) {
          orphanMovies.push({
            id: `plex:${item.ratingKey}`,
            ratingKey: item.ratingKey,
            title: item.title,
            year: item.year,
            sizeBytes: matchable.sizeBytes || 0,
            size: formatSize(matchable.sizeBytes || 0),
            type: "movie",
            imdbId: matchable.imdbId,
            tmdbId: matchable.tmdbId,
          });
        }
      }
    }
  }

  // Check shows
  if (seriesIndex) {
    const showLibraries = libraries.filter((l) => l.type === "show");
    for (const lib of showLibraries) {
      const { items } = await plexClient.getLibraryItems(lib.key, {
        size: 10000,
      });
      for (const item of items) {
        const matchable = plexItemToMatchable(item, "show");
        const result = matchSeries(matchable, seriesIndex);
        if (!result.matched) {
          orphanShows.push({
            id: `plex:${item.ratingKey}`,
            ratingKey: item.ratingKey,
            title: item.title,
            year: item.year,
            sizeBytes: matchable.sizeBytes || 0,
            size: formatSize(matchable.sizeBytes || 0),
            type: "show",
            imdbId: matchable.imdbId,
            tvdbId: matchable.tvdbId,
          });
        }
      }
    }
  }

  return { movies: orphanMovies, shows: orphanShows };
}

async function auditMissing(
  plexClient: PlexClient,
  radarrMovies: Movie[] | undefined,
  sonarrSeries: Series[] | undefined,
): Promise<{ movies: MissingItem[]; shows: MissingItem[] }> {
  const missingMovies: MissingItem[] = [];
  const missingShows: MissingItem[] = [];

  const libraries = await plexClient.getLibraries();

  // Build Plex indexes for reverse lookup
  const plexMovieIndex = new Map<string, boolean>();
  const plexSeriesIndex = new Map<string, boolean>();

  // Index Plex movies
  const movieLibraries = libraries.filter((l) => l.type === "movie");
  for (const lib of movieLibraries) {
    const { items } = await plexClient.getLibraryItems(lib.key, {
      size: 10000,
    });
    for (const item of items) {
      const matchable = plexItemToMatchable(item, "movie");
      if (matchable.imdbId) plexMovieIndex.set(`imdb:${matchable.imdbId}`, true);
      if (matchable.tmdbId) plexMovieIndex.set(`tmdb:${matchable.tmdbId}`, true);
      plexMovieIndex.set(
        `title:${normalizeTitle(item.title)}:${item.year}`,
        true,
      );
    }
  }

  // Index Plex shows
  const showLibraries = libraries.filter((l) => l.type === "show");
  for (const lib of showLibraries) {
    const { items } = await plexClient.getLibraryItems(lib.key, {
      size: 10000,
    });
    for (const item of items) {
      const matchable = plexItemToMatchable(item, "show");
      if (matchable.tvdbId) plexSeriesIndex.set(`tvdb:${matchable.tvdbId}`, true);
      if (matchable.imdbId) plexSeriesIndex.set(`imdb:${matchable.imdbId}`, true);
      plexSeriesIndex.set(
        `title:${normalizeTitle(item.title)}:${item.year}`,
        true,
      );
    }
  }

  // Check Radarr movies against Plex
  if (radarrMovies) {
    for (const movie of radarrMovies) {
      if (!movie.hasFile) continue; // Skip movies without files

      const inPlex =
        (movie.imdbId && plexMovieIndex.has(`imdb:${movie.imdbId}`)) ||
        plexMovieIndex.has(`tmdb:${movie.tmdbId}`) ||
        plexMovieIndex.has(`title:${normalizeTitle(movie.title)}:${movie.year}`);

      if (!inPlex) {
        missingMovies.push({
          id: `radarr:${movie.id}`,
          serviceId: movie.id,
          title: movie.title,
          year: movie.year,
          sizeBytes: movie.sizeOnDisk || 0,
          size: formatSize(movie.sizeOnDisk || 0),
          type: "movie",
          monitored: movie.monitored,
          imdbId: movie.imdbId,
          tmdbId: movie.tmdbId,
        });
      }
    }
  }

  // Check Sonarr series against Plex
  if (sonarrSeries) {
    for (const series of sonarrSeries) {
      if (!series.statistics?.episodeFileCount) continue; // Skip series without files

      const inPlex =
        plexSeriesIndex.has(`tvdb:${series.tvdbId}`) ||
        (series.imdbId && plexSeriesIndex.has(`imdb:${series.imdbId}`)) ||
        plexSeriesIndex.has(
          `title:${normalizeTitle(series.title)}:${series.year}`,
        );

      if (!inPlex) {
        missingShows.push({
          id: `sonarr:${series.id}`,
          serviceId: series.id,
          title: series.title,
          year: series.year,
          sizeBytes: series.statistics?.sizeOnDisk || 0,
          size: formatSize(series.statistics?.sizeOnDisk || 0),
          type: "show",
          monitored: series.monitored,
          imdbId: series.imdbId,
          tvdbId: series.tvdbId,
          details: `${series.statistics?.episodeFileCount} episodes`,
        });
      }
    }
  }

  return { movies: missingMovies, shows: missingShows };
}

async function auditDownloads(
  sabnzbdClient: SabnzbdClient | undefined,
  sonarrClient: SonarrClient | undefined,
  radarrClient: RadarrClient | undefined,
): Promise<AuditItem[]> {
  const stuckDownloads: AuditItem[] = [];

  // Check Sabnzbd for failed/stuck downloads
  if (sabnzbdClient) {
    try {
      const failed = await sabnzbdClient.getFailedDownloads();
      for (const item of failed) {
        stuckDownloads.push({
          id: `sabnzbd:${item.nzo_id}`,
          title: item.name,
          sizeBytes: item.bytes,
          size: formatSize(item.bytes),
          details: item.fail_message || "Failed",
        });
      }
    } catch {
      // Sabnzbd might not be available
    }
  }

  // Check Sonarr queue for import blocked items
  if (sonarrClient) {
    try {
      const queue = await sonarrClient.getQueueDetails();
      for (const item of queue) {
        if (
          item.trackedDownloadState === "importBlocked" ||
          item.trackedDownloadState === "failedPending"
        ) {
          stuckDownloads.push({
            id: `sonarr:${item.id}`,
            title: item.title,
            sizeBytes: item.size,
            size: formatSize(item.size),
            details: item.errorMessage || item.trackedDownloadState,
          });
        }
      }
    } catch {
      // Sonarr might not be available
    }
  }

  // Check Radarr queue for import blocked items
  if (radarrClient) {
    try {
      const queue = await radarrClient.getQueueDetails();
      for (const item of queue) {
        if (
          item.trackedDownloadState === "importBlocked" ||
          item.trackedDownloadState === "failedPending"
        ) {
          stuckDownloads.push({
            id: `radarr:${item.id}`,
            title: item.title,
            sizeBytes: item.size,
            size: formatSize(item.size),
            details: item.errorMessage || item.trackedDownloadState,
          });
        }
      }
    } catch {
      // Radarr might not be available
    }
  }

  return stuckDownloads;
}

async function auditQuality(
  radarrMovies: Movie[] | undefined,
  radarr4kMovies: Movie[] | undefined,
): Promise<QualityIssue[]> {
  const issues: QualityIssue[] = [];

  if (!radarrMovies || !radarr4kMovies) {
    return issues;
  }

  // Build indexes for cross-checking
  const hdIndex = new Map<number, Movie>();
  const fourKIndex = new Map<number, Movie>();

  for (const movie of radarrMovies) {
    if (movie.tmdbId) hdIndex.set(movie.tmdbId, movie);
  }
  for (const movie of radarr4kMovies) {
    if (movie.tmdbId) fourKIndex.set(movie.tmdbId, movie);
  }

  // Check for 4K content in HD Radarr (should be in 4K Radarr)
  for (const movie of radarrMovies) {
    if (!movie.hasFile || !movie.movieFile?.mediaInfo) continue;
    const resolution = movie.movieFile.mediaInfo.resolution;
    if (resolution && (resolution.includes("2160") || resolution === "4K")) {
      issues.push({
        id: `radarr:${movie.id}`,
        title: movie.title,
        year: movie.year,
        sizeBytes: movie.sizeOnDisk || 0,
        size: formatSize(movie.sizeOnDisk || 0),
        direction: "4k_in_hd",
        resolution,
        tmdbId: movie.tmdbId,
        details: "4K content in HD Radarr instance",
      });
    }
  }

  // Check for HD content in 4K Radarr (should be in HD Radarr)
  for (const movie of radarr4kMovies) {
    if (!movie.hasFile || !movie.movieFile?.mediaInfo) continue;
    const resolution = movie.movieFile.mediaInfo.resolution;
    if (
      resolution &&
      !resolution.includes("2160") &&
      resolution !== "4K" &&
      (resolution.includes("1080") ||
        resolution.includes("720") ||
        resolution === "HD")
    ) {
      issues.push({
        id: `radarr4k:${movie.id}`,
        title: movie.title,
        year: movie.year,
        sizeBytes: movie.sizeOnDisk || 0,
        size: formatSize(movie.sizeOnDisk || 0),
        direction: "hd_in_4k",
        resolution,
        tmdbId: movie.tmdbId,
        details: "HD content in 4K Radarr instance",
      });
    }
  }

  return issues;
}

async function auditCollections(
  _plexClient: PlexClient,
  tmdbClient: TmdbClient | undefined,
  radarrMovies: Movie[] | undefined,
): Promise<CollectionInfo[]> {
  const results: CollectionInfo[] = [];

  if (!tmdbClient || !radarrMovies) {
    return results;
  }

  // Find all unique collection IDs from movies in Radarr that have files
  const collectionIds = new Set<number>();
  const moviesByTmdbId = new Map<number, Movie>();

  for (const movie of radarrMovies) {
    if (movie.hasFile && movie.tmdbId) {
      moviesByTmdbId.set(movie.tmdbId, movie);
    }
  }

  // Get collection info for owned movies
  for (const movie of radarrMovies) {
    if (!movie.hasFile || !movie.tmdbId) continue;

    try {
      const tmdbMovie = await tmdbClient.getMovie(movie.tmdbId);
      if (tmdbMovie.belongs_to_collection?.id) {
        collectionIds.add(tmdbMovie.belongs_to_collection.id);
      }
    } catch {
      // Movie might not be found in TMDB
    }
  }

  // Check each collection for completeness
  for (const collectionId of collectionIds) {
    try {
      const collection = await tmdbClient.getCollection(collectionId);
      const missingMovies: CollectionInfo["missingMovies"] = [];

      for (const part of collection.parts) {
        if (!moviesByTmdbId.has(part.id)) {
          missingMovies.push({
            tmdbId: part.id,
            title: part.title,
            year: part.release_date?.split("-")[0] || "N/A",
          });
        }
      }

      if (missingMovies.length > 0) {
        results.push({
          collectionId: collection.id,
          collectionName: collection.name,
          totalMovies: collection.parts.length,
          ownedMovies: collection.parts.length - missingMovies.length,
          missingMovies,
        });
      }
    } catch {
      // Collection might not be found
    }
  }

  return results;
}

async function auditEnded(
  sonarrClient: SonarrClient | undefined,
): Promise<EndedSeriesInfo[]> {
  const results: EndedSeriesInfo[] = [];

  if (!sonarrClient) {
    return results;
  }

  const allSeries = await sonarrClient.getAllSeries();
  for (const series of allSeries) {
    if (series.status === "ended" && series.statistics?.sizeOnDisk > 0) {
      results.push({
        id: `sonarr:${series.id}`,
        title: series.title,
        year: series.year,
        sizeBytes: series.statistics.sizeOnDisk,
        size: formatSize(series.statistics.sizeOnDisk),
        episodeCount: series.statistics.episodeFileCount || 0,
        status: series.status,
        imdbId: series.imdbId,
        tvdbId: series.tvdbId,
        details: `${series.statistics.episodeFileCount} episodes`,
      });
    }
  }

  return results;
}

// ============================================================================
// Tool Registration (T005, T012)
// ============================================================================

export function registerLibraryAuditTool(
  server: McpServer,
  config: Config,
  _registry: ProviderRegistry,
): void {
  server.tool(
    "library_audit",
    "Analyze library consistency across Plex, Sonarr, and Radarr. Check for orphans (Plex items not in *arr), missing imports (*arr items not in Plex), stuck downloads, quality routing issues (4K/HD mismatches), incomplete collections, and ended series.",
    {
      check: z
        .enum([
          "all",
          "orphans",
          "missing",
          "downloads",
          "quality",
          "collections",
          "ended",
        ])
        .optional()
        .default("all")
        .describe(
          'What to check: "all" (default), "orphans", "missing", "downloads", "quality", "collections", "ended"',
        ),
    },
    async ({ check }) => {
      try {
        const services: ServiceStatus[] = [];
        const result: AuditResult = {
          services,
          orphans: { movies: [], shows: [] },
          missing: { movies: [], shows: [] },
          downloads: [],
          quality: [],
          collections: [],
          ended: [],
        };

        // Initialize clients
        let plexClient: PlexClient | undefined;
        let sonarrClient: SonarrClient | undefined;
        let radarrClient: RadarrClient | undefined;
        let radarr4kClient: RadarrClient | undefined;
        let sabnzbdClient: SabnzbdClient | undefined;
        let tmdbClient: TmdbClient | undefined;

        // Plex
        if (config.plex) {
          try {
            plexClient = new PlexClient(config.plex);
            await plexClient.getLibraries(); // Test connection
            services.push({ name: "Plex", available: true });
          } catch (error) {
            services.push({
              name: "Plex",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Sonarr
        if (config.sonarr) {
          try {
            sonarrClient = new SonarrClient(config.sonarr);
            services.push({ name: "Sonarr", available: true });
          } catch (error) {
            services.push({
              name: "Sonarr",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Radarr
        if (config.radarr) {
          try {
            radarrClient = new RadarrClient(config.radarr, "Radarr");
            services.push({ name: "Radarr", available: true });
          } catch (error) {
            services.push({
              name: "Radarr",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Radarr4K
        if (config.radarr4k) {
          try {
            radarr4kClient = new RadarrClient(config.radarr4k, "Radarr4K");
            services.push({ name: "Radarr4K", available: true });
          } catch (error) {
            services.push({
              name: "Radarr4K",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Sabnzbd
        if (config.sabnzbd) {
          try {
            sabnzbdClient = new SabnzbdClient(config.sabnzbd);
            services.push({ name: "Sabnzbd", available: true });
          } catch (error) {
            services.push({
              name: "Sabnzbd",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // TMDB
        if (config.tmdb) {
          try {
            tmdbClient = new TmdbClient(config.tmdb);
            services.push({ name: "TMDB", available: true });
          } catch (error) {
            services.push({
              name: "TMDB",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Require Plex for most checks
        if (!plexClient && ["all", "orphans", "missing", "collections"].includes(check)) {
          return {
            content: [
              {
                type: "text",
                text: "Plex is required for this audit check but is not configured or available.",
              },
            ],
            isError: true,
          };
        }

        // Fetch data needed for checks
        let radarrMovies: Movie[] | undefined;
        let radarr4kMovies: Movie[] | undefined;
        let sonarrSeries: Series[] | undefined;
        let movieIndex: MovieIndex | undefined;
        let seriesIndex: SeriesIndex | undefined;

        if (radarrClient && ["all", "orphans", "missing", "collections"].includes(check)) {
          radarrMovies = await radarrClient.getAllMovies();
          movieIndex = buildMovieIndex(radarrMovies);
        }

        if (radarr4kClient && ["all", "quality"].includes(check)) {
          radarr4kMovies = await radarr4kClient.getAllMovies();
        }

        if (sonarrClient && ["all", "orphans", "missing", "ended"].includes(check)) {
          sonarrSeries = await sonarrClient.getAllSeries();
          seriesIndex = buildSeriesIndex(sonarrSeries);
        }

        // Run requested checks
        if (check === "all" || check === "orphans") {
          if (plexClient) {
            result.orphans = await auditOrphans(
              plexClient,
              movieIndex,
              seriesIndex,
            );
          }
        }

        if (check === "all" || check === "missing") {
          if (plexClient) {
            result.missing = await auditMissing(
              plexClient,
              radarrMovies,
              sonarrSeries,
            );
          }
        }

        if (check === "all" || check === "downloads") {
          result.downloads = await auditDownloads(
            sabnzbdClient,
            sonarrClient,
            radarrClient,
          );
        }

        if (check === "all" || check === "quality") {
          result.quality = await auditQuality(radarrMovies, radarr4kMovies);
        }

        if (check === "all" || check === "collections") {
          if (plexClient) {
            result.collections = await auditCollections(
              plexClient,
              tmdbClient,
              radarrMovies,
            );
          }
        }

        if (check === "all" || check === "ended") {
          result.ended = await auditEnded(sonarrClient);
        }

        // Format output
        let output = "# Library Audit Report\n\n";

        // Service status
        output += "## Service Status\n";
        for (const status of services) {
          output += `- ${status.name}: ${status.available ? "OK" : `UNAVAILABLE (${status.error})`}\n`;
        }
        output += "\n";

        if (check === "all") {
          // Summary for full audit
          output += "## Summary\n\n";
          output += "Plex ↔ Radarr Sync:\n";
          output += `  Movies in both: [calculated at runtime]\n`;
          output += `  In Plex only (orphans): ${result.orphans.movies.length}\n`;
          output += `  In Radarr only (not imported): ${result.missing.movies.length}\n\n`;

          output += "Plex ↔ Sonarr Sync:\n";
          output += `  Series in both: [calculated at runtime]\n`;
          output += `  In Plex only (orphans): ${result.orphans.shows.length}\n`;
          output += `  In Sonarr only (not imported): ${result.missing.shows.length}\n\n`;

          output += "Downloads:\n";
          output += `  Stuck/failed: ${result.downloads.length}\n\n`;

          output += "Quality Routing:\n";
          const fourKInHd = result.quality.filter(
            (q) => q.direction === "4k_in_hd",
          ).length;
          const hdIn4k = result.quality.filter(
            (q) => q.direction === "hd_in_4k",
          ).length;
          output += `  4K content in HD Radarr: ${fourKInHd}\n`;
          output += `  HD content in 4K Radarr: ${hdIn4k}\n\n`;

          output += "Collections:\n";
          output += `  Incomplete collections: ${result.collections.length}\n`;
          const totalMissing = result.collections.reduce(
            (sum, c) => sum + c.missingMovies.length,
            0,
          );
          output += `  Total missing movies: ${totalMissing}\n\n`;

          output += "Ended Series:\n";
          output += `  Ended series with files: ${result.ended.length}\n`;
          const endedSize = result.ended.reduce((sum, s) => sum + s.sizeBytes, 0);
          output += `  Potential cleanup: ${formatSize(endedSize)}\n\n`;

          output +=
            'Run with specific check for details:\n  library_audit(check: "orphans")\n  library_audit(check: "collections")\n';
        } else {
          // Detailed output for specific check
          switch (check) {
            case "orphans": {
              const totalOrphans =
                result.orphans.movies.length + result.orphans.shows.length;
              const totalSize =
                result.orphans.movies.reduce((s, i) => s + i.sizeBytes, 0) +
                result.orphans.shows.reduce((s, i) => s + i.sizeBytes, 0);
              output += `## Plex Orphans (${totalOrphans} items, ${formatSize(totalSize)})\n\n`;

              if (result.orphans.movies.length > 0) {
                output += `### Movies (${result.orphans.movies.length}):\n`;
                for (const item of result.orphans.movies.slice(0, 20)) {
                  output += `  [${item.id}] ${item.title} (${item.year || "N/A"}) - ${item.size}`;
                  if (item.imdbId) output += ` - IMDB: ${item.imdbId}`;
                  output += "\n";
                }
                if (result.orphans.movies.length > 20) {
                  output += `  ... and ${result.orphans.movies.length - 20} more\n`;
                }
                output += "\n";
              }

              if (result.orphans.shows.length > 0) {
                output += `### TV Shows (${result.orphans.shows.length}):\n`;
                for (const item of result.orphans.shows.slice(0, 20)) {
                  output += `  [${item.id}] ${item.title} (${item.year || "N/A"}) - ${item.size}`;
                  if (item.tvdbId) output += ` - TVDB: ${item.tvdbId}`;
                  output += "\n";
                }
                if (result.orphans.shows.length > 20) {
                  output += `  ... and ${result.orphans.shows.length - 20} more\n`;
                }
                output += "\n";
              }

              if (totalOrphans === 0) {
                output += "No orphans found - library is in sync!\n";
              } else {
                output +=
                  '\nTo sync these to Sonarr/Radarr:\n  library_sync(type: "orphans", confirm: true)\n';
              }
              break;
            }

            case "missing": {
              const totalMissing =
                result.missing.movies.length + result.missing.shows.length;
              output += `## Missing from Plex (${totalMissing} items)\n\n`;

              if (result.missing.movies.length > 0) {
                output += `### Movies (${result.missing.movies.length}):\n`;
                for (const item of result.missing.movies.slice(0, 20)) {
                  output += `  [${item.id}] ${item.title} (${item.year || "N/A"}) - ${item.size}`;
                  if (!item.monitored) output += " [UNMONITORED]";
                  output += "\n";
                }
                if (result.missing.movies.length > 20) {
                  output += `  ... and ${result.missing.movies.length - 20} more\n`;
                }
                output += "\n";
              }

              if (result.missing.shows.length > 0) {
                output += `### TV Shows (${result.missing.shows.length}):\n`;
                for (const item of result.missing.shows.slice(0, 20)) {
                  output += `  [${item.id}] ${item.title} - ${item.details || ""}`;
                  if (!item.monitored) output += " [UNMONITORED]";
                  output += "\n";
                }
                if (result.missing.shows.length > 20) {
                  output += `  ... and ${result.missing.shows.length - 20} more\n`;
                }
                output += "\n";
              }

              if (totalMissing === 0) {
                output +=
                  "All *arr content is in Plex! (or *arr services not configured)\n";
              }
              break;
            }

            case "downloads": {
              output += `## Stuck Downloads (${result.downloads.length})\n\n`;
              if (result.downloads.length > 0) {
                for (const item of result.downloads) {
                  output += `  [${item.id}] ${item.title} - ${item.size}`;
                  if (item.details) output += ` - ${item.details}`;
                  output += "\n";
                }
              } else {
                output += "No stuck or failed downloads found.\n";
              }
              break;
            }

            case "quality": {
              output += `## Quality Routing Issues (${result.quality.length})\n\n`;
              if (result.quality.length > 0) {
                const fourKInHd = result.quality.filter(
                  (q) => q.direction === "4k_in_hd",
                );
                const hdIn4k = result.quality.filter(
                  (q) => q.direction === "hd_in_4k",
                );

                if (fourKInHd.length > 0) {
                  output += `### 4K content in HD Radarr (${fourKInHd.length}):\n`;
                  for (const item of fourKInHd) {
                    output += `  [${item.id}] ${item.title} (${item.year}) - ${item.resolution}\n`;
                  }
                  output += "\n";
                }

                if (hdIn4k.length > 0) {
                  output += `### HD content in 4K Radarr (${hdIn4k.length}):\n`;
                  for (const item of hdIn4k) {
                    output += `  [${item.id}] ${item.title} (${item.year}) - ${item.resolution}\n`;
                  }
                  output += "\n";
                }
              } else {
                output +=
                  "No quality routing issues found (or Radarr4K not configured).\n";
              }
              break;
            }

            case "collections": {
              output += `## Incomplete Collections (${result.collections.length})\n\n`;
              if (result.collections.length > 0) {
                for (const collection of result.collections.slice(0, 10)) {
                  output += `### ${collection.collectionName} (${collection.ownedMovies}/${collection.totalMovies} movies)\n`;
                  for (const movie of collection.missingMovies) {
                    output += `  ✗ ${movie.title} (${movie.year}) - TMDB: ${movie.tmdbId}\n`;
                  }
                  output += "\n";
                }
                if (result.collections.length > 10) {
                  output += `... and ${result.collections.length - 10} more collections\n\n`;
                }
                const totalMissing = result.collections.reduce(
                  (sum, c) => sum + c.missingMovies.length,
                  0,
                );
                output += `Total missing: ${totalMissing} movies\n`;
                output += "To add missing movies: Use movie_add() with TMDB IDs shown\n";
              } else {
                output +=
                  "No incomplete collections found (or TMDB not configured).\n";
              }
              break;
            }

            case "ended": {
              const totalSize = result.ended.reduce(
                (sum, s) => sum + s.sizeBytes,
                0,
              );
              output += `## Ended Series (${result.ended.length} series, ${formatSize(totalSize)})\n\n`;
              if (result.ended.length > 0) {
                // Sort by size descending
                const sorted = [...result.ended].sort(
                  (a, b) => b.sizeBytes - a.sizeBytes,
                );
                for (const series of sorted.slice(0, 20)) {
                  output += `  [${series.id}] ${series.title} - ${series.size} (${series.episodeCount} episodes)\n`;
                }
                if (result.ended.length > 20) {
                  output += `  ... and ${result.ended.length - 20} more\n`;
                }
              } else {
                output += "No ended series with files found.\n";
              }
              break;
            }
          }
        }

        return {
          content: [{ type: "text", text: output.trim() }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );
}
