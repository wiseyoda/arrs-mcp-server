import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../../config.js";
import { RadarrClient } from "./client.js";
import { formatErrorResponse, ArrsError } from "../../shared/errors.js";
import type { MovieLookup, QueueItem, Movie } from "./types.js";

// Quality routing helper - routes to HD (default) or 4K based on quality parameter
function getRadarrClient(
  quality: "hd" | "4k" = "hd",
  config: Config
): RadarrClient {
  if (quality === "4k") {
    if (!config.radarr4k) {
      throw new ArrsError("Radarr4K not configured. Cannot process 4K request.");
    }
    return new RadarrClient(config.radarr4k);
  }
  if (!config.radarr) {
    throw new ArrsError("Radarr not configured.");
  }
  return new RadarrClient(config.radarr);
}

function formatMovieLookup(movie: MovieLookup): string {
  const year = movie.year ? ` (${movie.year})` : "";
  const runtime = movie.runtime ? ` - ${movie.runtime}min` : "";
  const overview = movie.overview
    ? `\n   ${movie.overview.slice(0, 150)}${movie.overview.length > 150 ? "..." : ""}`
    : "";
  return `${movie.title}${year}${runtime} [TMDB: ${movie.tmdbId}]${overview}`;
}

function formatQueueItem(item: QueueItem): string {
  const progress = item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) : 0;
  const eta = item.timeleft || "unknown";
  const status = item.trackedDownloadStatus || item.status;
  const errors =
    item.statusMessages && item.statusMessages.length > 0
      ? `\n   Issues: ${item.statusMessages.map((m) => m.title).join(", ")}`
      : "";
  return `${item.title} - ${progress}% (ETA: ${eta}) [${status}]${errors}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format a movie for display in tool output.
 *
 * IMPORTANT: Always include the movie ID in the output!
 * Users need the ID to call radarr_details, movie_upgrade, movie_delete, etc.
 * See .specify/memory/coding-standards.md "Entity IDs in Output" section.
 */
function formatMovie(movie: Movie, options: {
  show_size?: boolean;
  show_rating?: boolean;
  show_runtime?: boolean;
  show_added?: boolean;
} = {}): string {
  const statusText = movie.status === "released" ? "Released" :
    movie.status === "inCinemas" ? "In Cinemas" :
    movie.status === "announced" ? "Announced" : movie.status;
  const hasFile = movie.hasFile ? "Downloaded" : "Missing";
  const monitored = movie.monitored ? "Monitored" : "Not monitored";

  let line = `[${movie.id}] ${movie.title} (${movie.year}) - ${statusText}, ${hasFile}, ${monitored}`;

  const extras: string[] = [];
  if (options.show_size && movie.sizeOnDisk > 0) {
    extras.push(formatBytes(movie.sizeOnDisk));
  }
  if (options.show_rating && movie.ratings) {
    const imdb = movie.ratings.imdb?.value;
    const tmdb = movie.ratings.tmdb?.value;
    if (imdb) extras.push(`IMDB: ${imdb.toFixed(1)}`);
    else if (tmdb) extras.push(`TMDB: ${tmdb.toFixed(1)}`);
  }
  if (options.show_runtime && movie.runtime) {
    extras.push(`${movie.runtime}min`);
  }
  if (options.show_added && movie.added) {
    extras.push(`Added: ${movie.added.split("T")[0]}`);
  }

  if (extras.length > 0) {
    line += ` [${extras.join(", ")}]`;
  }

  return line;
}

export function registerRadarrTools(server: McpServer, config: Config): void {
  // Check if at least one Radarr instance is configured
  if (!config.radarr && !config.radarr4k) {
    console.error("Radarr not configured, skipping tool registration");
    return;
  }

  // ============================================================
  // Semantic Tools (User-Facing)
  // ============================================================

  // movie_search - Search for movies by name
  server.tool(
    "movie_search",
    "Search for movies by name to find TMDB IDs for adding. Supports IMDB ID search with 'imdb:tt1234567' format.",
    {
      query: z.string().describe("Movie name to search for, or 'imdb:tt1234567' for IMDB ID search"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance to search. Default: hd"),
    },
    async ({ query, quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const results = await client.searchMovies(query);
        if (results.length === 0) {
          return {
            content: [{ type: "text", text: `No movies found matching "${query}"` }],
          };
        }

        const formatted = results.slice(0, 10).map(formatMovieLookup).join("\n\n");
        const qualityLabel = quality === "4k" ? " (4K)" : "";
        return {
          content: [
            {
              type: "text",
              text: `Found ${results.length} results${qualityLabel}:\n\n${formatted}${results.length > 10 ? `\n\n... and ${results.length - 10} more` : ""}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // movie_add - Add a movie to Radarr
  server.tool(
    "movie_add",
    "Add a movie to Radarr. Use movie_search first to find the TMDB ID.",
    {
      tmdb_id: z.coerce.number().describe("TMDB ID of the movie to add"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance to add to. Default: hd (safe default)"),
      quality_profile: z.string().optional().describe("Quality profile name (optional, uses first available if not specified)"),
      root_folder: z.string().optional().describe("Root folder path (optional, uses first available if not specified)"),
      search_now: z.boolean().optional().describe("Start searching for the movie immediately. Default: true"),
    },
    async ({ tmdb_id, quality, quality_profile, root_folder, search_now }) => {
      try {
        const client = getRadarrClient(quality, config);
        const qualityLabel = quality === "4k" ? " (4K)" : "";

        // Check if movie already exists
        const existing = await client.movieExists(tmdb_id);
        if (existing) {
          return {
            content: [
              {
                type: "text",
                text: `"${existing.title}" is already in your${qualityLabel} library.`,
              },
            ],
          };
        }

        // Look up movie details
        const lookupResults = await client.searchMovies(`tmdb:${tmdb_id}`);
        const movieInfo = lookupResults.find((m) => m.tmdbId === tmdb_id);
        if (!movieInfo) {
          return {
            content: [{ type: "text", text: `Could not find movie with TMDB ID ${tmdb_id}` }],
            isError: true,
          };
        }

        // Get profiles and folders
        const profiles = await client.getProfiles();
        const folders = await client.getRootFolders();

        // Find or use default profile
        let profileId = profiles[0]?.id;
        if (quality_profile) {
          const found = profiles.find(
            (p) => p.name.toLowerCase() === quality_profile.toLowerCase()
          );
          if (found) {
            profileId = found.id;
          }
        }

        // Find or use default folder
        let folderPath = folders[0]?.path;
        if (root_folder) {
          const found = folders.find((f) =>
            f.path.toLowerCase().includes(root_folder.toLowerCase())
          );
          if (found) {
            folderPath = found.path;
          }
        }

        if (!profileId || !folderPath) {
          return {
            content: [
              { type: "text", text: "Could not determine quality profile or root folder" },
            ],
            isError: true,
          };
        }

        // Add the movie
        const shouldSearch = search_now !== false;

        const addedMovie = await client.addMovie({
          tmdbId: movieInfo.tmdbId,
          title: movieInfo.title,
          qualityProfileId: profileId,
          titleSlug: movieInfo.titleSlug,
          images: movieInfo.images,
          rootFolderPath: folderPath,
          monitored: true,
          minimumAvailability: "released",
          addOptions: {
            searchForMovie: shouldSearch,
          },
        });

        const searchMsg = shouldSearch ? "Search started." : "Added without searching.";

        return {
          content: [
            {
              type: "text",
              text:
                `Added "${addedMovie.title}" to Radarr${qualityLabel}:\n` +
                `- Movie ID: ${addedMovie.id}\n` +
                `- Folder: ${folderPath}\n` +
                `- Year: ${addedMovie.year}\n` +
                `${searchMsg}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // movie_list - List all movies
  server.tool(
    "movie_list",
    "List all movies in Radarr with flexible filtering, sorting, and display options",
    {
      // Filters
      status: z
        .enum(["released", "inCinemas", "announced", "all"])
        .optional()
        .describe("Filter by movie status. Default: all"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance to list from. Default: hd"),
      genre: z.string().optional().describe("Filter by genre (partial match, e.g., 'action')"),
      missing_only: z
        .coerce.boolean()
        .optional()
        .describe("Only show movies without downloaded files"),
      unmonitored_only: z
        .coerce.boolean()
        .optional()
        .describe("Only show unmonitored movies"),
      // Sorting
      sort: z
        .enum(["title", "size", "added", "year", "rating"])
        .optional()
        .describe("Sort by: title (A-Z), size (largest first), added (newest first), year (newest first), rating (highest first). Default: title"),
      limit: z.coerce.number().optional().describe("Limit number of results (e.g., top 10)"),
      // Display options
      show_size: z.coerce.boolean().optional().describe("Include disk size in output"),
      show_rating: z.coerce.boolean().optional().describe("Include rating in output"),
      show_runtime: z.coerce.boolean().optional().describe("Include runtime in output"),
      show_added: z.coerce.boolean().optional().describe("Include date added in output"),
    },
    async ({ status, quality, genre, missing_only, unmonitored_only, sort, limit, show_size, show_rating, show_runtime, show_added }) => {
      try {
        const client = getRadarrClient(quality, config);
        let movies = await client.getAllMovies();

        // Apply filters
        if (status && status !== "all") {
          movies = movies.filter((m) => m.status === status);
        }
        if (genre) {
          const genreLower = genre.toLowerCase();
          movies = movies.filter((m) => m.genres.some((g) => g.toLowerCase().includes(genreLower)));
        }
        if (missing_only) {
          movies = movies.filter((m) => !m.hasFile);
        }
        if (unmonitored_only) {
          movies = movies.filter((m) => !m.monitored);
        }

        if (movies.length === 0) {
          return {
            content: [{ type: "text", text: "No movies match the filters." }],
          };
        }

        // Apply sorting
        const sortBy = sort || "title";
        switch (sortBy) {
          case "size":
            movies.sort((a, b) => (b.sizeOnDisk || 0) - (a.sizeOnDisk || 0));
            break;
          case "added":
            movies.sort((a, b) => new Date(b.added).getTime() - new Date(a.added).getTime());
            break;
          case "year":
            movies.sort((a, b) => b.year - a.year);
            break;
          case "rating":
            movies.sort((a, b) => {
              const ratingA = a.ratings?.imdb?.value || a.ratings?.tmdb?.value || 0;
              const ratingB = b.ratings?.imdb?.value || b.ratings?.tmdb?.value || 0;
              return ratingB - ratingA;
            });
            break;
          default:
            movies.sort((a, b) => a.title.localeCompare(b.title));
        }

        // Apply limit
        const totalCount = movies.length;
        if (limit && limit > 0) {
          movies = movies.slice(0, limit);
        }

        // Format output
        const formatted = movies.map((m) => formatMovie(m, { show_size, show_rating, show_runtime, show_added })).join("\n");

        const limitNote = limit && totalCount > limit ? ` (showing ${limit} of ${totalCount})` : "";
        const qualityLabel = quality === "4k" ? " (4K)" : "";
        return {
          content: [
            {
              type: "text",
              text: `${movies.length} movies${qualityLabel}${limitNote}:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // movie_upgrade - Search for better quality
  server.tool(
    "movie_upgrade",
    "Trigger a search for a better quality version of an existing movie",
    {
      movie_id: z.coerce.number().describe("Radarr movie ID to search for upgrade"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
    },
    async ({ movie_id, quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const movie = await client.getMovie(movie_id);
        const command = await client.searchMovie([movie_id]);

        return {
          content: [
            {
              type: "text",
              text: `Started quality upgrade search for "${movie.title}". Command ID: ${command.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // movie_delete - Remove movie
  server.tool(
    "movie_delete",
    "Remove a movie from Radarr",
    {
      movie_id: z.coerce.number().describe("Radarr movie ID to delete"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
      delete_files: z.boolean().optional().describe("Also delete downloaded files. Default: false"),
    },
    async ({ movie_id, quality, delete_files }) => {
      try {
        const client = getRadarrClient(quality, config);
        const movie = await client.getMovie(movie_id);
        const shouldDeleteFiles = delete_files === true;

        await client.deleteMovie(movie_id, shouldDeleteFiles);

        const fileMsg = shouldDeleteFiles ? " and deleted files" : "";
        const qualityLabel = quality === "4k" ? " (4K)" : "";
        return {
          content: [
            {
              type: "text",
              text: `Removed "${movie.title}" from Radarr${qualityLabel}${fileMsg}.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // ============================================================
  // Service-Specific Tools (Admin/Troubleshooting)
  // ============================================================

  // radarr_queue - Show download queue
  server.tool(
    "radarr_queue",
    "Show Radarr download queue with progress, ETA, and errors",
    {
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
    },
    async ({ quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const queuePage = await client.getQueue();
        const items = queuePage.records;

        if (items.length === 0) {
          const qualityLabel = quality === "4k" ? " (4K)" : "";
          return {
            content: [{ type: "text", text: `Download queue is empty${qualityLabel}.` }],
          };
        }

        const formatted = items.map(formatQueueItem).join("\n");
        const issues = items.filter(
          (i) => i.trackedDownloadStatus === "warning" || i.trackedDownloadStatus === "error"
        );

        let output = `${items.length} items in queue:\n\n${formatted}`;
        if (issues.length > 0) {
          output += `\n\n${issues.length} items have issues.`;
        }

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // radarr_details - Detailed info for one movie
  server.tool(
    "radarr_details",
    "Get detailed information about a specific movie",
    {
      movie_id: z.coerce.number().describe("Radarr movie ID"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
    },
    async ({ movie_id, quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const movie = await client.getMovie(movie_id);

        const output = [
          `${movie.title} (${movie.year})`,
          `Status: ${movie.status}`,
          `Studio: ${movie.studio || "Unknown"}`,
          `Path: ${movie.path}`,
          `Monitored: ${movie.monitored ? "Yes" : "No"}`,
          `Has File: ${movie.hasFile ? "Yes" : "No"}`,
          "",
          "Statistics:",
          `  Runtime: ${movie.runtime} minutes`,
          `  Size: ${formatBytes(movie.sizeOnDisk)}`,
          "",
          `TMDB: ${movie.tmdbId}`,
          movie.imdbId ? `IMDB: ${movie.imdbId}` : "",
          "",
          movie.overview || "",
        ]
          .filter(Boolean)
          .join("\n");

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // radarr_profiles - List quality profiles
  server.tool(
    "radarr_profiles",
    "List available quality profiles in Radarr",
    {
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
    },
    async ({ quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const profiles = await client.getProfiles();
        const formatted = profiles.map((p) => `${p.name} (ID: ${p.id})`).join("\n");
        const qualityLabel = quality === "4k" ? " (4K)" : "";
        return {
          content: [
            {
              type: "text",
              text: `Quality profiles${qualityLabel}:\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // radarr_folders - List root folders
  server.tool(
    "radarr_folders",
    "List available root folders in Radarr",
    {
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
    },
    async ({ quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const folders = await client.getRootFolders();
        const formatted = folders
          .map((f) => `${f.path} (${formatBytes(f.freeSpace)} free)`)
          .join("\n");
        const qualityLabel = quality === "4k" ? " (4K)" : "";
        return {
          content: [
            {
              type: "text",
              text: `Root folders${qualityLabel}:\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // radarr_stuck - Get items stuck importing
  server.tool(
    "radarr_stuck",
    "Get items stuck in importing state or with errors",
    {
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
    },
    async ({ quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const stuckItems = await client.getStuckItems();

        if (stuckItems.length === 0) {
          const qualityLabel = quality === "4k" ? " (4K)" : "";
          return {
            content: [{ type: "text", text: `No stuck items found${qualityLabel}.` }],
          };
        }

        const formatted = stuckItems
          .map((item) => {
            const issues = item.statusMessages?.map((m) => m.title).join(", ") || "Unknown issue";
            return `${item.title}\n  Status: ${item.trackedDownloadState || item.status}\n  Issues: ${issues}\n  Queue ID: ${item.id}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `${stuckItems.length} stuck items:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // radarr_import - Trigger manual import (rescan)
  server.tool(
    "radarr_import",
    "Trigger a rescan to import pending downloads",
    {
      movie_id: z.coerce.number().optional().describe("Radarr movie ID to rescan (optional, rescans all if not specified)"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
    },
    async ({ movie_id, quality }) => {
      try {
        const client = getRadarrClient(quality, config);
        const command = await client.rescanMovie(movie_id);
        const target = movie_id ? `movie ${movie_id}` : "all movies";
        const qualityLabel = quality === "4k" ? " (4K)" : "";
        return {
          content: [
            {
              type: "text",
              text: `Started rescan for ${target}${qualityLabel}. Command ID: ${command.id}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // radarr_blacklist - Blacklist release and optionally re-search
  server.tool(
    "radarr_blacklist",
    "Blacklist a release from the queue and optionally search for a replacement",
    {
      queue_id: z.coerce.number().describe("Queue item ID to blacklist"),
      quality: z.enum(["hd", "4k"]).optional().describe("Which Radarr instance. Default: hd"),
      search_again: z
        .boolean()
        .optional()
        .describe("Search for a replacement after blacklisting. Default: true"),
    },
    async ({ queue_id, quality, search_again }) => {
      try {
        const client = getRadarrClient(quality, config);
        const shouldSearch = search_again !== false;
        await client.deleteQueueItem(queue_id, {
          removeFromClient: true,
          blocklist: true,
          skipRedownload: !shouldSearch,
        });

        const searchMsg = shouldSearch ? " Searching for replacement." : "";
        const qualityLabel = quality === "4k" ? " (4K)" : "";
        return {
          content: [
            {
              type: "text",
              text: `Blacklisted and removed queue item ${queue_id}${qualityLabel}.${searchMsg}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );
}
