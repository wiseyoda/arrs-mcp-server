/**
 * Cleanup Analysis Tool
 *
 * Cross-service tool that aggregates cleanup opportunities from Plex, Sonarr, Radarr, and Sabnzbd.
 * Provides a comprehensive report with potential space savings.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import { PlexClient } from "../services/plex/client.js";
import { SonarrClient } from "../services/sonarr/client.js";
import { RadarrClient } from "../services/radarr/client.js";
import { SabnzbdClient } from "../services/sabnzbd/client.js";
import { formatErrorResponse } from "../shared/errors.js";

interface CleanupCategory {
  name: string;
  count: number;
  sizeBytes: number;
  items: Array<{
    title: string;
    size: string;
    details?: string;
  }>;
}

interface ServiceStatus {
  name: string;
  available: boolean;
  error?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function registerCleanupAnalysisTool(
  server: McpServer,
  config: Config,
): void {
  server.tool(
    "cleanup_analysis",
    "Analyze cleanup opportunities across all services. Returns unwatched movies, old watched content, ended series, duplicates, and failed downloads with potential space savings.",
    {
      unwatched_days: z.coerce
        .number()
        .optional()
        .default(365)
        .describe(
          "Consider content unwatched for this many days. Default: 365",
        ),
      watched_days: z.coerce
        .number()
        .optional()
        .default(180)
        .describe(
          "Consider watched content older than this many days. Default: 180",
        ),
      limit_per_category: z.coerce
        .number()
        .optional()
        .default(10)
        .describe("Maximum items to show per category. Default: 10"),
    },
    async ({ unwatched_days, watched_days, limit_per_category }) => {
      try {
        const categories: CleanupCategory[] = [];
        const serviceStatus: ServiceStatus[] = [];
        let totalSizeBytes = 0;

        // Check Plex for unwatched and old watched content
        if (config.plex) {
          try {
            const plexClient = new PlexClient(config.plex);
            serviceStatus.push({ name: "Plex", available: true });

            // Get libraries
            const libraries = await plexClient.getLibraries();
            const movieLibraries = libraries.filter((l) => l.type === "movie");

            // Unwatched movies
            const unwatchedItems: CleanupCategory["items"] = [];
            let unwatchedSizeBytes = 0;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - unwatched_days);
            const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

            for (const lib of movieLibraries) {
              const unwatched = await plexClient.getUnwatchedItems(lib.key);
              for (const item of unwatched) {
                if (item.addedAt < cutoffTimestamp) {
                  const info = plexClient.parseMediaItem(item, lib.title);
                  const sizeBytes = info.sizeBytes || 0;
                  unwatchedSizeBytes += sizeBytes;
                  unwatchedItems.push({
                    title: `${info.title} (${info.year || "N/A"})`,
                    size: formatSize(sizeBytes),
                    details: `Added ${plexClient.formatDate(info.addedAt)}`,
                  });
                }
              }
            }

            // Sort by size descending
            unwatchedItems.sort((a, b) => {
              const aSize = parseFloat(a.size) || 0;
              const bSize = parseFloat(b.size) || 0;
              return bSize - aSize;
            });

            if (unwatchedItems.length > 0) {
              categories.push({
                name: `Unwatched Movies (${unwatched_days}+ days)`,
                count: unwatchedItems.length,
                sizeBytes: unwatchedSizeBytes,
                items: unwatchedItems.slice(0, limit_per_category),
              });
              totalSizeBytes += unwatchedSizeBytes;
            }

            // Old watched movies
            const watchedItems: CleanupCategory["items"] = [];
            let watchedSizeBytes = 0;
            const watchedCutoff = new Date();
            watchedCutoff.setDate(watchedCutoff.getDate() - watched_days);
            const watchedCutoffTimestamp = Math.floor(
              watchedCutoff.getTime() / 1000,
            );

            for (const lib of movieLibraries) {
              const { items } = await plexClient.getLibraryItems(lib.key, {
                size: 1000,
              });
              for (const item of items) {
                if (
                  item.viewCount &&
                  item.viewCount > 0 &&
                  item.lastViewedAt &&
                  item.lastViewedAt < watchedCutoffTimestamp
                ) {
                  const info = plexClient.parseMediaItem(item, lib.title);
                  const sizeBytes = info.sizeBytes || 0;
                  watchedSizeBytes += sizeBytes;
                  watchedItems.push({
                    title: `${info.title} (${info.year || "N/A"})`,
                    size: formatSize(sizeBytes),
                    details: info.lastViewedAt
                      ? `Last watched ${plexClient.formatDate(info.lastViewedAt)}`
                      : undefined,
                  });
                }
              }
            }

            watchedItems.sort((a, b) => {
              const aSize = parseFloat(a.size) || 0;
              const bSize = parseFloat(b.size) || 0;
              return bSize - aSize;
            });

            if (watchedItems.length > 0) {
              categories.push({
                name: `Old Watched Movies (${watched_days}+ days ago)`,
                count: watchedItems.length,
                sizeBytes: watchedSizeBytes,
                items: watchedItems.slice(0, limit_per_category),
              });
              totalSizeBytes += watchedSizeBytes;
            }

            // Duplicates
            const duplicates = await plexClient.getDuplicates();
            if (duplicates.length > 0) {
              const dupItems: CleanupCategory["items"] = [];
              let dupSizeBytes = 0;

              for (const dup of duplicates) {
                // Count extra copies (total - 1) as wasted space
                const wastedBytes = dup.items
                  .slice(1)
                  .reduce((sum, i) => sum + i.sizeBytes, 0);
                dupSizeBytes += wastedBytes;
                dupItems.push({
                  title: `${dup.title} (${dup.year || "N/A"})`,
                  size: formatSize(wastedBytes),
                  details: `${dup.duplicateCount} copies`,
                });
              }

              dupItems.sort((a, b) => {
                const aSize = parseFloat(a.size) || 0;
                const bSize = parseFloat(b.size) || 0;
                return bSize - aSize;
              });

              categories.push({
                name: "Duplicate Movies",
                count: duplicates.length,
                sizeBytes: dupSizeBytes,
                items: dupItems.slice(0, limit_per_category),
              });
              totalSizeBytes += dupSizeBytes;
            }
          } catch (error) {
            serviceStatus.push({
              name: "Plex",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Check Sonarr for ended series
        if (config.sonarr) {
          try {
            const sonarrClient = new SonarrClient(config.sonarr);
            serviceStatus.push({ name: "Sonarr", available: true });

            const allSeries = await sonarrClient.getAllSeries();
            const endedSeries = allSeries.filter(
              (s) => s.status === "ended" && s.statistics?.sizeOnDisk > 0,
            );

            if (endedSeries.length > 0) {
              const endedItems: CleanupCategory["items"] = [];
              let endedSizeBytes = 0;

              for (const series of endedSeries) {
                const sizeBytes = series.statistics?.sizeOnDisk || 0;
                endedSizeBytes += sizeBytes;
                endedItems.push({
                  title: series.title,
                  size: formatSize(sizeBytes),
                  details: `${series.statistics?.episodeFileCount || 0} episodes`,
                });
              }

              endedItems.sort((a, b) => {
                const aSize = parseFloat(a.size) || 0;
                const bSize = parseFloat(b.size) || 0;
                return bSize - aSize;
              });

              categories.push({
                name: "Ended Series",
                count: endedSeries.length,
                sizeBytes: endedSizeBytes,
                items: endedItems.slice(0, limit_per_category),
              });
              // Note: Not adding to totalSizeBytes - ended series might be wanted
            }
          } catch (error) {
            serviceStatus.push({
              name: "Sonarr",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Check Radarr for unmonitored movies
        if (config.radarr) {
          try {
            const radarrClient = new RadarrClient(config.radarr, "Radarr");
            serviceStatus.push({ name: "Radarr", available: true });

            const allMovies = await radarrClient.getAllMovies();
            const unmonitored = allMovies.filter(
              (m) => !m.monitored && m.hasFile,
            );

            if (unmonitored.length > 0) {
              const unmonitoredItems: CleanupCategory["items"] = [];
              let unmonitoredSizeBytes = 0;

              for (const movie of unmonitored) {
                const sizeBytes = movie.sizeOnDisk || 0;
                unmonitoredSizeBytes += sizeBytes;
                unmonitoredItems.push({
                  title: `${movie.title} (${movie.year})`,
                  size: formatSize(sizeBytes),
                  details: "Unmonitored",
                });
              }

              unmonitoredItems.sort((a, b) => {
                const aSize = parseFloat(a.size) || 0;
                const bSize = parseFloat(b.size) || 0;
                return bSize - aSize;
              });

              categories.push({
                name: "Unmonitored Movies",
                count: unmonitored.length,
                sizeBytes: unmonitoredSizeBytes,
                items: unmonitoredItems.slice(0, limit_per_category),
              });
              // Note: Not adding to totalSizeBytes - unmonitored might be intentional
            }
          } catch (error) {
            serviceStatus.push({
              name: "Radarr",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Check Sabnzbd for failed downloads
        if (config.sabnzbd) {
          try {
            const sabnzbdClient = new SabnzbdClient(config.sabnzbd);
            serviceStatus.push({ name: "Sabnzbd", available: true });

            const failed = await sabnzbdClient.getFailedDownloads();

            if (failed.length > 0) {
              const failedItems: CleanupCategory["items"] = [];
              let failedSizeBytes = 0;

              for (const item of failed) {
                failedSizeBytes += item.bytes;
                failedItems.push({
                  title: item.name,
                  size: formatSize(item.bytes),
                  details: item.fail_message || "Failed",
                });
              }

              categories.push({
                name: "Failed Downloads",
                count: failed.length,
                sizeBytes: failedSizeBytes,
                items: failedItems.slice(0, limit_per_category),
              });
              // Failed downloads take space in incomplete folder
              totalSizeBytes += failedSizeBytes;
            }
          } catch (error) {
            serviceStatus.push({
              name: "Sabnzbd",
              available: false,
              error: formatErrorResponse(error),
            });
          }
        }

        // Build output
        let output = "# Cleanup Analysis\n\n";

        // Service status
        output += "## Service Status\n";
        for (const status of serviceStatus) {
          output += `- ${status.name}: ${status.available ? "OK" : `UNAVAILABLE (${status.error})`}\n`;
        }

        if (serviceStatus.length === 0) {
          output += "No services configured.\n";
        }

        // Summary
        output += `\n## Summary\n`;
        output += `Total potential savings: ${formatSize(totalSizeBytes)}\n`;
        output += `Categories found: ${categories.length}\n`;

        // Categories
        if (categories.length === 0) {
          output += "\nNo cleanup opportunities found.\n";
        } else {
          for (const category of categories) {
            output += `\n## ${category.name}\n`;
            output += `Count: ${category.count} | Size: ${formatSize(category.sizeBytes)}\n\n`;

            for (const item of category.items) {
              output += `- ${item.title} (${item.size})`;
              if (item.details) {
                output += ` - ${item.details}`;
              }
              output += "\n";
            }

            if (category.count > category.items.length) {
              output += `\n... and ${category.count - category.items.length} more\n`;
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
