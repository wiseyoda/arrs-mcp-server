import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../../config.js";
import { PlexClient } from "./client.js";
import { formatErrorResponse } from "../../shared/errors.js";

export function registerPlexTools(server: McpServer, config: Config): void {
  if (!config.plex) {
    console.error("Plex not configured, skipping tool registration");
    return;
  }

  const client = new PlexClient(config.plex);

  // ============================================================
  // Semantic Tools (User-Facing)
  // ============================================================

  // library_list - List all Plex libraries
  server.tool(
    "library_list",
    "List all Plex libraries (Movies, TV Shows, etc.)",
    async () => {
      try {
        const libraries = await client.getLibraries();

        if (libraries.length === 0) {
          return {
            content: [{ type: "text", text: "No libraries found in Plex." }],
          };
        }

        const formatted = libraries
          .map((lib) => `[${lib.key}] ${lib.title} (${lib.type})`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `${libraries.length} libraries:\n\n${formatted}`,
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

  // library_search - Search across libraries
  server.tool(
    "library_search",
    "Search for content across Plex libraries. Use this to answer 'Do I have...?' questions.",
    {
      query: z.string().describe("Search query (movie or show title)"),
      library: z
        .string()
        .optional()
        .describe("Filter to specific library name (e.g., 'Movies', 'TV Shows')"),
      limit: z.coerce
        .number()
        .optional()
        .default(20)
        .describe("Maximum results to return. Default: 20"),
    },
    async ({ query, library, limit }) => {
      try {
        // If library specified, search that library only
        if (library) {
          const lib = await client.getLibraryByName(library);
          if (!lib) {
            const libraries = await client.getLibraries();
            const available = libraries.map((l) => l.title).join(", ");
            return {
              content: [
                {
                  type: "text",
                  text: `Library "${library}" not found. Available: ${available}`,
                },
              ],
              isError: true,
            };
          }

          const items = await client.searchLibrary(lib.key, query);
          if (items.length === 0) {
            return {
              content: [
                { type: "text", text: `No results for "${query}" in ${lib.title}.` },
              ],
            };
          }

          const limited = items.slice(0, limit);
          const formatted = limited
            .map((item) => {
              const info = client.parseMediaItem(item, lib.title);
              const watchStatus = info.watched
                ? `Watched ${info.viewCount}x`
                : "Unwatched";
              const size = info.sizeBytes ? ` - ${client.formatSize(info.sizeBytes)}` : "";
              return `[${info.ratingKey}] ${info.title} (${info.year || "N/A"}) - ${watchStatus}${size}`;
            })
            .join("\n");

          const moreText =
            items.length > limit ? `\n\n... and ${items.length - limit} more` : "";

          return {
            content: [
              {
                type: "text",
                text: `Found ${items.length} results in ${lib.title}:\n\n${formatted}${moreText}`,
              },
            ],
          };
        }

        // Search all libraries
        const results = await client.searchAll(query);

        if (results.size === 0) {
          return {
            content: [{ type: "text", text: `No results for "${query}" in any library.` }],
          };
        }

        let totalCount = 0;
        const sections: string[] = [];

        for (const [hubTitle, items] of results) {
          totalCount += items.length;
          const limited = items.slice(0, Math.ceil(limit / results.size));
          const formatted = limited
            .map((item) => {
              const year = item.year ? ` (${item.year})` : "";
              const watchStatus =
                (item.viewCount || 0) > 0 ? `Watched ${item.viewCount}x` : "Unwatched";
              return `  [${item.ratingKey}] ${item.title}${year} - ${watchStatus}`;
            })
            .join("\n");

          sections.push(`${hubTitle}:\n${formatted}`);
        }

        return {
          content: [
            {
              type: "text",
              text: `Found ${totalCount} results:\n\n${sections.join("\n\n")}`,
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

  // library_watched - Get watch status for library items
  server.tool(
    "library_watched",
    "Get watch status for items in a Plex library",
    {
      library: z.string().describe("Library name (e.g., 'Movies', 'TV Shows')"),
      filter: z
        .enum(["all", "watched", "unwatched"])
        .optional()
        .default("all")
        .describe("Filter by watch status. Default: all"),
      limit: z.coerce
        .number()
        .optional()
        .default(50)
        .describe("Maximum results. Default: 50"),
    },
    async ({ library, filter, limit }) => {
      try {
        const lib = await client.getLibraryByName(library);
        if (!lib) {
          const libraries = await client.getLibraries();
          const available = libraries.map((l) => l.title).join(", ");
          return {
            content: [
              {
                type: "text",
                text: `Library "${library}" not found. Available: ${available}`,
              },
            ],
            isError: true,
          };
        }

        const { items, totalSize } = await client.getLibraryItems(lib.key, { size: 500 });

        let filtered = items;
        if (filter === "watched") {
          filtered = items.filter((item) => (item.viewCount || 0) > 0);
        } else if (filter === "unwatched") {
          filtered = items.filter((item) => !item.viewCount || item.viewCount === 0);
        }

        if (filtered.length === 0) {
          return {
            content: [
              { type: "text", text: `No ${filter} items in ${lib.title}.` },
            ],
          };
        }

        const limited = filtered.slice(0, limit);
        const formatted = limited
          .map((item) => {
            const info = client.parseMediaItem(item, lib.title);
            if (info.watched) {
              const lastViewed = info.lastViewedAt
                ? ` (last: ${client.formatDate(info.lastViewedAt)})`
                : "";
              return `[${info.ratingKey}] ${info.title} (${info.year || "N/A"}) - Watched ${info.viewCount}x${lastViewed}`;
            } else {
              return `[${info.ratingKey}] ${info.title} (${info.year || "N/A"}) - Unwatched`;
            }
          })
          .join("\n");

        const moreText =
          filtered.length > limit
            ? `\n\n... and ${filtered.length - limit} more (${totalSize} total in library)`
            : "";

        return {
          content: [
            {
              type: "text",
              text: `${filtered.length} ${filter} items in ${lib.title}:\n\n${formatted}${moreText}`,
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

  // library_list_movies - List movies with filtering, sorting, display options
  server.tool(
    "library_list_movies",
    "List movies in Plex with flexible filtering, sorting, and display options",
    {
      // Filters
      library: z
        .string()
        .optional()
        .describe("Filter to specific movie library (e.g., 'Movies', 'Movies (4K)')"),
      genre: z.string().optional().describe("Filter by genre (partial match, e.g., 'action')"),
      content_rating: z
        .string()
        .optional()
        .describe("Filter by content rating (e.g., 'PG-13', 'R')"),
      year: z.coerce.number().optional().describe("Filter by release year"),
      year_min: z.coerce.number().optional().describe("Filter by minimum release year"),
      year_max: z.coerce.number().optional().describe("Filter by maximum release year"),
      country: z.string().optional().describe("Filter by country (partial match)"),
      studio: z.string().optional().describe("Filter by studio (partial match)"),
      director: z.string().optional().describe("Filter by director name (partial match)"),
      actor: z.string().optional().describe("Filter by actor name (partial match)"),
      resolution: z
        .enum(["4k", "1080", "720", "sd"])
        .optional()
        .describe("Filter by video resolution"),
      watched_only: z.coerce.boolean().optional().describe("Only show watched movies"),
      unwatched_only: z.coerce.boolean().optional().describe("Only show unwatched movies"),
      watched_since_days: z.coerce
        .number()
        .optional()
        .describe("Only movies watched in the last N days"),
      // Sorting
      sort: z
        .enum(["title", "rating", "audience_rating", "year", "added", "watched", "size", "duration"])
        .optional()
        .describe(
          "Sort by: title (A-Z), rating (critics, highest first), audience_rating (highest first), year (newest first), added (newest first), watched (recently watched first), size (largest first), duration (longest first). Default: title"
        ),
      limit: z.coerce.number().optional().describe("Limit number of results (e.g., top 10)"),
      // Display options
      show_rating: z.coerce.boolean().optional().describe("Include critic rating (RT) in output"),
      show_audience_rating: z.coerce.boolean().optional().describe("Include audience rating in output"),
      show_genre: z.coerce.boolean().optional().describe("Include genres in output"),
      show_director: z.coerce.boolean().optional().describe("Include director in output"),
      show_runtime: z.coerce.boolean().optional().describe("Include runtime in output"),
      show_size: z.coerce.boolean().optional().describe("Include file size in output"),
      show_resolution: z.coerce.boolean().optional().describe("Include video resolution in output"),
      show_added: z.coerce.boolean().optional().describe("Include date added in output"),
    },
    async ({
      library,
      genre,
      content_rating,
      year,
      year_min,
      year_max,
      country,
      studio,
      director,
      actor,
      resolution,
      watched_only,
      unwatched_only,
      watched_since_days,
      sort,
      limit,
      show_rating,
      show_audience_rating,
      show_genre,
      show_director,
      show_runtime,
      show_size,
      show_resolution,
      show_added,
    }) => {
      try {
        // Get movie libraries
        const allLibraries = await client.getLibraries();
        const movieLibraries = library
          ? allLibraries.filter(
              (l) => l.type === "movie" && l.title.toLowerCase() === library.toLowerCase()
            )
          : allLibraries.filter((l) => l.type === "movie");

        if (movieLibraries.length === 0) {
          const available = allLibraries
            .filter((l) => l.type === "movie")
            .map((l) => l.title)
            .join(", ");
          return {
            content: [
              {
                type: "text",
                text: library
                  ? `Movie library "${library}" not found. Available: ${available}`
                  : "No movie libraries found.",
              },
            ],
            isError: true,
          };
        }

        // Collect all movies
        type ParsedMovie = ReturnType<typeof client.parseMediaItem>;
        let movies: ParsedMovie[] = [];

        for (const lib of movieLibraries) {
          const { items } = await client.getLibraryItems(lib.key, { size: 2000 });
          const parsed = items.map((item) => client.parseMediaItem(item, lib.title));
          movies = movies.concat(parsed);
        }

        // Apply filters
        if (genre) {
          const genreLower = genre.toLowerCase();
          movies = movies.filter((m) =>
            m.genres?.some((g) => g.toLowerCase().includes(genreLower))
          );
        }
        if (content_rating) {
          const ratingLower = content_rating.toLowerCase();
          movies = movies.filter((m) => m.contentRating?.toLowerCase() === ratingLower);
        }
        if (year) {
          movies = movies.filter((m) => m.year === year);
        }
        if (year_min) {
          movies = movies.filter((m) => m.year && m.year >= year_min);
        }
        if (year_max) {
          movies = movies.filter((m) => m.year && m.year <= year_max);
        }
        if (country) {
          const countryLower = country.toLowerCase();
          movies = movies.filter((m) =>
            m.countries?.some((c) => c.toLowerCase().includes(countryLower))
          );
        }
        if (studio) {
          const studioLower = studio.toLowerCase();
          movies = movies.filter((m) => m.studio?.toLowerCase().includes(studioLower));
        }
        if (director) {
          const directorLower = director.toLowerCase();
          movies = movies.filter((m) =>
            m.directors?.some((d) => d.toLowerCase().includes(directorLower))
          );
        }
        if (actor) {
          const actorLower = actor.toLowerCase();
          movies = movies.filter((m) =>
            m.actors?.some((a) => a.toLowerCase().includes(actorLower))
          );
        }
        if (resolution) {
          const resMap: Record<string, string[]> = {
            "4k": ["4k", "2160"],
            "1080": ["1080"],
            "720": ["720"],
            sd: ["480", "576", "sd"],
          };
          const validRes = resMap[resolution] || [];
          movies = movies.filter((m) =>
            validRes.some((r) => m.videoResolution?.toLowerCase().includes(r))
          );
        }
        if (watched_only) {
          movies = movies.filter((m) => m.watched);
        }
        if (unwatched_only) {
          movies = movies.filter((m) => !m.watched);
        }
        if (watched_since_days) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - watched_since_days);
          movies = movies.filter((m) => m.lastViewedAt && m.lastViewedAt >= cutoff);
        }

        if (movies.length === 0) {
          return {
            content: [{ type: "text", text: "No movies match the filters." }],
          };
        }

        // Apply sorting
        const sortBy = sort || "title";
        switch (sortBy) {
          case "rating":
            movies.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case "audience_rating":
            movies.sort((a, b) => (b.audienceRating || 0) - (a.audienceRating || 0));
            break;
          case "year":
            movies.sort((a, b) => (b.year || 0) - (a.year || 0));
            break;
          case "added":
            movies.sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
            break;
          case "watched":
            movies.sort(
              (a, b) => (b.lastViewedAt?.getTime() || 0) - (a.lastViewedAt?.getTime() || 0)
            );
            break;
          case "size":
            movies.sort((a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0));
            break;
          case "duration":
            movies.sort((a, b) => (b.duration || 0) - (a.duration || 0));
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
        const formatted = movies
          .map((m) => {
            const yearStr = m.year ? ` (${m.year})` : "";
            const watchStatus = m.watched
              ? `Watched${m.lastViewedAt ? ` ${client.formatDate(m.lastViewedAt)}` : ""}`
              : "Unwatched";

            const extras: string[] = [];
            if (show_rating && m.rating !== undefined) {
              extras.push(`Critics: ${client.formatRating(m.rating)}`);
            }
            if (show_audience_rating && m.audienceRating !== undefined) {
              extras.push(`Audience: ${client.formatRating(m.audienceRating)}`);
            }
            if (show_genre && m.genres && m.genres.length > 0) {
              extras.push(m.genres.slice(0, 3).join("/"));
            }
            if (show_director && m.directors && m.directors.length > 0) {
              extras.push(`Dir: ${m.directors[0]}`);
            }
            if (show_runtime && m.duration) {
              extras.push(client.formatDuration(m.duration));
            }
            if (show_size && m.sizeBytes) {
              extras.push(client.formatSize(m.sizeBytes));
            }
            if (show_resolution && m.videoResolution) {
              extras.push(m.videoResolution + "p");
            }
            if (show_added) {
              extras.push(`Added: ${client.formatDate(m.addedAt)}`);
            }

            const extrasStr = extras.length > 0 ? ` - ${extras.join(", ")}` : "";
            return `[${m.ratingKey}] ${m.title}${yearStr} - ${watchStatus}${extrasStr}`;
          })
          .join("\n");

        const limitNote =
          limit && totalCount > limit ? `\n\n... showing ${limit} of ${totalCount} movies` : "";

        return {
          content: [
            {
              type: "text",
              text: `${movies.length} movies${library ? ` in ${library}` : ""}:\n\n${formatted}${limitNote}`,
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
  // Admin Tools (Service-Specific)
  // ============================================================

  // plex_recent - Recently added content
  server.tool(
    "plex_recent",
    "Show recently added content in Plex",
    {
      library: z
        .string()
        .optional()
        .describe("Filter to specific library (optional)"),
      limit: z.coerce
        .number()
        .optional()
        .default(20)
        .describe("Number of items to show. Default: 20"),
    },
    async ({ library, limit }) => {
      try {
        if (library) {
          const lib = await client.getLibraryByName(library);
          if (!lib) {
            return {
              content: [{ type: "text", text: `Library "${library}" not found.` }],
              isError: true,
            };
          }

          const items = await client.getRecentlyAdded(lib.key, limit);
          if (items.length === 0) {
            return {
              content: [{ type: "text", text: `No recent items in ${lib.title}.` }],
            };
          }

          const formatted = items
            .map((item) => {
              const info = client.parseMediaItem(item, lib.title);
              return `[${info.ratingKey}] ${info.title} (${info.year || "N/A"}) - Added ${client.formatDate(info.addedAt)}`;
            })
            .join("\n");

          return {
            content: [
              {
                type: "text",
                text: `Recently added to ${lib.title}:\n\n${formatted}`,
              },
            ],
          };
        }

        // Get recent from all libraries
        const libraries = await client.getLibraries();
        const sections: string[] = [];

        for (const lib of libraries) {
          // Skip non-video libraries
          if (lib.type !== "movie" && lib.type !== "show") continue;

          const items = await client.getRecentlyAdded(
            lib.key,
            Math.ceil(limit / libraries.length)
          );
          if (items.length === 0) continue;

          const formatted = items
            .map((item) => {
              const info = client.parseMediaItem(item, lib.title);
              return `  [${info.ratingKey}] ${info.title} (${info.year || "N/A"}) - Added ${client.formatDate(info.addedAt)}`;
            })
            .join("\n");

          sections.push(`${lib.title}:\n${formatted}`);
        }

        if (sections.length === 0) {
          return {
            content: [{ type: "text", text: "No recent items found." }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Recently added:\n\n${sections.join("\n\n")}`,
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

  // plex_refresh - Trigger library scan
  server.tool(
    "plex_refresh",
    "Trigger a library scan in Plex",
    {
      library: z
        .string()
        .optional()
        .describe("Library to refresh (optional, refreshes all if not specified)"),
    },
    async ({ library }) => {
      try {
        if (library) {
          const lib = await client.getLibraryByName(library);
          if (!lib) {
            return {
              content: [{ type: "text", text: `Library "${library}" not found.` }],
              isError: true,
            };
          }

          await client.refreshLibrary(lib.key);
          return {
            content: [
              { type: "text", text: `Started library scan for "${lib.title}".` },
            ],
          };
        }

        await client.refreshAllLibraries();
        return {
          content: [{ type: "text", text: "Started scan for all libraries." }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // plex_unwatched - Find unwatched content (cleanup candidates)
  server.tool(
    "plex_unwatched",
    "Find unwatched content older than N days - potential cleanup candidates",
    {
      days: z.coerce
        .number()
        .optional()
        .default(365)
        .describe("Content added more than this many days ago. Default: 365"),
      library: z
        .string()
        .optional()
        .describe("Filter to specific library (optional)"),
      limit: z.coerce
        .number()
        .optional()
        .default(50)
        .describe("Maximum results. Default: 50"),
    },
    async ({ days, library, limit }) => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

        const libraries = library
          ? [await client.getLibraryByName(library)].filter(Boolean)
          : await client.getLibraries();

        if (libraries.length === 0) {
          return {
            content: [{ type: "text", text: `Library "${library}" not found.` }],
            isError: true,
          };
        }

        const candidates: Array<{ item: ReturnType<typeof client.parseMediaItem>; library: string }> = [];
        let totalSizeBytes = 0;

        for (const lib of libraries) {
          if (!lib || (lib.type !== "movie" && lib.type !== "show")) continue;

          const unwatched = await client.getUnwatchedItems(lib.key);
          for (const item of unwatched) {
            if (item.addedAt < cutoffTimestamp) {
              const info = client.parseMediaItem(item, lib.title);
              candidates.push({ item: info, library: lib.title });
              if (info.sizeBytes) {
                totalSizeBytes += info.sizeBytes;
              }
            }
          }
        }

        if (candidates.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No unwatched content older than ${days} days found.`,
              },
            ],
          };
        }

        // Sort by size (largest first) for cleanup prioritization
        candidates.sort((a, b) => (b.item.sizeBytes || 0) - (a.item.sizeBytes || 0));

        const limited = candidates.slice(0, limit);
        const formatted = limited
          .map(({ item }) => {
            const size = item.sizeBytes ? client.formatSize(item.sizeBytes) : "unknown size";
            return `[${item.ratingKey}] ${item.title} (${item.year || "N/A"}) - ${size} - Added ${client.formatDate(item.addedAt)}`;
          })
          .join("\n");

        const moreText =
          candidates.length > limit ? `\n\n... and ${candidates.length - limit} more` : "";

        return {
          content: [
            {
              type: "text",
              text:
                `${candidates.length} items unwatched for ${days}+ days:\n\n${formatted}${moreText}\n\n` +
                `Total: ${client.formatSize(totalSizeBytes)} potential savings`,
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

  // plex_watched_old - Find old watched content (cleanup candidates)
  server.tool(
    "plex_watched_old",
    "Find watched content you watched more than N days ago - potential cleanup candidates",
    {
      days: z.coerce
        .number()
        .optional()
        .default(180)
        .describe("Content last watched more than this many days ago. Default: 180"),
      library: z
        .string()
        .optional()
        .describe("Filter to specific library (optional)"),
      limit: z.coerce
        .number()
        .optional()
        .default(50)
        .describe("Maximum results. Default: 50"),
    },
    async ({ days, library, limit }) => {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

        const libraries = library
          ? [await client.getLibraryByName(library)].filter(Boolean)
          : await client.getLibraries();

        if (libraries.length === 0) {
          return {
            content: [{ type: "text", text: `Library "${library}" not found.` }],
            isError: true,
          };
        }

        const candidates: Array<{ item: ReturnType<typeof client.parseMediaItem>; library: string }> = [];
        let totalSizeBytes = 0;

        for (const lib of libraries) {
          if (!lib || (lib.type !== "movie" && lib.type !== "show")) continue;

          const { items } = await client.getLibraryItems(lib.key, { size: 1000 });
          for (const item of items) {
            if (
              item.viewCount &&
              item.viewCount > 0 &&
              item.lastViewedAt &&
              item.lastViewedAt < cutoffTimestamp
            ) {
              const info = client.parseMediaItem(item, lib.title);
              candidates.push({ item: info, library: lib.title });
              if (info.sizeBytes) {
                totalSizeBytes += info.sizeBytes;
              }
            }
          }
        }

        if (candidates.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No watched content older than ${days} days found.`,
              },
            ],
          };
        }

        // Sort by last viewed (oldest first)
        candidates.sort((a, b) => {
          const aTime = a.item.lastViewedAt?.getTime() || 0;
          const bTime = b.item.lastViewedAt?.getTime() || 0;
          return aTime - bTime;
        });

        const limited = candidates.slice(0, limit);
        const formatted = limited
          .map(({ item }) => {
            const size = item.sizeBytes ? client.formatSize(item.sizeBytes) : "unknown size";
            const lastViewed = item.lastViewedAt
              ? client.formatDate(item.lastViewedAt)
              : "unknown";
            return `[${item.ratingKey}] ${item.title} (${item.year || "N/A"}) - ${size} - Last watched ${lastViewed}`;
          })
          .join("\n");

        const moreText =
          candidates.length > limit ? `\n\n... and ${candidates.length - limit} more` : "";

        return {
          content: [
            {
              type: "text",
              text:
                `${candidates.length} items watched ${days}+ days ago:\n\n${formatted}${moreText}\n\n` +
                `Total: ${client.formatSize(totalSizeBytes)} potential savings`,
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

  // plex_delete - Delete content from Plex
  server.tool(
    "plex_delete",
    "Delete media from Plex. WARNING: This permanently deletes files!",
    {
      rating_key: z.string().describe("The ratingKey of the item to delete"),
      confirm: z
        .boolean()
        .optional()
        .describe("Must be true to confirm deletion. Required for safety."),
    },
    async ({ rating_key, confirm }) => {
      try {
        if (!confirm) {
          return {
            content: [
              {
                type: "text",
                text: "Delete requires confirmation. Use confirm: true to proceed.\n\nWARNING: This permanently deletes files from disk!",
              },
            ],
            isError: true,
          };
        }

        // Get item info first
        const item = await client.getItem(rating_key);
        if (!item) {
          return {
            content: [
              { type: "text", text: `Item with ratingKey "${rating_key}" not found.` },
            ],
            isError: true,
          };
        }

        // Get size before deleting
        let sizeBytes = 0;
        if (item.Media && item.Media.length > 0) {
          for (const media of item.Media) {
            if (media.Part) {
              for (const part of media.Part) {
                sizeBytes += part.size || 0;
              }
            }
          }
        }

        await client.deleteItem(rating_key);

        const sizeMsg = sizeBytes > 0 ? ` (${client.formatSize(sizeBytes)} freed)` : "";
        return {
          content: [
            {
              type: "text",
              text: `Deleted "${item.title}"${sizeMsg}.`,
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
