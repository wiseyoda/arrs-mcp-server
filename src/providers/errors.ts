import { ArrsError } from "../shared/errors.js";
import type { ProviderName } from "./types.js";

/**
 * Provider configuration information for error messages
 */
interface ProviderConfigInfo {
  envVars: string[];
  configExample: Record<string, unknown>;
}

/**
 * Configuration information for each provider
 */
const PROVIDER_CONFIG_INFO: Record<ProviderName, ProviderConfigInfo> = {
  sonarr: {
    envVars: ["SONARR_URL", "SONARR_API_KEY"],
    configExample: {
      sonarr: {
        url: "http://your-sonarr:8989",
        apiKey: "your-api-key",
      },
    },
  },
  radarr: {
    envVars: ["RADARR_URL", "RADARR_API_KEY"],
    configExample: {
      radarr: {
        url: "http://your-radarr:7878",
        apiKey: "your-api-key",
      },
    },
  },
  radarr4k: {
    envVars: ["RADARR4K_URL", "RADARR4K_API_KEY"],
    configExample: {
      radarr4k: {
        url: "http://your-radarr-4k:7879",
        apiKey: "your-api-key",
      },
    },
  },
  plex: {
    envVars: ["PLEX_URL", "PLEX_TOKEN"],
    configExample: {
      plex: {
        url: "http://your-plex:32400",
        token: "your-plex-token",
      },
    },
  },
  sabnzbd: {
    envVars: ["SABNZBD_URL", "SABNZBD_API_KEY"],
    configExample: {
      sabnzbd: {
        url: "http://your-sabnzbd:8080",
        apiKey: "your-api-key",
      },
    },
  },
  overseerr: {
    envVars: ["OVERSEERR_URL", "OVERSEERR_API_KEY"],
    configExample: {
      overseerr: {
        url: "http://your-overseerr:5055",
        apiKey: "your-api-key",
      },
    },
  },
  tmdb: {
    envVars: ["TMDB_API_KEY"],
    configExample: {
      tmdb: {
        apiKey: "your-tmdb-api-key",
      },
    },
  },
};

/**
 * Human-readable display names for providers
 */
const PROVIDER_DISPLAY_NAMES: Record<ProviderName, string> = {
  sonarr: "Sonarr",
  radarr: "Radarr",
  radarr4k: "Radarr 4K",
  plex: "Plex",
  sabnzbd: "SABnzbd",
  overseerr: "Overseerr",
  tmdb: "TMDB",
};

/**
 * Error thrown when one or more required providers are not configured
 */
export class ProviderNotConfiguredError extends ArrsError {
  readonly missingProviders: ProviderName[];

  constructor(missingProviders: ProviderName | ProviderName[]) {
    const providers = Array.isArray(missingProviders)
      ? missingProviders
      : [missingProviders];
    const displayNames = providers
      .map((p) => PROVIDER_DISPLAY_NAMES[p])
      .join(", ");
    super(`Provider(s) not configured: ${displayNames}`);
    this.name = "ProviderNotConfiguredError";
    this.missingProviders = providers;
  }

  /**
   * Returns a user-friendly error message with configuration instructions
   */
  toUserMessage(): string {
    if (this.missingProviders.length === 1) {
      return this.formatSingleProviderMessage(this.missingProviders[0]);
    }
    return this.formatMultipleProvidersMessage();
  }

  private formatSingleProviderMessage(provider: ProviderName): string {
    const displayName = PROVIDER_DISPLAY_NAMES[provider];
    const config = PROVIDER_CONFIG_INFO[provider];

    const lines = [
      `${displayName} is not configured. This tool requires ${displayName}.`,
      "",
      "To configure, add to config.json:",
      JSON.stringify(config.configExample, null, 2),
      "",
      "Or set environment variables:",
    ];

    for (const envVar of config.envVars) {
      lines.push(`  ${envVar}=<value>`);
    }

    return lines.join("\n");
  }

  private formatMultipleProvidersMessage(): string {
    const displayNames = this.missingProviders.map(
      (p) => PROVIDER_DISPLAY_NAMES[p],
    );
    const lines = [
      `The following providers are not configured: ${displayNames.join(", ")}`,
      "",
      "Configuration required for each:",
    ];

    for (const provider of this.missingProviders) {
      const displayName = PROVIDER_DISPLAY_NAMES[provider];
      const config = PROVIDER_CONFIG_INFO[provider];
      lines.push("");
      lines.push(`${displayName}:`);
      lines.push(`  Environment: ${config.envVars.join(", ")}`);
      lines.push(`  Config.json: ${JSON.stringify(config.configExample)}`);
    }

    return lines.join("\n");
  }
}

/**
 * Get configuration info for a provider (useful for providers_status tool)
 */
export function getProviderConfigInfo(
  provider: ProviderName,
): ProviderConfigInfo {
  return PROVIDER_CONFIG_INFO[provider];
}

/**
 * Get display name for a provider
 */
export function getProviderDisplayName(provider: ProviderName): string {
  return PROVIDER_DISPLAY_NAMES[provider];
}
