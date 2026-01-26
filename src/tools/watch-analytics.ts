/**
 * Watch Analytics Tool
 *
 * Viewing statistics with period and type filters.
 * Shows movies watched, episodes watched, estimated watch time, and genre breakdown.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import type { ProviderRegistry } from "../providers/index.js";
import { PlexClient } from "../services/plex/client.js";
import { formatErrorResponse } from "../shared/errors.js";
// PlexMediaItem types used implicitly via PlexClient responses

// ============================================================================
// Types (T021)
// ============================================================================

interface WatchStats {
  period: {
    name: string;
    start: Date;
    end: Date;
  };
  movies: {
    watched: number;
    totalDurationMinutes: number;
  };
  episodes: {
    watched: number;
    totalDurationMinutes: number;
    uniqueShows: number;
  };
  totalWatchTimeMinutes: number;
  genreBreakdown: Map<string, number>;
  mostWatched: {
    movies: Array<{ title: string; year?: number; count: number }>;
    shows: Array<{ title: string; year?: number; episodeCount: number }>;
  };
}

// ============================================================================
// Aggregation Logic (T021)
// ============================================================================

function getPeriodDates(
  period: "month" | "year" | "all",
): { start: Date; end: Date; name: string } {
  const now = new Date();
  const end = now;
  let start: Date;
  let name: string;

  switch (period) {
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      name = `${start.toLocaleString("default", { month: "long" })} ${start.getFullYear()}`;
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      name = `${start.getFullYear()}`;
      break;
    case "all":
    default:
      start = new Date(0); // Beginning of time
      name = "All Time";
      break;
  }

  return { start, end, name };
}

async function aggregateWatchStats(
  plexClient: PlexClient,
  period: "month" | "year" | "all",
  type: "all" | "movies" | "shows",
): Promise<WatchStats> {
  const { start, end, name } = getPeriodDates(period);
  const startTimestamp = Math.floor(start.getTime() / 1000);

  const stats: WatchStats = {
    period: { name, start, end },
    movies: { watched: 0, totalDurationMinutes: 0 },
    episodes: { watched: 0, totalDurationMinutes: 0, uniqueShows: 0 },
    totalWatchTimeMinutes: 0,
    genreBreakdown: new Map(),
    mostWatched: { movies: [], shows: [] },
  };

  const libraries = await plexClient.getLibraries();

  // Track movie watch counts
  const movieWatchCounts = new Map<
    string,
    { title: string; year?: number; count: number }
  >();

  // Track show episode counts
  const showEpisodeCounts = new Map<
    string,
    { title: string; year?: number; count: number }
  >();

  // Process movie libraries
  if (type === "all" || type === "movies") {
    const movieLibraries = libraries.filter((l) => l.type === "movie");
    for (const lib of movieLibraries) {
      const { items } = await plexClient.getLibraryItems(lib.key, {
        size: 10000,
      });

      for (const item of items) {
        // Check if watched during period
        if (
          item.lastViewedAt &&
          item.lastViewedAt >= startTimestamp &&
          item.viewCount &&
          item.viewCount > 0
        ) {
          stats.movies.watched++;

          // Accumulate watch time
          const durationMinutes = (item.duration || 0) / (1000 * 60);
          stats.movies.totalDurationMinutes += durationMinutes;

          // Track genres
          if (item.Genre) {
            for (const genre of item.Genre) {
              const current = stats.genreBreakdown.get(genre.tag) || 0;
              stats.genreBreakdown.set(genre.tag, current + 1);
            }
          }

          // Track for most watched
          const key = `${item.title}:${item.year}`;
          const existing = movieWatchCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            movieWatchCounts.set(key, {
              title: item.title,
              year: item.year,
              count: 1,
            });
          }
        }
      }
    }
  }

  // Process show libraries
  if (type === "all" || type === "shows") {
    const showLibraries = libraries.filter((l) => l.type === "show");
    const uniqueShows = new Set<string>();

    for (const lib of showLibraries) {
      // Get shows first
      const { items: shows } = await plexClient.getLibraryItems(lib.key, {
        size: 10000,
      });

      for (const show of shows) {
        // For shows, we need to count watched episodes
        // Plex provides viewedLeafCount for this
        if (show.viewedLeafCount && show.viewedLeafCount > 0) {
          // Check if the show has been watched during the period
          // by checking its lastViewedAt
          if (
            period === "all" ||
            (show.lastViewedAt && show.lastViewedAt >= startTimestamp)
          ) {
            uniqueShows.add(show.ratingKey);

            // Estimate episodes watched based on viewedLeafCount
            // Note: For period filtering, this is an approximation
            // since Plex doesn't give per-episode timestamps in bulk
            const episodesWatched =
              period === "all" ? show.viewedLeafCount : 1; // Conservative estimate

            stats.episodes.watched += episodesWatched;

            // Estimate watch time (average episode ~45 min if not available)
            const avgEpisodeDuration = show.duration
              ? show.duration / (1000 * 60)
              : 45;
            stats.episodes.totalDurationMinutes +=
              episodesWatched * avgEpisodeDuration;

            // Track genres
            if (show.Genre) {
              for (const genre of show.Genre) {
                const current = stats.genreBreakdown.get(genre.tag) || 0;
                stats.genreBreakdown.set(genre.tag, current + episodesWatched);
              }
            }

            // Track for most watched shows
            const key = `${show.title}:${show.year}`;
            const existing = showEpisodeCounts.get(key);
            if (existing) {
              existing.count += episodesWatched;
            } else {
              showEpisodeCounts.set(key, {
                title: show.title,
                year: show.year,
                count: episodesWatched,
              });
            }
          }
        }
      }
    }

    stats.episodes.uniqueShows = uniqueShows.size;
  }

  // Calculate total watch time
  stats.totalWatchTimeMinutes =
    stats.movies.totalDurationMinutes + stats.episodes.totalDurationMinutes;

  // Sort and limit most watched
  stats.mostWatched.movies = Array.from(movieWatchCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  stats.mostWatched.shows = Array.from(showEpisodeCounts.values())
    .map((s) => ({
      title: s.title,
      year: s.year,
      episodeCount: s.count,
    }))
    .sort((a, b) => b.episodeCount - a.episodeCount)
    .slice(0, 10);

  return stats;
}

// ============================================================================
// Tool Registration (T022, T023)
// ============================================================================

export function registerWatchAnalyticsTool(
  server: McpServer,
  config: Config,
  _registry: ProviderRegistry,
): void {
  server.tool(
    "watch_analytics",
    "Get viewing statistics including movies watched, episodes watched, estimated watch time, " +
      "most-watched content, and genre breakdown.",
    {
      period: z
        .enum(["month", "year", "all"])
        .optional()
        .default("all")
        .describe('Time period: "month", "year", or "all"'),
      type: z
        .enum(["all", "movies", "shows"])
        .optional()
        .default("all")
        .describe('Content type: "all", "movies", or "shows"'),
    },
    async ({ period, type }) => {
      try {
        if (!config.plex) {
          return {
            content: [
              {
                type: "text",
                text: "Plex is required for watch analytics. Configure Plex in your settings.",
              },
            ],
            isError: true,
          };
        }

        const plexClient = new PlexClient(config.plex);
        const stats = await aggregateWatchStats(plexClient, period, type);

        // Format output
        let output = `# Watch Analytics\n\n`;
        output += `**Period**: ${stats.period.name} | **Type**: ${type}\n\n`;

        // Summary
        output += `## Summary\n\n`;

        const totalHours = Math.round(stats.totalWatchTimeMinutes / 60);
        const totalDays = (totalHours / 24).toFixed(1);

        output += `| Metric | Value |\n`;
        output += `|--------|-------|\n`;
        output += `| Movies Watched | ${stats.movies.watched} |\n`;
        output += `| Episodes Watched | ${stats.episodes.watched} |\n`;
        output += `| Unique Shows | ${stats.episodes.uniqueShows} |\n`;
        output += `| Total Watch Time | ~${totalHours} hours (${totalDays} days) |\n\n`;

        // Watch time breakdown
        if (type === "all") {
          const movieHours = Math.round(
            stats.movies.totalDurationMinutes / 60,
          );
          const episodeHours = Math.round(
            stats.episodes.totalDurationMinutes / 60,
          );
          output += `### Time Breakdown\n`;
          output += `- Movies: ~${movieHours} hours\n`;
          output += `- TV Shows: ~${episodeHours} hours\n\n`;
        }

        // Most watched movies
        if (stats.mostWatched.movies.length > 0) {
          output += `## Most Watched Movies\n\n`;
          output += `| # | Title | Year | Views |\n`;
          output += `|---|-------|------|-------|\n`;
          for (let i = 0; i < stats.mostWatched.movies.length; i++) {
            const movie = stats.mostWatched.movies[i];
            output += `| ${i + 1} | ${movie.title} | ${movie.year || "N/A"} | ${movie.count} |\n`;
          }
          output += "\n";
        }

        // Most watched shows
        if (stats.mostWatched.shows.length > 0) {
          output += `## Most Watched Shows\n\n`;
          output += `| # | Title | Year | Episodes |\n`;
          output += `|---|-------|------|----------|\n`;
          for (let i = 0; i < stats.mostWatched.shows.length; i++) {
            const show = stats.mostWatched.shows[i];
            output += `| ${i + 1} | ${show.title} | ${show.year || "N/A"} | ${show.episodeCount} |\n`;
          }
          output += "\n";
        }

        // Genre breakdown
        if (stats.genreBreakdown.size > 0) {
          output += `## Genre Breakdown\n\n`;
          output += `| Genre | Items Watched |\n`;
          output += `|-------|---------------|\n`;

          // Sort genres by count
          const sortedGenres = Array.from(stats.genreBreakdown.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);

          for (const [genre, count] of sortedGenres) {
            output += `| ${genre} | ${count} |\n`;
          }
          output += "\n";
        }

        // Note about accuracy
        output += `---\n\n`;
        output += `*Note: Watch time is estimated based on content duration. `;
        output += `Episode counts for period filtering are approximations.*\n`;

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
