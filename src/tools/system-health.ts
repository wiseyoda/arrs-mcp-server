import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import { SonarrClient } from "../services/sonarr/client.js";
import { RadarrClient } from "../services/radarr/client.js";
import { PlexClient } from "../services/plex/client.js";
import { formatErrorResponse } from "../shared/errors.js";

interface ServiceHealth {
  name: string;
  status: "ok" | "warning" | "error";
  issues: string[];
}

export function registerSystemHealthTool(server: McpServer, config: Config): void {
  server.tool(
    "system_health",
    "Check health status of all configured services (Sonarr, Radarr, Plex, Sabnzbd)",
    async () => {
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

          services.push({
            name: "Sonarr",
            status: issues.some((i) => i.startsWith("ERROR"))
              ? "error"
              : issues.length > 0
                ? "warning"
                : "ok",
            issues,
          });
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
          const client = new RadarrClient(config.radarr);
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

          services.push({
            name: "Radarr",
            status: issues.some((i) => i.startsWith("ERROR"))
              ? "error"
              : issues.length > 0
                ? "warning"
                : "ok",
            issues,
          });
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
          const client = new RadarrClient(config.radarr4k);
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

          services.push({
            name: "Radarr4K",
            status: issues.some((i) => i.startsWith("ERROR"))
              ? "error"
              : issues.length > 0
                ? "warning"
                : "ok",
            issues,
          });
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

          services.push({
            name: "Plex",
            status: "ok",
            issues:
              libraries.length > 0
                ? [`${libraries.length} libraries, server: ${identity.MediaContainer.friendlyName}`]
                : [],
          });
        } catch (error) {
          services.push({
            name: "Plex",
            status: "error",
            issues: [formatErrorResponse(error)],
          });
        }
      }

      // Placeholder for future services
      // Sabnzbd will be added in later phases

      if (services.length === 0) {
        return {
          content: [{ type: "text", text: "No services configured." }],
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
          service.status === "ok" ? "OK" : service.status === "warning" ? "WARNING" : "ERROR";
        output += `${service.name}: ${statusIcon}\n`;
        for (const issue of service.issues) {
          output += `  - ${issue}\n`;
        }
        if (service.issues.length === 0) {
          output += `  No issues\n`;
        }
        output += "\n";
      }

      return {
        content: [{ type: "text", text: output.trim() }],
      };
    }
  );
}
