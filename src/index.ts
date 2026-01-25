#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { registerSonarrTools } from "./services/sonarr/tools.js";
import { registerRadarrTools } from "./services/radarr/tools.js";
import { registerPlexTools } from "./services/plex/tools.js";
import { registerSabnzbdTools } from "./services/sabnzbd/tools.js";
import { registerSystemTools } from "./tools/index.js";

const server = new McpServer({
  name: "arrs-mcp-server",
  version: "0.1.0",
});

async function main() {
  // Load configuration
  const config = loadConfig();

  // Register tools
  if (config.sonarr) {
    registerSonarrTools(server, config);
  }
  if (config.radarr || config.radarr4k) {
    registerRadarrTools(server, config);
  }
  if (config.plex) {
    registerPlexTools(server, config);
  }
  if (config.sabnzbd) {
    registerSabnzbdTools(server, config);
  }
  registerSystemTools(server, config);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log startup to stderr (not stdout - that's for MCP protocol)
  console.error("arrs-mcp-server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
