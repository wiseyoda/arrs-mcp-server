import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import { SonarrClient } from "../services/sonarr/client.js";
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

      // Placeholder for future services
      // Radarr, Sabnzbd will be added in later phases

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
