import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../../config.js";
import { TmdbClient } from "./client.js";
import { PlexClient } from "../plex/client.js";
import { RadarrClient } from "../radarr/client.js";
import { formatErrorResponse } from "../../shared/errors.js";
import { ProviderNotConfiguredError } from "../../providers/index.js";
import type { CollectionPart, Movie, MovieWithLibraryStatus } from "./types.js";

// ============================================================
// Utility Functions
// ============================================================

/**
 * Match TMDB movies against Plex library.
 * Returns movies with inLibrary flag indicating ownership status.
 *
 * Uses Plex search for each movie to handle title variations like:
 * - "The Empire Strikes Back" vs "Star Wars: Episode V - The Empire Strikes Back"
 */
async function matchAgainstLibrary(
  plexClient: PlexClient,
  tmdbMovies: CollectionPart[],
): Promise<MovieWithLibraryStatus[]> {
  const results: MovieWithLibraryStatus[] = [];

  for (const movie of tmdbMovies) {
    const year = movie.release_date ? movie.release_date.split("-")[0] : "";
    let found = false;
    let ratingKey: string | undefined;

    try {
      // Search Plex for the movie title
      const searchResults = await plexClient.searchAll(movie.title);
      const movieResults = searchResults.get("Movies") || [];

      // Check if any result matches the year (within 1 year tolerance for release date differences)
      for (const result of movieResults) {
        const resultYear = result.year?.toString() || "";
        const yearMatch = !year || !resultYear ||
          Math.abs(parseInt(year) - parseInt(resultYear)) <= 1;

        if (yearMatch) {
          found = true;
          ratingKey = result.ratingKey;
          break;
        }
      }
    } catch {
      // If search fails, mark as not found
    }

    results.push({
      ...movie,
      inLibrary: found,
      plexRatingKey: ratingKey,
    });
  }

  return results;
}

function formatMovieWithStatus(movie: MovieWithLibraryStatus): string {
  const year = movie.release_date ? movie.release_date.split("-")[0] : "TBD";
  const rating = movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : "N/A";
  const status = movie.inLibrary ? "✓ Owned" : "✗ Missing";
  return `${movie.title} (${year}) - ${status}\n   TMDB ID: ${movie.id} | Rating: ${rating}`;
}

function formatMovie(movie: Movie): string {
  const year = movie.release_date ? movie.release_date.split("-")[0] : "TBD";
  const rating = movie.vote_average ? `${movie.vote_average.toFixed(1)}/10` : "N/A";
  const overview = movie.overview
    ? `\n   ${movie.overview.slice(0, 150)}${movie.overview.length > 150 ? "..." : ""}`
    : "";
  return `${movie.title} (${year})\n   TMDB ID: ${movie.id} | Rating: ${rating}${overview}`;
}

// ============================================================
// Tool Registration
// ============================================================

