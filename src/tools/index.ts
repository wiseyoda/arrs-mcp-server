import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import type { ProviderRegistry } from "../providers/index.js";
import { registerSystemHealthTool } from "./system-health.js";
import { registerMediaHelpTool } from "./media-help.js";
import { registerDownloadsStatusTool } from "./downloads-status.js";
import { registerCleanupAnalysisTool } from "./cleanup-analysis.js";
import { registerProvidersStatusTool } from "./providers-status.js";
import { registerLibraryAuditTool } from "./library-audit.js";
import { registerLibrarySyncTool } from "./library-sync.js";
import { registerSpacePlannerTool } from "./space-planner.js";
import { registerWatchAnalyticsTool } from "./watch-analytics.js";

export function registerSystemTools(
  server: McpServer,
  config: Config,
  registry: ProviderRegistry,
): void {
  registerSystemHealthTool(server, config, registry);
  registerMediaHelpTool(server, config);
  registerDownloadsStatusTool(server, config);
  registerCleanupAnalysisTool(server, config);
  registerProvidersStatusTool(server, registry);
  registerLibraryAuditTool(server, config, registry);
  registerLibrarySyncTool(server, config, registry);
  registerSpacePlannerTool(server, config, registry);
  registerWatchAnalyticsTool(server, config, registry);
}
