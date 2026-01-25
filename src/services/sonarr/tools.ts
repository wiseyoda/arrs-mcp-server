import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../../config.js";
import { SonarrClient } from "./client.js";
import { formatErrorResponse } from "../../shared/errors.js";
import type { SeriesLookup, Episode, QueueItem } from "./types.js";

function formatSeriesLookup(series: SeriesLookup): string {
  const year = series.year ? ` (${series.year})` : "";
  const network = series.network ? ` - ${series.network}` : "";
  const overview = series.overview
    ? `\n   ${series.overview.slice(0, 150)}${series.overview.length > 150 ? "..." : ""}`
    : "";
  return `${series.title}${year}${network} [TVDB: ${series.tvdbId}]${overview}`;
}

function formatEpisode(episode: Episode): string {
  const seasonEp = `S${String(episode.seasonNumber).padStart(2, "0")}E${String(episode.episodeNumber).padStart(2, "0")}`;
  const status = episode.hasFile
    ? "Downloaded"
    : episode.monitored
      ? "Missing"
      : "Unmonitored";
  const airDate = episode.airDate ? ` (${episode.airDate})` : "";
  return `${seasonEp} - ${episode.title}${airDate} [${status}]`;
}

function formatQueueItem(item: QueueItem): string {
  const progress =
    item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) : 0;
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
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function registerSonarrTools(server: McpServer, config: Config): void {
  if (!config.sonarr) {
    console.error("Sonarr not configured, skipping tool registration");
    return;
  }

  const client = new SonarrClient(config.sonarr);

  // ============================================================
  // Semantic Tools (User-Facing)
  // ============================================================

  // tv_search - Search for TV series by name
  server.tool(
    "tv_search",
    "Search for TV series by name to find TVDB IDs for adding",
    {
      query: z.string().describe("Series name to search for"),
    },
    async ({ query }) => {
      try {
        const results = await client.searchSeries(query);
        if (results.length === 0) {
          return {
            content: [
              { type: "text", text: `No series found matching "${query}"` },
            ],
          };
        }

        const formatted = results
          .slice(0, 10)
          .map(formatSeriesLookup)
          .join("\n\n");
        return {
          content: [
            {
              type: "text",
              text: `Found ${results.length} results:\n\n${formatted}${results.length > 10 ? `\n\n... and ${results.length - 10} more` : ""}`,
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

  // tv_add - Add a TV series to Sonarr
  server.tool(
    "tv_add",
    "Add a TV series to Sonarr. Use tv_search first to find the TVDB ID.",
    {
      tvdb_id: z.coerce.number().describe("TVDB ID of the series to add"),
      monitor: z
        .enum(["all", "future", "missing", "none"])
        .optional()
        .describe(
          "Which episodes to monitor. Default: all. 'future' monitors only upcoming, 'missing' monitors unaired + missing, 'none' adds without monitoring",
        ),
      quality_profile: z
        .string()
        .optional()
        .describe(
          "Quality profile name (optional, uses first available if not specified)",
        ),
      root_folder: z
        .string()
        .optional()
        .describe(
          "Root folder path (optional, uses first available if not specified)",
        ),
      search_now: z
        .boolean()
        .optional()
        .describe("Start searching for episodes immediately. Default: true"),
    },
    async ({ tvdb_id, monitor, quality_profile, root_folder, search_now }) => {
      try {
        // Check if series already exists
        const existing = await client.seriesExists(tvdb_id);
        if (existing) {
          return {
            content: [
              {
                type: "text",
                text: `"${existing.title}" is already in your library.`,
              },
            ],
          };
        }

        // Look up series details
        const lookupResults = await client.searchSeries(`tvdb:${tvdb_id}`);
        const seriesInfo = lookupResults.find((s) => s.tvdbId === tvdb_id);
        if (!seriesInfo) {
          return {
            content: [
              {
                type: "text",
                text: `Could not find series with TVDB ID ${tvdb_id}`,
              },
            ],
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
            (p) => p.name.toLowerCase() === quality_profile.toLowerCase(),
          );
          if (found) {
            profileId = found.id;
          }
        }

        // Find or use default folder
        let folderPath = folders[0]?.path;
        if (root_folder) {
          const found = folders.find((f) =>
            f.path.toLowerCase().includes(root_folder.toLowerCase()),
          );
          if (found) {
            folderPath = found.path;
          }
        }

        if (!profileId || !folderPath) {
          return {
            content: [
              {
                type: "text",
                text: "Could not determine quality profile or root folder",
              },
            ],
            isError: true,
          };
        }

        // Add the series
        const monitorOption = monitor || "all";
        const shouldSearch = search_now !== false;

        const addedSeries = await client.addSeries({
          tvdbId: seriesInfo.tvdbId,
          title: seriesInfo.title,
          qualityProfileId: profileId,
          titleSlug: seriesInfo.titleSlug,
          images: seriesInfo.images,
          seasons: seriesInfo.seasons.map((s) => ({
            ...s,
            monitored: monitorOption !== "none",
          })),
          rootFolderPath: folderPath,
          monitored: monitorOption !== "none",
          seasonFolder: true,
          addOptions: {
            monitor: monitorOption,
            searchForMissingEpisodes: shouldSearch,
          },
        });

        const stats = addedSeries.statistics;
        const episodeCount = stats?.totalEpisodeCount || "unknown number of";
        const searchMsg = shouldSearch
          ? "Search started for missing episodes."
          : "Added without searching.";

        return {
          content: [
            {
              type: "text",
              text:
                `Added "${addedSeries.title}" to Sonarr:\n` +
                `- Series ID: ${addedSeries.id}\n` +
                `- Folder: ${folderPath}\n` +
                `- Monitoring: ${monitorOption}\n` +
                `- Episodes: ${episodeCount}\n` +
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
    },
  );

  // tv_list - List all TV series
  server.tool(
    "tv_list",
    "List all TV series in Sonarr with flexible filtering, sorting, and display options",
    {
      // Filters
      status: z
        .enum(["continuing", "ended", "all"])
        .optional()
        .describe("Filter by series status. Default: all"),
      network: z
        .string()
        .optional()
        .describe("Filter by network name (partial match, e.g., 'HBO')"),
      genre: z
        .string()
        .optional()
        .describe("Filter by genre (partial match, e.g., 'comedy')"),
      missing_only: z.coerce
        .boolean()
        .optional()
        .describe("Only show series with missing episodes"),
      unmonitored_only: z.coerce
        .boolean()
        .optional()
        .describe("Only show unmonitored series"),
      // Sorting
      sort: z
        .enum(["title", "size", "added", "percent"])
        .optional()
        .describe(
          "Sort by: title (A-Z), size (largest first), added (newest first), percent (most incomplete first). Default: title",
        ),
      // Pagination
      limit: z.coerce
        .number()
        .optional()
        .default(100)
        .describe("Maximum results to return. Default: 100"),
      offset: z.coerce
        .number()
        .optional()
        .default(0)
        .describe("Skip this many results for pagination. Default: 0"),
      summary: z.coerce
        .boolean()
        .optional()
        .describe("Only return counts without listing items"),
      // Display options
      show_size: z.coerce
        .boolean()
        .optional()
        .describe("Include disk size in output"),
      show_network: z.coerce
        .boolean()
        .optional()
        .describe("Include network in output"),
      show_runtime: z.coerce
        .boolean()
        .optional()
        .describe("Include episode runtime in output"),
      show_added: z.coerce
        .boolean()
        .optional()
        .describe("Include date added in output"),
    },
    async ({
      status,
      network,
      genre,
      missing_only,
      unmonitored_only,
      sort,
      limit,
      offset,
      summary,
      show_size,
      show_network,
      show_runtime,
      show_added,
    }) => {
      try {
        let series = await client.getAllSeries();

        // Apply filters
        if (status && status !== "all") {
          series = series.filter((s) => s.status === status);
        }
        if (network) {
          const networkLower = network.toLowerCase();
          series = series.filter((s) =>
            s.network?.toLowerCase().includes(networkLower),
          );
        }
        if (genre) {
          const genreLower = genre.toLowerCase();
          series = series.filter((s) =>
            s.genres.some((g) => g.toLowerCase().includes(genreLower)),
          );
        }
        if (missing_only) {
          series = series.filter((s) => {
            const stats = s.statistics;
            return stats && stats.episodeFileCount < stats.episodeCount;
          });
        }
        if (unmonitored_only) {
          series = series.filter((s) => !s.monitored);
        }

        if (series.length === 0) {
          return {
            content: [
              { type: "text", text: "No TV series match the filters." },
            ],
          };
        }

        // Apply sorting
        const sortBy = sort || "title";
        switch (sortBy) {
          case "size":
            series.sort(
              (a, b) =>
                (b.statistics?.sizeOnDisk || 0) -
                (a.statistics?.sizeOnDisk || 0),
            );
            break;
          case "added":
            series.sort(
              (a, b) =>
                new Date(b.added).getTime() - new Date(a.added).getTime(),
            );
            break;
          case "percent":
            series.sort((a, b) => {
              const pctA = a.statistics?.percentOfEpisodes || 100;
              const pctB = b.statistics?.percentOfEpisodes || 100;
              return pctA - pctB; // lowest percent first (most incomplete)
            });
            break;
          default:
            series.sort((a, b) => a.title.localeCompare(b.title));
        }

        const totalCount = series.length;

        // Summary mode: return counts only
        if (summary) {
          const totalSize = series.reduce(
            (sum, s) => sum + (s.statistics?.sizeOnDisk || 0),
            0,
          );
          const continuing = series.filter(
            (s) => s.status === "continuing",
          ).length;
          const ended = series.filter((s) => s.status === "ended").length;
          return {
            content: [
              {
                type: "text",
                text:
                  `TV Series Summary:\n` +
                  `  Total: ${totalCount}\n` +
                  `  Continuing: ${continuing}\n` +
                  `  Ended: ${ended}\n` +
                  `  Total Size: ${formatBytes(totalSize)}`,
              },
            ],
          };
        }

        // Apply pagination (offset + limit)
        const effectiveOffset = offset || 0;
        const effectiveLimit = limit || 100;
        series = series.slice(
          effectiveOffset,
          effectiveOffset + effectiveLimit,
        );

        // Warn if results exceed 500
        const warnLargeResult =
          totalCount > 500 && effectiveLimit >= totalCount;

        // Format output with optional fields
        // IMPORTANT: Always include series ID - users need it for sonarr_details, sonarr_delete, etc.
        // See .specify/memory/coding-standards.md "Entity IDs in Output" section.
        const formatted = series
          .map((s) => {
            const stats = s.statistics;
            const episodeInfo = stats
              ? `${stats.episodeFileCount}/${stats.episodeCount} episodes`
              : "unknown episodes";
            const statusText =
              s.status === "continuing" ? "Continuing" : "Ended";
            const monitored = s.monitored ? "Monitored" : "Not monitored";

            let line = `[${s.id}] ${s.title} (${s.year}) - ${statusText}, ${episodeInfo}, ${monitored}`;

            // Optional fields
            const extras: string[] = [];
            if (show_size && stats) {
              extras.push(formatBytes(stats.sizeOnDisk));
            }
            if (show_network && s.network) {
              extras.push(s.network);
            }
            if (show_runtime && s.runtime) {
              extras.push(`${s.runtime}min`);
            }
            if (show_added && s.added) {
              extras.push(`Added: ${s.added.split("T")[0]}`);
            }

            if (extras.length > 0) {
              line += ` [${extras.join(", ")}]`;
            }

            return line;
          })
          .join("\n");

        let paginationNote = "";
        if (effectiveOffset > 0 || series.length < totalCount) {
          paginationNote = ` (showing ${effectiveOffset + 1}-${effectiveOffset + series.length} of ${totalCount})`;
        }
        const warningNote = warnLargeResult
          ? "\n\nNote: Large result set. Consider using limit/offset for pagination."
          : "";
        return {
          content: [
            {
              type: "text",
              text: `${series.length} TV series${paginationNote}:\n\n${formatted}${warningNote}`,
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

  // tv_episodes - Get episode status for a series
  server.tool(
    "tv_episodes",
    "Get episode status for a specific TV series",
    {
      series_id: z.coerce.number().describe("Sonarr series ID"),
      season: z.coerce
        .number()
        .optional()
        .describe("Filter to a specific season (optional)"),
    },
    async ({ series_id, season }) => {
      try {
        const [series, episodes] = await Promise.all([
          client.getSeries(series_id),
          client.getEpisodes(series_id),
        ]);

        let filteredEpisodes = episodes;
        if (season !== undefined) {
          filteredEpisodes = episodes.filter((e) => e.seasonNumber === season);
        }

        // Group by season
        const bySeason = new Map<number, Episode[]>();
        for (const ep of filteredEpisodes) {
          const existing = bySeason.get(ep.seasonNumber) || [];
          existing.push(ep);
          bySeason.set(ep.seasonNumber, existing);
        }

        const downloaded = filteredEpisodes.filter((e) => e.hasFile).length;
        const missing = filteredEpisodes.filter(
          (e) => !e.hasFile && e.monitored,
        ).length;

        let output = `${series.title}\n`;
        output += `Episodes: ${downloaded} downloaded, ${missing} missing\n\n`;

        for (const [seasonNum, seasonEps] of Array.from(
          bySeason.entries(),
        ).sort(([a], [b]) => a - b)) {
          output += `Season ${seasonNum}:\n`;
          for (const ep of seasonEps.sort(
            (a, b) => a.episodeNumber - b.episodeNumber,
          )) {
            output += `  ${formatEpisode(ep)}\n`;
          }
          output += "\n";
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

  // tv_search_missing - Trigger search for missing episodes
  server.tool(
    "tv_search_missing",
    "Trigger a search for missing episodes",
    {
      series_id: z
        .number()
        .optional()
        .describe("Sonarr series ID (optional, searches all if not specified)"),
    },
    async ({ series_id }) => {
      try {
        const command = await client.searchMissingEpisodes(series_id);
        const target = series_id ? `series ${series_id}` : "all series";
        return {
          content: [
            {
              type: "text",
              text: `Started missing episode search for ${target}. Command ID: ${command.id}`,
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
  // Service-Specific Tools (Admin/Troubleshooting)
  // ============================================================

  // sonarr_queue - Show download queue
  server.tool(
    "sonarr_queue",
    "Show Sonarr download queue with progress, ETA, and errors",
    async () => {
      try {
        const queuePage = await client.getQueue();
        const items = queuePage.records;

        if (items.length === 0) {
          return {
            content: [{ type: "text", text: "Download queue is empty." }],
          };
        }

        const formatted = items.map(formatQueueItem).join("\n");
        const issues = items.filter(
          (i) =>
            i.trackedDownloadStatus === "warning" ||
            i.trackedDownloadStatus === "error",
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
    },
  );

  // sonarr_details - Detailed info for one series
  server.tool(
    "sonarr_details",
    "Get detailed information about a specific TV series",
    {
      series_id: z.coerce.number().describe("Sonarr series ID"),
    },
    async ({ series_id }) => {
      try {
        const series = await client.getSeries(series_id);
        const stats = series.statistics;

        const output = [
          `${series.title} (${series.year})`,
          `Status: ${series.status}`,
          `Network: ${series.network || "Unknown"}`,
          `Path: ${series.path}`,
          `Monitored: ${series.monitored ? "Yes" : "No"}`,
          "",
          "Statistics:",
          `  Seasons: ${stats?.seasonCount || 0}`,
          `  Episodes: ${stats?.episodeFileCount || 0}/${stats?.episodeCount || 0}`,
          `  Size: ${formatBytes(stats?.sizeOnDisk || 0)}`,
          "",
          `TVDB: ${series.tvdbId}`,
          series.imdbId ? `IMDB: ${series.imdbId}` : "",
          "",
          series.overview || "",
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
    },
  );

  // sonarr_delete - Remove series
  server.tool(
    "sonarr_delete",
    "Remove a TV series from Sonarr",
    {
      series_id: z.coerce.number().describe("Sonarr series ID to delete"),
      delete_files: z
        .boolean()
        .optional()
        .describe("Also delete downloaded files. Default: false"),
    },
    async ({ series_id, delete_files }) => {
      try {
        // Get series info first for confirmation message
        const series = await client.getSeries(series_id);
        const shouldDeleteFiles = delete_files === true;

        await client.deleteSeries(series_id, shouldDeleteFiles);

        const fileMsg = shouldDeleteFiles ? " and deleted files" : "";
        return {
          content: [
            {
              type: "text",
              text: `Removed "${series.title}" from Sonarr${fileMsg}.`,
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

  // sonarr_profiles - List quality profiles
  server.tool(
    "sonarr_profiles",
    "List available quality profiles in Sonarr",
    async () => {
      try {
        const profiles = await client.getProfiles();
        const formatted = profiles
          .map((p) => `${p.name} (ID: ${p.id})`)
          .join("\n");
        return {
          content: [
            {
              type: "text",
              text: `Quality profiles:\n${formatted}`,
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

  // sonarr_folders - List root folders
  server.tool(
    "sonarr_folders",
    "List available root folders in Sonarr",
    async () => {
      try {
        const folders = await client.getRootFolders();
        const formatted = folders
          .map((f) => `${f.path} (${formatBytes(f.freeSpace)} free)`)
          .join("\n");
        return {
          content: [
            {
              type: "text",
              text: `Root folders:\n${formatted}`,
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

  // sonarr_stuck - Get items stuck importing
  server.tool(
    "sonarr_stuck",
    "Get items stuck in importing state or with errors",
    async () => {
      try {
        const stuckItems = await client.getStuckItems();

        if (stuckItems.length === 0) {
          return {
            content: [{ type: "text", text: "No stuck items found." }],
          };
        }

        const formatted = stuckItems
          .map((item) => {
            const issues =
              item.statusMessages?.map((m) => m.title).join(", ") ||
              "Unknown issue";
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
    },
  );

  // sonarr_import - Trigger manual import (rescan)
  server.tool(
    "sonarr_import",
    "Trigger a rescan to import pending downloads",
    {
      series_id: z
        .number()
        .optional()
        .describe(
          "Sonarr series ID to rescan (optional, rescans all if not specified)",
        ),
    },
    async ({ series_id }) => {
      try {
        const command = await client.rescanSeries(series_id);
        const target = series_id ? `series ${series_id}` : "all series";
        return {
          content: [
            {
              type: "text",
              text: `Started rescan for ${target}. Command ID: ${command.id}`,
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

  // sonarr_blacklist - Blacklist release and optionally re-search
  server.tool(
    "sonarr_blacklist",
    "Blacklist a release from the queue and optionally search for a replacement",
    {
      queue_id: z.coerce.number().describe("Queue item ID to blacklist"),
      search_again: z
        .boolean()
        .optional()
        .describe("Search for a replacement after blacklisting. Default: true"),
    },
    async ({ queue_id, search_again }) => {
      try {
        const shouldSearch = search_again !== false;
        await client.deleteQueueItem(queue_id, {
          removeFromClient: true,
          blocklist: true,
          skipRedownload: !shouldSearch,
        });

        const searchMsg = shouldSearch ? " Searching for replacement." : "";
        return {
          content: [
            {
              type: "text",
              text: `Blacklisted and removed queue item ${queue_id}.${searchMsg}`,
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

  // sonarr_calendar - Upcoming episodes
  server.tool(
    "sonarr_calendar",
    "Show upcoming episodes in the next N days",
    {
      days: z.coerce
        .number()
        .optional()
        .describe("Number of days to look ahead. Default: 7"),
    },
    async ({ days }) => {
      try {
        const numDays = days || 7;
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + numDays);

        const episodes = await client.getCalendar(start, end);

        if (episodes.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No upcoming episodes in the next ${numDays} days.`,
              },
            ],
          };
        }

        // Group by date
        const byDate = new Map<string, Episode[]>();
        for (const ep of episodes) {
          const date = ep.airDate || "Unknown";
          const existing = byDate.get(date) || [];
          existing.push(ep);
          byDate.set(date, existing);
        }

        let output = `Upcoming episodes (next ${numDays} days):\n`;
        for (const [date, dateEps] of Array.from(byDate.entries()).sort()) {
          output += `\n${date}:\n`;
          for (const ep of dateEps) {
            const seasonEp = `S${String(ep.seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")}`;
            output += `  ${seasonEp} - ${ep.title}\n`;
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

  // ============================================================
  // Extended Tools (Phase 0050)
  // ============================================================

  // sonarr_rename - Rename episode files
  server.tool(
    "sonarr_rename",
    "Rename all episode files for a series using Sonarr's naming rules",
    {
      series_id: z.coerce.number().describe("Sonarr series ID"),
    },
    async ({ series_id }) => {
      try {
        const series = await client.getSeries(series_id);
        const command = await client.renameSeries(series_id);
        return {
          content: [
            {
              type: "text",
              text: `Started rename operation for "${series.title}". Command ID: ${command.id}\nFiles will be renamed according to Sonarr's naming format.`,
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

  // sonarr_refresh - Refresh series metadata
  server.tool(
    "sonarr_refresh",
    "Refresh series metadata from TVDB (updates episode info, images, etc.)",
    {
      series_id: z.coerce.number().describe("Sonarr series ID"),
    },
    async ({ series_id }) => {
      try {
        const series = await client.getSeries(series_id);
        const command = await client.refreshSeries(series_id);
        return {
          content: [
            {
              type: "text",
              text: `Started metadata refresh for "${series.title}". Command ID: ${command.id}\nEpisode information and images will be updated from TVDB.`,
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

  // sonarr_upcoming - Detailed upcoming episodes view
  server.tool(
    "sonarr_upcoming",
    "Get detailed upcoming episodes for the next N days",
    {
      days: z.coerce
        .number()
        .optional()
        .describe("Number of days to look ahead. Default: 7"),
    },
    async ({ days }) => {
      try {
        const numDays = days || 7;
        const episodes = await client.getUpcoming(numDays);

        if (episodes.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No upcoming episodes in the next ${numDays} days.`,
              },
            ],
          };
        }

        // Get series info for each episode to include more details
        const seriesMap = new Map<number, string>();
        for (const ep of episodes) {
          if (!seriesMap.has(ep.seriesId)) {
            try {
              const series = await client.getSeries(ep.seriesId);
              seriesMap.set(ep.seriesId, series.title);
            } catch {
              seriesMap.set(ep.seriesId, `Series ${ep.seriesId}`);
            }
          }
        }

        // Group by date
        const byDate = new Map<string, Episode[]>();
        for (const ep of episodes) {
          const date = ep.airDate || "Unknown";
          const existing = byDate.get(date) || [];
          existing.push(ep);
          byDate.set(date, existing);
        }

        let output = `Upcoming episodes (next ${numDays} days):\n`;
        for (const [date, dateEps] of Array.from(byDate.entries()).sort()) {
          output += `\n${date}:\n`;
          for (const ep of dateEps) {
            const seriesTitle =
              seriesMap.get(ep.seriesId) || `Series ${ep.seriesId}`;
            const seasonEp = `S${String(ep.seasonNumber).padStart(2, "0")}E${String(ep.episodeNumber).padStart(2, "0")}`;
            const status = ep.hasFile
              ? "[Downloaded]"
              : ep.monitored
                ? "[Monitored]"
                : "[Unmonitored]";
            output += `  ${seriesTitle} - ${seasonEp} - ${ep.title} ${status}\n`;
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
