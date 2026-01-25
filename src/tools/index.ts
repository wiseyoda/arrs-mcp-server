import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config.js";
import { registerSystemHealthTool } from "./system-health.js";
import { registerMediaHelpTool } from "./media-help.js";
import { registerDownloadsStatusTool } from "./downloads-status.js";
import { registerCleanupAnalysisTool } from "./cleanup-analysis.js";

export function registerSystemTools(server: McpServer, config: Config): void {
  registerSystemHealthTool(server, config);
  registerMediaHelpTool(server, config);
  registerDownloadsStatusTool(server, config);
  registerCleanupAnalysisTool(server, config);
}
