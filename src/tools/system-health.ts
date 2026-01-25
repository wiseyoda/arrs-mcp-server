import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import type { ProviderRegistry } from "../providers/index.js";
import { SonarrClient } from "../services/sonarr/client.js";
import { RadarrClient } from "../services/radarr/client.js";
import { PlexClient } from "../services/plex/client.js";
import { SabnzbdClient } from "../services/sabnzbd/client.js";
import { OverseerrClient } from "../services/overseerr/client.js";
import { formatSpeed, formatMb } from "../services/sabnzbd/types.js";
import { formatErrorResponse } from "../shared/errors.js";

interface ServiceHealth {
  name: string;
  status: "ok" | "warning" | "error";
  issues: string[];
  // Verbose details (optional)
  version?: string;
  counts?: Record<string, number>;
  queueInfo?: string;
  recentActivity?: string[];
}

export function registerSystemHealthTool(
  server: McpServer,
  config: Config,
  registry: ProviderRegistry,
): void {
  server.tool(
    "system_health",
    "Check health status of all configured services (Sonarr, Radarr, Plex, Sabnzbd). Use verbose: true for detailed info.",
    {
      verbose: z
        .boolean()
        .optional()
        .describe(
          "Include detailed info: version numbers, counts, queue status, recent activity",
        ),
    },
    async ({ verbose }) => {
      const services: ServiceHealth[] = [];

      // Check Sonarr
      if (config.sonarr) {
        try {
          const client = new SonarrClient(config.sonarr);
          const health = await client.getHealth();
          const stuckItems = await client.getStuckItems();

          const issues: string[] = [];

          // Add health check issues
          for (const check of health) {
            if (check.type === "error" || check.type === "warning") {
              issues.push(`${check.type.toUpperCase()}: ${check.message}`);
            }
          }

          // Add stuck items as warning
          if (stuckItems.length > 0) {
            issues.push(`${stuckItems.length} items stuck importing`);
          }

          const serviceHealth: ServiceHealth = {
            name: "Sonarr",
            status: issues.some((i) => i.startsWith("ERROR"))
              ? "error"
              : issues.length > 0
                ? "warning"
                : "ok",
            issues,
          };

          // Add verbose details
          if (verbose) {
            const allSeries = await client.getAllSeries();
            const queueItems = await client.getQueueDetails();
            const upcoming = await client.getUpcoming(7);

            // Build series ID to title map
            const seriesMap = new Map<number, string>();
            for (const series of allSeries) {
              seriesMap.set(series.id, series.title);
            }

            // Get version from a series (API doesn't expose version directly, but we can show counts)
            serviceHealth.counts = {
              series: allSeries.length,
              episodes: allSeries.reduce(
                (sum, s) => sum + (s.statistics?.episodeFileCount || 0),
                0,
              ),
              queue: queueItems.length,
            };
            serviceHealth.queueInfo =
              queueItems.length > 0
                ? `${queueItems.length} items downloading`
                : "Queue empty";
            serviceHealth.recentActivity = upcoming
              .slice(0, 3)
              .map(
                (ep) =>
                  `${seriesMap.get(ep.seriesId) || "Unknown"} S${ep.seasonNumber}E${ep.episodeNumber} - ${ep.airDateUtc ? new Date(ep.airDateUtc).toLocaleDateString() : "TBA"}`,
              );
          }

          services.push(serviceHealth);
        } catch (error) {
          services.push({
            name: "Sonarr",
            status: "error",
            issues: [formatErrorResponse(error)],
          });
        }
      }

      // Check Radarr
      if (config.radarr) {
        try {
          const client = new RadarrClient(config.radarr, "Radarr");
          const health = await client.getHealth();
          const stuckItems = await client.getStuckItems();

          const issues: string[] = [];

          // Add health check issues
          for (const check of health) {
            if (check.type === "error" || check.type === "warning") {
              issues.push(`${check.type.toUpperCase()}: ${check.message}`);
            }
          }

          // Add stuck items as warning
          if (stuckItems.length > 0) {
            issues.push(`${stuckItems.length} items stuck importing`);
          }

          const serviceHealth: ServiceHealth = {
            name: "Radarr",
            status: issues.some((i) => i.startsWith("ERROR"))
              ? "error"
              : issues.length > 0
                ? "warning"
                : "ok",
            issues,
          };

          // Add verbose details
          if (verbose) {
            const allMovies = await client.getAllMovies();
            const queue = await client.getQueueDetails();

            const withFile = allMovies.filter((m) => m.hasFile);
            const monitored = allMovies.filter((m) => m.monitored);

            serviceHealth.counts = {
              movies: allMovies.length,
              downloaded: withFile.length,
              monitored: monitored.length,
              queue: queue.length,
            };
            serviceHealth.queueInfo =
              queue.length > 0
                ? `${queue.length} items downloading`
                : "Queue empty";
            // Recent activity - recently added movies
            const recentlyAdded = [...allMovies]
              .sort(
                (a, b) =>
                  new Date(b.added).getTime() - new Date(a.added).getTime(),
              )
              .slice(0, 3);
            serviceHealth.recentActivity = recentlyAdded.map(
              (m) =>
                `${m.title} (${m.year}) - Added ${new Date(m.added).toLocaleDateString()}`,
            );
          }

          services.push(serviceHealth);
        } catch (error) {
          services.push({
            name: "Radarr",
            status: "error",
            issues: [formatErrorResponse(error)],
          });
        }
      }

      // Check Radarr4K
      if (config.radarr4k) {
        try {
          const client = new RadarrClient(config.radarr4k, "Radarr4K");
          const health = await client.getHealth();
          const stuckItems = await client.getStuckItems();

          const issues: string[] = [];

          // Add health check issues
          for (const check of health) {
            if (check.type === "error" || check.type === "warning") {
              issues.push(`${check.type.toUpperCase()}: ${check.message}`);
            }
          }

          // Add stuck items as warning
          if (stuckItems.length > 0) {
            issues.push(`${stuckItems.length} items stuck importing`);
          }

          const serviceHealth: ServiceHealth = {
            name: "Radarr4K",
            status: issues.some((i) => i.startsWith("ERROR"))
              ? "error"
              : issues.length > 0
                ? "warning"
                : "ok",
            issues,
          };

          // Add verbose details
          if (verbose) {
            const allMovies = await client.getAllMovies();
            const queue = await client.getQueueDetails();

            const withFile = allMovies.filter((m) => m.hasFile);
            const monitored = allMovies.filter((m) => m.monitored);

            serviceHealth.counts = {
              movies: allMovies.length,
              downloaded: withFile.length,
              monitored: monitored.length,
              queue: queue.length,
            };
            serviceHealth.queueInfo =
              queue.length > 0
                ? `${queue.length} items downloading`
                : "Queue empty";
          }

          services.push(serviceHealth);
        } catch (error) {
          services.push({
            name: "Radarr4K",
            status: "error",
            issues: [formatErrorResponse(error)],
          });
        }
      }

      // Check Plex
      if (config.plex) {
        try {
          const client = new PlexClient(config.plex);
          const identity = await client.getServerIdentity();
          const libraries = await client.getLibraries();

          const serviceHealth: ServiceHealth = {
            name: "Plex",
            status: "ok",
            issues:
              libraries.length > 0
                ? [
                    `${libraries.length} libraries, server: ${identity.MediaContainer.friendlyName}`,
                  ]
                : [],
          };

          // Add verbose details
          if (verbose) {
            serviceHealth.version = identity.MediaContainer.version;

            // Get item counts per library type
            const movieLibs = libraries.filter((l) => l.type === "movie");
            const showLibs = libraries.filter((l) => l.type === "show");

            let totalMovies = 0;
            let totalShows = 0;

            for (const lib of movieLibs) {
              const { totalSize } = await client.getLibraryItems(lib.key, {
                size: 1,
              });
              totalMovies += totalSize;
            }
            for (const lib of showLibs) {
              const { totalSize } = await client.getLibraryItems(lib.key, {
                size: 1,
              });
              totalShows += totalSize;
            }

            serviceHealth.counts = {
              libraries: libraries.length,
              movies: totalMovies,
              shows: totalShows,
            };

            // Recent activity - recently added
            const recentItems: string[] = [];
            for (const lib of libraries.slice(0, 2)) {
              const recent = await client.getRecentlyAdded(lib.key, 2);
              for (const item of recent) {
                const info = client.parseMediaItem(item, lib.title);
                recentItems.push(
                  `${info.title} (${info.year || "N/A"}) in ${lib.title}`,
                );
              }
            }
            serviceHealth.recentActivity = recentItems.slice(0, 3);
          }

          services.push(serviceHealth);
        } catch (error) {
          services.push({
            name: "Plex",
            status: "error",
            issues: [formatErrorResponse(error)],
          });
        }
      }

      // Check Sabnzbd
      if (config.sabnzbd) {
        try {
          const client = new SabnzbdClient(config.sabnzbd);
          const status = await client.getServerStatus();

          const issues: string[] = [];

          // Check if paused
          if (status.paused) {
            issues.push("Downloads paused");
          }

          // Add queue info
          if (status.noofslots > 0) {
            const speed = formatSpeed(status.speed);
            issues.push(`${status.noofslots} items in queue, speed: ${speed}`);
          }

          const serviceHealth: ServiceHealth = {
            name: "Sabnzbd",
            status: status.paused ? "warning" : "ok",
            issues,
          };

          // Add verbose details
          if (verbose) {
            const history = await client.getHistory(20);
            const failed = await client.getFailedDownloads();

            serviceHealth.counts = {
              queue: status.noofslots,
              history: history.slots.length,
              failed: failed.length,
            };
            serviceHealth.queueInfo =
              status.noofslots > 0
                ? `${status.noofslots} items, ${formatMb(status.mbleft)} left, ETA: ${status.timeleft || "unknown"}`
                : "Queue empty";

            // Recent completions
            const completed = history.slots
              .filter((s) => s.status === "Completed")
              .slice(0, 3);
            serviceHealth.recentActivity = completed.map(
              (h) =>
                `${h.name} (${new Date(h.completed * 1000).toLocaleDateString()})`,
            );
          }

          services.push(serviceHealth);
        } catch (error) {
          services.push({
            name: "Sabnzbd",
            status: "error",
            issues: [formatErrorResponse(error)],
          });
        }
      }

      // Check Overseerr
      if (config.overseerr) {
        try {
          const client = new OverseerrClient(config.overseerr);
          const health = await client.checkHealth();

          const serviceHealth: ServiceHealth = {
            name: "Overseerr",
            status: "ok",
            issues: [],
          };

          // Add verbose details
          if (verbose) {
            serviceHealth.version = health.version;

            // Get pending request count
            const pendingPage = await client.getRequests("pending", 1);
            const allPage = await client.getRequests(undefined, 1);

            serviceHealth.counts = {
              pendingRequests: pendingPage.pageInfo.results,
              totalRequests: allPage.pageInfo.results,
            };
            serviceHealth.queueInfo =
              pendingPage.pageInfo.results > 0
                ? `${pendingPage.pageInfo.results} pending requests`
                : "No pending requests";
          }

          services.push(serviceHealth);
        } catch (error) {
          services.push({
            name: "Overseerr",
            status: "error",
            issues: [formatErrorResponse(error)],
          });
        }
      }

      // Get missing providers from registry
      const missingProviders = registry.getMissing();

      if (services.length === 0) {
        let text = "No services configured.\n\n";
        if (missingProviders.length > 0) {
          text += `Missing providers: ${missingProviders.join(", ")}\n`;
          text += "Use providers_status for configuration details.";
        }
        return {
          content: [{ type: "text", text }],
        };
      }

      // Determine overall status
      const overallStatus = services.some((s) => s.status === "error")
        ? "error"
        : services.some((s) => s.status === "warning")
          ? "warning"
          : "ok";

      // Format output
      let output = `System Health: ${overallStatus.toUpperCase()}\n\n`;

      for (const service of services) {
        const statusIcon =
          service.status === "ok"
            ? "OK"
            : service.status === "warning"
              ? "WARNING"
              : "ERROR";
        output += `${service.name}: ${statusIcon}\n`;

        // Version (verbose)
        if (verbose && service.version) {
          output += `  Version: ${service.version}\n`;
        }

        // Counts (verbose)
        if (verbose && service.counts) {
          const countParts = Object.entries(service.counts)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          output += `  Counts: ${countParts}\n`;
        }

        // Queue info (verbose)
        if (verbose && service.queueInfo) {
          output += `  Queue: ${service.queueInfo}\n`;
        }

        // Issues
        for (const issue of service.issues) {
          output += `  - ${issue}\n`;
        }
        if (service.issues.length === 0 && !verbose) {
          output += `  No issues\n`;
        }

        // Recent activity (verbose)
        if (
          verbose &&
          service.recentActivity &&
          service.recentActivity.length > 0
        ) {
          output += `  Recent:\n`;
          for (const activity of service.recentActivity) {
            output += `    - ${activity}\n`;
          }
        }

        output += "\n";
      }

      // Show missing providers (optional section)
      if (missingProviders.length > 0 && verbose) {
        output += "Not Configured:\n";
        for (const provider of missingProviders) {
          output += `  - ${provider}\n`;
        }
        output += "Use providers_status for configuration details.\n";
      }

      return {
        content: [{ type: "text", text: output.trim() }],
      };
    },
  );
}
