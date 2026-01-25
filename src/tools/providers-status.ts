import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProviderRegistry } from "../providers/index.js";

/**
 * Register the providers_status tool
 */
export function registerProvidersStatusTool(
  server: McpServer,
  registry: ProviderRegistry,
): void {
  server.tool(
    "providers_status",
    "List configured and missing providers with their capabilities. " +
      "Shows which services are available, what they can do, and how to configure missing ones.",
    {},
    async () => {
      const state = registry.getFullState();
      const output = formatProvidersStatus(state);

      return {
        content: [{ type: "text", text: output }],
      };
    },
  );
}

interface ProviderStatusFormatted {
  providers: Array<{
    name: string;
    displayName: string;
    description: string;
    configured: boolean;
    capabilities: string[];
    envVars: string[];
  }>;
  features: Array<{
    name: string;
    description: string;
    available: boolean;
    requiredProviders: string[];
  }>;
}

function formatProvidersStatus(state: ProviderStatusFormatted): string {
  const lines: string[] = [];

  lines.push("Provider Status");
  lines.push("===============");
  lines.push("");

  // Configured providers
  const configured = state.providers.filter((p) => p.configured);
  if (configured.length > 0) {
    lines.push("Configured:");
    for (const provider of configured) {
      const caps = provider.capabilities.join(", ");
      lines.push(`  \u2713 ${provider.displayName} - ${provider.description} (${caps})`);
    }
    lines.push("");
  }

  // Missing providers
  const missing = state.providers.filter((p) => !p.configured);
  if (missing.length > 0) {
    lines.push("Not Configured:");
    for (const provider of missing) {
      lines.push(`  \u2717 ${provider.displayName} - ${provider.description}`);
      lines.push(`    \u2192 Configure with ${provider.envVars.join(" and ")}`);
    }
    lines.push("");
  }

  // Cross-provider features
  lines.push("Cross-Provider Features:");
  for (const feature of state.features) {
    const status = feature.available ? "\u2713" : "\u2717";
    const providers = feature.requiredProviders.join(", ");
    lines.push(`  ${status} ${feature.name} (requires: ${providers})`);
    if (!feature.available) {
      lines.push(`    ${feature.description}`);
    }
  }

  return lines.join("\n");
}
