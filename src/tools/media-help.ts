import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";

export function registerMediaHelpTool(server: McpServer, config: Config): void {
  server.tool(
    "media_help",
    "Get an overview of available tools and connected services",
    {
      topic: z
        .string()
        .optional()
        .describe("Optional: Get help on a specific topic (sonarr, radarr, plex, sabnzbd, tools)"),
    },
    async ({ topic }) => {
      // Determine connected services
      const connectedServices: string[] = [];
      if (config.sonarr) connectedServices.push("Sonarr (TV Shows)");
      if (config.radarr) connectedServices.push("Radarr (Movies)");
      if (config.radarr4k) connectedServices.push("Radarr4K (4K Movies)");
      if (config.plex) connectedServices.push("Plex (Media Library)");
      if (config.sabnzbd) connectedServices.push("Sabnzbd (Downloads)");

      // Topic-specific help
      if (topic) {
        const topicLower = topic.toLowerCase();

        if (topicLower === "sonarr" || topicLower === "tv") {
          return {
            content: [
              {
                type: "text",
                text: `Sonarr (TV Show Management)

Semantic Tools:
  tv_search      - Search for TV series by name
  tv_add         - Add a TV series to your library
  tv_list        - List all TV series
  tv_episodes    - View episode status for a series
  tv_search_missing - Search for missing episodes

Admin Tools:
  sonarr_queue   - View download queue
  sonarr_details - Get detailed series info
  sonarr_delete  - Remove a series
  sonarr_profiles - List quality profiles
  sonarr_folders - List root folders
  sonarr_stuck   - Find stuck imports
  sonarr_import  - Trigger manual import
  sonarr_blacklist - Blacklist bad releases
  sonarr_calendar - View upcoming episodes

Example workflows:
  "Add Breaking Bad" → tv_search, then tv_add
  "What's downloading?" → sonarr_queue
  "Fix stuck imports" → sonarr_stuck, then sonarr_blacklist`,
              },
            ],
          };
        }

        if (topicLower === "tools") {
          return {
            content: [
              {
                type: "text",
                text: `Available Tools

Cross-Service:
  system_health    - Check all services for issues
  downloads_status - Unified download status
  media_help       - This help system

TV Shows (Sonarr):
  tv_search, tv_add, tv_list, tv_episodes, tv_search_missing
  sonarr_queue, sonarr_details, sonarr_delete, sonarr_profiles
  sonarr_folders, sonarr_stuck, sonarr_import, sonarr_blacklist
  sonarr_calendar

Movies (Coming in Phase 2):
  movie_search, movie_add, movie_list, movie_upgrade, movie_delete
  radarr_queue, radarr_details, radarr_stuck, radarr_blacklist

Library (Coming in Phase 3):
  library_list, library_search, library_watched
  plex_delete, plex_unwatched, plex_watched_old

Downloads (Coming in Phase 4):
  downloads_queue, downloads_history, downloads_pause, downloads_resume`,
              },
            ],
          };
        }
      }

      // General help
      const output = `Media Management Server

Connected Services:
${connectedServices.length > 0 ? connectedServices.map((s) => `  - ${s}`).join("\n") : "  No services configured"}

Common Tasks:

1. Add a TV Show:
   "Add Breaking Bad" or "Search for The Office"
   → I'll use tv_search to find it, then tv_add

2. Check Downloads:
   "What's downloading?" or "Show queue"
   → I'll check sonarr_queue (and others when available)

3. Fix Problems:
   "Something is stuck" or "Check health"
   → I'll use system_health and sonarr_stuck

4. Browse Library:
   "List all shows" or "What shows do I have?"
   → I'll use tv_list to show your collection

For detailed help on a specific service:
  media_help topic:sonarr
  media_help topic:tools`;

      return {
        content: [{ type: "text", text: output }],
      };
    }
  );
}
