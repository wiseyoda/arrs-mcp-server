/**
 * Library Sync Tool
 *
 * Batch operations to sync Plex orphans to Sonarr/Radarr
 * with dry-run preview and explicit confirmation.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import type { ProviderRegistry } from "../providers/index.js";
import { PlexClient } from "../services/plex/client.js";
import { SonarrClient } from "../services/sonarr/client.js";
import { RadarrClient } from "../services/radarr/client.js";
import { TmdbClient } from "../services/tmdb/client.js";
import { formatErrorResponse } from "../shared/errors.js";
import {
  buildMovieIndex,
  buildSeriesIndex,
  matchMovie,
  matchSeries,
  extractPlexIds,
  type PlexMatchableItem,
} from "../shared/matching.js";
import type { Movie } from "../services/radarr/types.js";
import type { Series } from "../services/sonarr/types.js";
import type { PlexMediaItem } from "../services/plex/types.js";

// ============================================================================
// Types (T013)
// ============================================================================

interface SyncItem {
  id: string;
  title: string;
  year?: number;
  type: "movie" | "show";
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
}

interface SyncResult {
  success: boolean;
  item: SyncItem;
  error?: string;
}

interface LibrarySyncResult {
  mode: "preview" | "execute";
  movies: {
    toAdd: SyncItem[];
    results?: SyncResult[];
  };
  shows: {
    toAdd: SyncItem[];
    results?: SyncResult[];
  };
  collections?: {
    collectionId: number;
    collectionName: string;
    toAdd: SyncItem[];
    results?: SyncResult[];
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function plexItemToMatchable(
  item: PlexMediaItem,
  type: "movie" | "show",
): PlexMatchableItem {
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

async function findOrphans(
  plexClient: PlexClient,
  radarrMovies: Movie[] | undefined,
  sonarrSeries: Series[] | undefined,
): Promise<{ movies: SyncItem[]; shows: SyncItem[] }> {
  const orphanMovies: SyncItem[] = [];
  const orphanShows: SyncItem[] = [];

  const libraries = await plexClient.getLibraries();

  // Build indexes
  const movieIndex = radarrMovies ? buildMovieIndex(radarrMovies) : undefined;
  const seriesIndex = sonarrSeries ? buildSeriesIndex(sonarrSeries) : undefined;

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
            title: item.title,
            year: item.year,
            type: "movie",
            tmdbId: matchable.tmdbId,
            imdbId: matchable.imdbId,
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
            title: item.title,
            year: item.year,
            type: "show",
            tvdbId: matchable.tvdbId,
            imdbId: matchable.imdbId,
          });
        }
      }
    }
  }

  return { movies: orphanMovies, shows: orphanShows };
}

// ============================================================================
// Tool Registration (T014, T015, T016)
// ============================================================================

export function registerLibrarySyncTool(
  server: McpServer,
  config: Config,
  _registry: ProviderRegistry,
): void {
  server.tool(
    "library_sync",
    'Sync Plex orphans to Sonarr/Radarr. Use type="orphans" to add Plex-only content to *arr services, or type="collection" with collection_id to add missing collection movies. Defaults to dry-run preview; set confirm=true to execute.',
    {
      type: z
        .enum(["orphans", "collection"])
        .describe('Sync type: "orphans" or "collection"'),
      confirm: z
        .boolean()
        .optional()
        .default(false)
        .describe("Set to true to execute sync. Default: false (dry-run preview)"),
      collection_id: z
        .number()
        .optional()
        .describe("TMDB collection ID (required for type=collection)"),
    },
    async ({ type, confirm, collection_id }) => {
      try {
        const result: LibrarySyncResult = {
          mode: confirm ? "execute" : "preview",
          movies: { toAdd: [] },
          shows: { toAdd: [] },
        };

        // Initialize clients
        let plexClient: PlexClient | undefined;
        let sonarrClient: SonarrClient | undefined;
        let radarrClient: RadarrClient | undefined;
        let tmdbClient: TmdbClient | undefined;

        if (config.plex) {
          plexClient = new PlexClient(config.plex);
        }
        if (config.sonarr) {
          sonarrClient = new SonarrClient(config.sonarr);
        }
        if (config.radarr) {
          radarrClient = new RadarrClient(config.radarr, "Radarr");
        }
        if (config.tmdb) {
          tmdbClient = new TmdbClient(config.tmdb);
        }

        if (type === "orphans") {
          if (!plexClient) {
            return {
              content: [
                { type: "text", text: "Plex is required for orphan sync." },
              ],
              isError: true,
            };
          }

          // Get Radarr and Sonarr data
          const radarrMovies = radarrClient
            ? await radarrClient.getAllMovies()
            : undefined;
          const sonarrSeries = sonarrClient
            ? await sonarrClient.getAllSeries()
            : undefined;

          // Find orphans
          const orphans = await findOrphans(
            plexClient,
            radarrMovies,
            sonarrSeries,
          );
          result.movies.toAdd = orphans.movies;
          result.shows.toAdd = orphans.shows;

          if (confirm) {
            // Execute sync
            result.movies.results = [];
            result.shows.results = [];

            // Add movies to Radarr
            if (radarrClient && orphans.movies.length > 0) {
              const profiles = await radarrClient.getProfiles();
              const rootFolders = await radarrClient.getRootFolders();
              const defaultProfile = profiles[0];
              const defaultRoot = rootFolders[0];

              for (const movie of orphans.movies) {
                try {
                  if (!movie.tmdbId) {
                    result.movies.results.push({
                      success: false,
                      item: movie,
                      error: "No TMDB ID available",
                    });
                    continue;
                  }

                  // Look up movie in TMDB to get required fields
                  const lookup = await radarrClient.searchMovies(
                    `tmdb:${movie.tmdbId}`,
                  );
                  if (lookup.length === 0) {
                    result.movies.results.push({
                      success: false,
                      item: movie,
                      error: "Movie not found in Radarr lookup",
                    });
                    continue;
                  }

                  const movieInfo = lookup[0];
                  await radarrClient.addMovie({
                    tmdbId: movie.tmdbId,
                    title: movieInfo.title,
                    qualityProfileId: defaultProfile.id,
                    titleSlug: movieInfo.titleSlug,
                    images: movieInfo.images,
                    rootFolderPath: defaultRoot.path,
                    monitored: false, // Don't auto-search since file exists
                  });

                  result.movies.results.push({
                    success: true,
                    item: movie,
                  });
                } catch (error) {
                  result.movies.results.push({
                    success: false,
                    item: movie,
                    error: formatErrorResponse(error),
                  });
                }
              }
            }

            // Add shows to Sonarr
            if (sonarrClient && orphans.shows.length > 0) {
              const profiles = await sonarrClient.getProfiles();
              const rootFolders = await sonarrClient.getRootFolders();
              const defaultProfile = profiles[0];
              const defaultRoot = rootFolders[0];

              for (const show of orphans.shows) {
                try {
                  if (!show.tvdbId) {
                    result.shows.results.push({
                      success: false,
                      item: show,
                      error: "No TVDB ID available",
                    });
                    continue;
                  }

                  // Look up series in Sonarr by title, then match by TVDB ID
                  const lookup = await sonarrClient.searchSeries(show.title);
                  const seriesInfo = lookup.find((s) => s.tvdbId === show.tvdbId);
                  if (!seriesInfo) {
                    result.shows.results.push({
                      success: false,
                      item: show,
                      error: "Series not found in Sonarr lookup",
                    });
                    continue;
                  }
                  await sonarrClient.addSeries({
                    tvdbId: show.tvdbId,
                    title: seriesInfo.title,
                    qualityProfileId: defaultProfile.id,
                    titleSlug: seriesInfo.titleSlug,
                    images: seriesInfo.images,
                    seasons: seriesInfo.seasons,
                    rootFolderPath: defaultRoot.path,
                    monitored: false, // Don't auto-search since files exist
                  });

                  result.shows.results.push({
                    success: true,
                    item: show,
                  });
                } catch (error) {
                  result.shows.results.push({
                    success: false,
                    item: show,
                    error: formatErrorResponse(error),
                  });
                }
              }
            }
          }
        } else if (type === "collection") {
          if (!collection_id) {
            return {
              content: [
                {
                  type: "text",
                  text: "collection_id is required for type=collection",
                },
              ],
              isError: true,
            };
          }

          if (!tmdbClient || !radarrClient) {
            return {
              content: [
                {
                  type: "text",
                  text: "TMDB and Radarr are required for collection sync.",
                },
              ],
              isError: true,
            };
          }

          // Get collection info
          const collection = await tmdbClient.getCollection(collection_id);
          const radarrMovies = await radarrClient.getAllMovies();
          const movieIndex = buildMovieIndex(radarrMovies);

          // Find missing movies
          const missingMovies: SyncItem[] = [];
          for (const part of collection.parts) {
            const existing = movieIndex.byTmdbId.get(part.id);
            if (!existing) {
              missingMovies.push({
                id: `tmdb:${part.id}`,
                title: part.title,
                year: part.release_date
                  ? parseInt(part.release_date.split("-")[0])
                  : undefined,
                type: "movie",
                tmdbId: part.id,
              });
            }
          }

          result.collections = {
            collectionId: collection.id,
            collectionName: collection.name,
            toAdd: missingMovies,
          };

          if (confirm && missingMovies.length > 0) {
            result.collections.results = [];
            const profiles = await radarrClient.getProfiles();
            const rootFolders = await radarrClient.getRootFolders();
            const defaultProfile = profiles[0];
            const defaultRoot = rootFolders[0];

            for (const movie of missingMovies) {
              try {
                const lookup = await radarrClient.searchMovies(
                  `tmdb:${movie.tmdbId}`,
                );
                if (lookup.length === 0) {
                  result.collections.results.push({
                    success: false,
                    item: movie,
                    error: "Movie not found in Radarr lookup",
                  });
                  continue;
                }

                const movieInfo = lookup[0];
                await radarrClient.addMovie({
                  tmdbId: movie.tmdbId!,
                  title: movieInfo.title,
                  qualityProfileId: defaultProfile.id,
                  titleSlug: movieInfo.titleSlug,
                  images: movieInfo.images,
                  rootFolderPath: defaultRoot.path,
                  monitored: true,
                  addOptions: { searchForMovie: true },
                });

                result.collections.results.push({
                  success: true,
                  item: movie,
                });
              } catch (error) {
                result.collections.results.push({
                  success: false,
                  item: movie,
                  error: formatErrorResponse(error),
                });
              }
            }
          }
        }

        // Format output
        let output = "";

        if (result.mode === "preview") {
          output += "# Sync Preview (dry-run)\n\n";

          if (type === "orphans") {
            if (result.movies.toAdd.length > 0) {
              output += `## Would add to Radarr (${result.movies.toAdd.length} movies):\n`;
              for (const movie of result.movies.toAdd.slice(0, 20)) {
                output += `  ${movie.title} (${movie.year || "N/A"})`;
                if (movie.tmdbId) output += ` - TMDB: ${movie.tmdbId}`;
                output += "\n";
              }
              if (result.movies.toAdd.length > 20) {
                output += `  ... (${result.movies.toAdd.length - 20} more)\n`;
              }
              output += "\n";
            }

            if (result.shows.toAdd.length > 0) {
              output += `## Would add to Sonarr (${result.shows.toAdd.length} series):\n`;
              for (const show of result.shows.toAdd.slice(0, 20)) {
                output += `  ${show.title} (${show.year || "N/A"})`;
                if (show.tvdbId) output += ` - TVDB: ${show.tvdbId}`;
                output += "\n";
              }
              if (result.shows.toAdd.length > 20) {
                output += `  ... (${result.shows.toAdd.length - 20} more)\n`;
              }
              output += "\n";
            }

            if (
              result.movies.toAdd.length === 0 &&
              result.shows.toAdd.length === 0
            ) {
              output += "No orphans found to sync.\n";
            } else {
              output +=
                '\nTo execute: library_sync(type: "orphans", confirm: true)\n';
            }
          } else if (type === "collection" && result.collections) {
            output += `## ${result.collections.collectionName}\n\n`;
            if (result.collections.toAdd.length > 0) {
              output += `Would add ${result.collections.toAdd.length} movies:\n`;
              for (const movie of result.collections.toAdd) {
                output += `  ${movie.title} (${movie.year || "N/A"}) - TMDB: ${movie.tmdbId}\n`;
              }
              output += `\nTo execute: library_sync(type: "collection", collection_id: ${collection_id}, confirm: true)\n`;
            } else {
              output += "Collection is complete - no movies to add.\n";
            }
          }
        } else {
          output += "# Sync Complete\n\n";

          if (type === "orphans") {
            if (result.movies.results && result.movies.results.length > 0) {
              const succeeded = result.movies.results.filter((r) => r.success);
              const failed = result.movies.results.filter((r) => !r.success);
              output += `## Added to Radarr: ${succeeded.length} movies\n`;
              for (const r of succeeded) {
                output += `  ✓ ${r.item.title} (${r.item.year || "N/A"})\n`;
              }
              if (failed.length > 0) {
                output += `\nFailed: ${failed.length}\n`;
                for (const r of failed) {
                  output += `  ✗ ${r.item.title}: ${r.error}\n`;
                }
              }
              output += "\n";
            }

            if (result.shows.results && result.shows.results.length > 0) {
              const succeeded = result.shows.results.filter((r) => r.success);
              const failed = result.shows.results.filter((r) => !r.success);
              output += `## Added to Sonarr: ${succeeded.length} series\n`;
              for (const r of succeeded) {
                output += `  ✓ ${r.item.title} (${r.item.year || "N/A"})\n`;
              }
              if (failed.length > 0) {
                output += `\nFailed: ${failed.length}\n`;
                for (const r of failed) {
                  output += `  ✗ ${r.item.title}: ${r.error}\n`;
                }
              }
              output += "\n";
            }

            const totalSuccess =
              (result.movies.results?.filter((r) => r.success).length || 0) +
              (result.shows.results?.filter((r) => r.success).length || 0);
            const totalFailed =
              (result.movies.results?.filter((r) => !r.success).length || 0) +
              (result.shows.results?.filter((r) => !r.success).length || 0);
            output += `Total: ${totalSuccess} succeeded, ${totalFailed} failed\n`;
          } else if (type === "collection" && result.collections?.results) {
            const succeeded = result.collections.results.filter(
              (r) => r.success,
            );
            const failed = result.collections.results.filter((r) => !r.success);
            output += `## ${result.collections.collectionName}\n\n`;
            output += `Added: ${succeeded.length} movies\n`;
            for (const r of succeeded) {
              output += `  ✓ ${r.item.title} (${r.item.year || "N/A"})\n`;
            }
            if (failed.length > 0) {
              output += `\nFailed: ${failed.length}\n`;
              for (const r of failed) {
                output += `  ✗ ${r.item.title}: ${r.error}\n`;
              }
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
