import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import { SonarrClient } from "../services/sonarr/client.js";
import { RadarrClient } from "../services/radarr/client.js";
import { SabnzbdClient } from "../services/sabnzbd/client.js";
import { formatEta, getSourceFromCategory } from "../services/sabnzbd/types.js";
import { formatErrorResponse } from "../shared/errors.js";

interface DownloadItem {
  title: string;
  progress: number;
  eta: string;
  status: string;
  source: string;
  issues?: string[];
}

export function registerDownloadsStatusTool(server: McpServer, config: Config): void {
  server.tool(
    "downloads_status",
    "Get unified download status across all services (Sonarr, Radarr, Sabnzbd)",
    async () => {
      const downloads: DownloadItem[] = [];
      const issues: string[] = [];

      // Get Sonarr queue
      if (config.sonarr) {
        try {
          const client = new SonarrClient(config.sonarr);
          const queue = await client.getQueue();

          for (const item of queue.records) {
            const progress = item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) : 0;
            const itemIssues = item.statusMessages?.map((m) => m.title);

            downloads.push({
              title: item.title,
              progress,
              eta: item.timeleft || "unknown",
              status: item.trackedDownloadStatus || item.status,
              source: "Sonarr",
              issues: itemIssues && itemIssues.length > 0 ? itemIssues : undefined,
            });

            if (item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error") {
              issues.push(`Sonarr: ${item.title} - ${itemIssues?.join(", ") || "has issues"}`);
            }
          }
        } catch (error) {
          issues.push(`Sonarr: ${formatErrorResponse(error)}`);
        }
      }

      // Get Radarr queue
      if (config.radarr) {
        try {
          const client = new RadarrClient(config.radarr);
          const queue = await client.getQueue();

          for (const item of queue.records) {
            const progress = item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) : 0;
            const itemIssues = item.statusMessages?.map((m) => m.title);

            downloads.push({
              title: item.title,
              progress,
              eta: item.timeleft || "unknown",
              status: item.trackedDownloadStatus || item.status,
              source: "Radarr",
              issues: itemIssues && itemIssues.length > 0 ? itemIssues : undefined,
            });

            if (item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error") {
              issues.push(`Radarr: ${item.title} - ${itemIssues?.join(", ") || "has issues"}`);
            }
          }
        } catch (error) {
          issues.push(`Radarr: ${formatErrorResponse(error)}`);
        }
      }

      // Get Radarr4K queue
      if (config.radarr4k) {
        try {
          const client = new RadarrClient(config.radarr4k);
          const queue = await client.getQueue();

          for (const item of queue.records) {
            const progress = item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) : 0;
            const itemIssues = item.statusMessages?.map((m) => m.title);

            downloads.push({
              title: item.title,
              progress,
              eta: item.timeleft || "unknown",
              status: item.trackedDownloadStatus || item.status,
              source: "Radarr4K",
              issues: itemIssues && itemIssues.length > 0 ? itemIssues : undefined,
            });

            if (item.trackedDownloadStatus === "warning" || item.trackedDownloadStatus === "error") {
              issues.push(`Radarr4K: ${item.title} - ${itemIssues?.join(", ") || "has issues"}`);
            }
          }
        } catch (error) {
          issues.push(`Radarr4K: ${formatErrorResponse(error)}`);
        }
      }

      // Get Sabnzbd queue
      if (config.sabnzbd) {
        try {
          const client = new SabnzbdClient(config.sabnzbd);
          const queue = await client.getQueue();

          for (const item of queue.slots) {
            const progress = parseInt(item.percentage, 10) || 0;
            const source = getSourceFromCategory(item.cat);

            downloads.push({
              title: item.filename,
              progress,
              eta: formatEta(item.timeleft),
              status: item.status,
              source: `Sabnzbd [${source}]`,
            });
          }

          // Check if Sabnzbd is paused
          if (queue.paused) {
            issues.push("Sabnzbd: Downloads are paused");
          }
        } catch (error) {
          issues.push(`Sabnzbd: ${formatErrorResponse(error)}`);
        }
      }

      if (downloads.length === 0 && issues.length === 0) {
        return {
          content: [{ type: "text", text: "No active downloads." }],
        };
      }

      // Format output
      let output = "";

      if (downloads.length > 0) {
        output += `Active Downloads (${downloads.length}):\n\n`;
        for (const item of downloads) {
          output += `${item.title}\n`;
          output += `  Progress: ${item.progress}% | ETA: ${item.eta} | Source: ${item.source}\n`;
          if (item.issues) {
            output += `  Issues: ${item.issues.join(", ")}\n`;
          }
          output += "\n";
        }
      }

      if (issues.length > 0) {
        output += `\nIssues (${issues.length}):\n`;
        for (const issue of issues) {
          output += `  - ${issue}\n`;
        }
      }

      return {
        content: [{ type: "text", text: output.trim() }],
      };
    }
  );
}