export function registerTmdbTools(server: McpServer, config: Config): void {
  if (!config.tmdb) {
    console.error("TMDB not configured, skipping tool registration");
    return;
  }

  const tmdbClient = new TmdbClient(config.tmdb);

  // Plex client for library cross-reference (optional)
  const plexClient = config.plex ? new PlexClient(config.plex) : null;

  // Radarr client for adding movies (optional)
  const radarrClient = config.radarr
    ? new RadarrClient(config.radarr)
    : null;

  // ============================================================
  // Service Tools (Admin)
  // ============================================================

  // tmdb_collection - Look up a TMDB collection by name or ID
  server.tool(
    "tmdb_collection",
    "Look up a movie collection by name or ID. Returns all movies in the collection.",
    {
      query: z
        .string()
        .optional()
        .describe("Collection name to search for (e.g., 'Marvel Cinematic Universe')"),
      collection_id: z.coerce
        .number()
        .optional()
        .describe("TMDB collection ID for direct lookup"),
    },
    async ({ query, collection_id }) => {
      try {
        if (!query && !collection_id) {
          return {
            content: [
              {
                type: "text",
                text: "Please provide either a collection name (query) or collection_id.",
              },
            ],
            isError: true,
          };
        }

        let collectionId = collection_id;

        // If query provided, search for collection first
        if (query && !collectionId) {
          const searchResults = await tmdbClient.searchCollections(query);
          if (searchResults.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No collections found matching "${query}".`,
                },
              ],
            };
          }

          // If multiple results, show them
          if (searchResults.length > 1) {
            const formatted = searchResults
              .slice(0, 10)
              .map((c) => `[${c.id}] ${c.name}`)
              .join("\n");
            return {
              content: [
                {
                  type: "text",
                  text:
                    `Found ${searchResults.length} collections matching "${query}":\n\n${formatted}\n\n` +
                    `Use collection_id parameter with the desired ID for full details.`,
                },
              ],
            };
          }

          collectionId = searchResults[0].id;
        }

        // Get full collection details
        const collection = await tmdbClient.getCollection(collectionId!);

        const formatted = collection.parts
          .sort((a, b) => (a.release_date || "").localeCompare(b.release_date || ""))
          .map((movie) => {
            const year = movie.release_date ? movie.release_date.split("-")[0] : "TBD";
            const rating = movie.vote_average
              ? `${movie.vote_average.toFixed(1)}/10`
              : "N/A";
            return `${movie.title} (${year}) [TMDB: ${movie.id}] - Rating: ${rating}`;
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Collection: ${collection.name}\n` +
                `ID: ${collection.id}\n` +
                `Total Movies: ${collection.parts.length}\n\n` +
                `${collection.overview ? `Overview: ${collection.overview}\n\n` : ""}` +
                `Movies:\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // tmdb_similar - Find similar movies to a given title
  server.tool(
    "tmdb_similar",
    "Find movies similar to a given title. Can filter to show only movies not in your library. Optional: Plex (for missing_only filter).",
    {
      tmdb_id: z.coerce.number().describe("TMDB ID of the movie to find similar titles for"),
      missing_only: z
        .boolean()
        .optional()
        .describe("Only show movies NOT in your Plex library. Default: false"),
      limit: z.coerce
        .number()
        .optional()
        .default(10)
        .describe("Maximum results to return. Default: 10"),
    },
    async ({ tmdb_id, missing_only, limit }) => {
      try {
        // Get the source movie for context
        const sourceMovie = await tmdbClient.getMovie(tmdb_id);
        const similarMovies = await tmdbClient.getSimilar(tmdb_id);

        if (similarMovies.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No similar movies found for "${sourceMovie.title}".`,
              },
            ],
          };
        }

        // If library filtering requested and Plex is configured
        if (missing_only && plexClient) {
          const moviesWithStatus = await matchAgainstLibrary(
            plexClient,
            similarMovies.map((m) => ({
              id: m.id,
              title: m.title,
              original_title: m.original_title,
              overview: m.overview,
              release_date: m.release_date,
              poster_path: m.poster_path,
              backdrop_path: m.backdrop_path,
              vote_average: m.vote_average,
              vote_count: m.vote_count,
              popularity: m.popularity,
              adult: m.adult,
              video: m.video,
              genre_ids: m.genre_ids || [],
            })),
          );

          const missingMovies = moviesWithStatus.filter((m) => !m.inLibrary);

          if (missingMovies.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `You already own all similar movies to "${sourceMovie.title}"!`,
                },
              ],
            };
          }

          const formatted = missingMovies
            .slice(0, limit)
            .map(formatMovieWithStatus)
            .join("\n\n");

          return {
            content: [
              {
                type: "text",
                text:
                  `Movies similar to "${sourceMovie.title}" (missing from library):\n\n${formatted}` +
                  `${missingMovies.length > limit ? `\n\n... and ${missingMovies.length - limit} more` : ""}`,
              },
            ],
          };
        }

        // Show all similar movies
        const formatted = similarMovies
          .slice(0, limit)
          .map(formatMovie)
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Movies similar to "${sourceMovie.title}":\n\n${formatted}` +
                `${similarMovies.length > limit ? `\n\n... and ${similarMovies.length - limit} more` : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // tmdb_recommendations - Get recommendations based on a movie
  server.tool(
    "tmdb_recommendations",
    "Get movie recommendations based on a title. Can filter to show only movies not in your library. Optional: Plex (for missing_only filter).",
    {
      tmdb_id: z.coerce.number().describe("TMDB ID of the movie to get recommendations for"),
      missing_only: z
        .boolean()
        .optional()
        .describe("Only show movies NOT in your Plex library. Default: false"),
      limit: z.coerce
        .number()
        .optional()
        .default(10)
        .describe("Maximum results to return. Default: 10"),
    },
    async ({ tmdb_id, missing_only, limit }) => {
      try {
        // Get the source movie for context
        const sourceMovie = await tmdbClient.getMovie(tmdb_id);
        const recommendations = await tmdbClient.getRecommendations(tmdb_id);

        if (recommendations.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No recommendations found for "${sourceMovie.title}".`,
              },
            ],
          };
        }

        // If library filtering requested and Plex is configured
        if (missing_only && plexClient) {
          const moviesWithStatus = await matchAgainstLibrary(
            plexClient,
            recommendations.map((m) => ({
              id: m.id,
              title: m.title,
              original_title: m.original_title,
              overview: m.overview,
              release_date: m.release_date,
              poster_path: m.poster_path,
              backdrop_path: m.backdrop_path,
              vote_average: m.vote_average,
              vote_count: m.vote_count,
              popularity: m.popularity,
              adult: m.adult,
              video: m.video,
              genre_ids: m.genre_ids || [],
            })),
          );

          const missingMovies = moviesWithStatus.filter((m) => !m.inLibrary);

          if (missingMovies.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `You already own all recommended movies based on "${sourceMovie.title}"!`,
                },
              ],
            };
          }

          const formatted = missingMovies
            .slice(0, limit)
            .map(formatMovieWithStatus)
            .join("\n\n");

          return {
            content: [
              {
                type: "text",
                text:
                  `Recommendations based on "${sourceMovie.title}" (missing from library):\n\n${formatted}` +
                  `${missingMovies.length > limit ? `\n\n... and ${missingMovies.length - limit} more` : ""}`,
              },
            ],
          };
        }

        // Show all recommendations
        const formatted = recommendations
          .slice(0, limit)
          .map(formatMovie)
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Recommendations based on "${sourceMovie.title}":\n\n${formatted}` +
                `${recommendations.length > limit ? `\n\n... and ${recommendations.length - limit} more` : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // tmdb_search - Search TMDB for movies
  server.tool(
    "tmdb_search",
    "Search TMDB for movies by title. Useful for finding TMDB IDs.",
    {
      query: z.string().describe("Movie title to search for"),
      limit: z.coerce
        .number()
        .optional()
        .default(10)
        .describe("Maximum results to return. Default: 10"),
    },
    async ({ query, limit }) => {
      try {
        const results = await tmdbClient.searchMovies(query);

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No movies found matching "${query}".`,
              },
            ],
          };
        }

        const formatted = results.slice(0, limit).map(formatMovie).join("\n\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Search results for "${query}":\n\n${formatted}` +
                `${results.length > limit ? `\n\n... and ${results.length - limit} more` : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // ============================================================
  // Semantic Tools (User-Facing)
  // ============================================================

  // collection_status - Check completion status of a movie collection
  server.tool(
    "collection_status",
    "Check how many movies from a collection you own. Shows completion status. Requires: Plex.",
    {
      collection_id: z.coerce
        .number()
        .describe("TMDB collection ID (use tmdb_collection to find)"),
    },
    async ({ collection_id }) => {
      try {
        if (!plexClient) {
          throw new ProviderNotConfiguredError("plex");
        }

        const collection = await tmdbClient.getCollection(collection_id);
        const moviesWithStatus = await matchAgainstLibrary(
          plexClient,
          collection.parts,
        );

        const ownedCount = moviesWithStatus.filter((m) => m.inLibrary).length;
        const totalCount = moviesWithStatus.length;
        const missingCount = totalCount - ownedCount;

        // Sort by release date for display
        const sortedMovies = moviesWithStatus.sort((a, b) =>
          (a.release_date || "").localeCompare(b.release_date || ""),
        );

        const formatted = sortedMovies.map(formatMovieWithStatus).join("\n\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Collection: ${collection.name}\n` +
                `Status: You have ${ownedCount} of ${totalCount} movies (${missingCount} missing)\n\n` +
                `${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // collection_missing - List missing movies from a collection
  server.tool(
    "collection_missing",
    "List movies you're missing from a collection. Returns TMDB IDs for adding to Radarr. Requires: Plex.",
    {
      collection_id: z.coerce
        .number()
        .describe("TMDB collection ID (use tmdb_collection to find)"),
    },
    async ({ collection_id }) => {
      try {
        if (!plexClient) {
          throw new ProviderNotConfiguredError("plex");
        }

        const collection = await tmdbClient.getCollection(collection_id);
        const moviesWithStatus = await matchAgainstLibrary(
          plexClient,
          collection.parts,
        );

        const missingMovies = moviesWithStatus.filter((m) => !m.inLibrary);

        if (missingMovies.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Congratulations! You have all ${collection.parts.length} movies from "${collection.name}"!`,
              },
            ],
          };
        }

        // Sort by release date
        const sortedMissing = missingMovies.sort((a, b) =>
          (a.release_date || "").localeCompare(b.release_date || ""),
        );

        const formatted = sortedMissing
          .map((movie) => {
            const year = movie.release_date
              ? movie.release_date.split("-")[0]
              : "TBD";
            const rating = movie.vote_average
              ? `${movie.vote_average.toFixed(1)}/10`
              : "N/A";
            return `${movie.title} (${year}) - TMDB ID: ${movie.id} | Rating: ${rating}`;
          })
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text:
                `Missing from "${collection.name}" (${missingMovies.length} of ${collection.parts.length}):\n\n${formatted}\n\n` +
                `Use collection_add_missing to add these to Radarr.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // collection_add_missing - Add missing collection items to Radarr
  server.tool(
    "collection_add_missing",
    "Add missing movies from a collection to Radarr. Requires confirmation. Requires: Plex, Radarr.",
    {
      collection_id: z.coerce
        .number()
        .describe("TMDB collection ID (use tmdb_collection to find)"),
      confirm: z
        .boolean()
        .describe("Must be true to confirm adding movies. Required for safety."),
      tmdb_ids: z
        .string()
        .optional()
        .describe(
          "Comma-separated TMDB IDs to add (optional - adds all missing if not specified)",
        ),
    },
    async ({ collection_id, confirm, tmdb_ids }) => {
      try {
        if (!confirm) {
          return {
            content: [
              {
                type: "text",
                text:
                  "Action cancelled. Set confirm=true to add movies to Radarr.\n" +
                  "Use collection_missing first to see what will be added.",
              },
            ],
          };
        }

        if (!plexClient) {
          throw new ProviderNotConfiguredError("plex");
        }

        if (!radarrClient) {
          throw new ProviderNotConfiguredError("radarr");
        }

        const collection = await tmdbClient.getCollection(collection_id);
        const moviesWithStatus = await matchAgainstLibrary(
          plexClient,
          collection.parts,
        );

        let moviesToAdd = moviesWithStatus.filter((m) => !m.inLibrary);

        // If specific IDs provided, filter to only those
        if (tmdb_ids) {
          const requestedIds = new Set(
            tmdb_ids.split(",").map((id) => parseInt(id.trim(), 10)),
          );
          moviesToAdd = moviesToAdd.filter((m) => requestedIds.has(m.id));
        }

        if (moviesToAdd.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No movies to add. Collection may be complete or specified IDs are already owned.",
              },
            ],
          };
        }

        // Get Radarr profiles and folders
        const profiles = await radarrClient.getProfiles();
        const folders = await radarrClient.getRootFolders();

        const defaultProfile = profiles.find((p) => p.name === "HD-1080p") || profiles[0];
        const defaultFolder = folders[0];

        if (!defaultProfile || !defaultFolder) {
          return {
            content: [
              {
                type: "text",
                text: "Could not determine Radarr quality profile or root folder.",
              },
            ],
            isError: true,
          };
        }

        // Add movies one by one, tracking results
        const added: string[] = [];
        const skipped: string[] = [];
        const failed: string[] = [];

        for (const movie of moviesToAdd) {
          try {
            // Check if already in Radarr
            const existing = await radarrClient.movieExists(movie.id);
            if (existing) {
              skipped.push(`${movie.title} (already in Radarr)`);
              continue;
            }

            // Look up movie details from Radarr
            const lookupResults = await radarrClient.searchMovies(`tmdb:${movie.id}`);
            const movieInfo = lookupResults.find((m) => m.tmdbId === movie.id);

            if (!movieInfo) {
              failed.push(`${movie.title} (not found in Radarr lookup)`);
              continue;
            }

            // Add to Radarr
            await radarrClient.addMovie({
              tmdbId: movieInfo.tmdbId,
              title: movieInfo.title,
              qualityProfileId: defaultProfile.id,
              titleSlug: movieInfo.titleSlug,
              images: movieInfo.images,
              rootFolderPath: defaultFolder.path,
              monitored: true,
              minimumAvailability: "released",
              addOptions: {
                searchForMovie: true,
              },
            });

            added.push(movie.title);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            failed.push(`${movie.title} (${errMsg})`);
          }
        }

        // Build result message
        let message = `Added ${added.length} movies from "${collection.name}" to Radarr:\n`;

        if (added.length > 0) {
          message += `\nAdded:\n${added.map((t) => `  ✓ ${t}`).join("\n")}`;
        }

        if (skipped.length > 0) {
          message += `\n\nSkipped:\n${skipped.map((t) => `  - ${t}`).join("\n")}`;
        }

        if (failed.length > 0) {
          message += `\n\nFailed:\n${failed.map((t) => `  ✗ ${t}`).join("\n")}`;
        }

        return {
          content: [{ type: "text", text: message }],
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
