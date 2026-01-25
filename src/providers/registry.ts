import type { Config } from "../config.js";
import type {
  ProviderName,
  ProviderStatus,
  ProviderCapability,
  CrossProviderFeature,
  ProviderRegistryState,
} from "./types.js";
import { ProviderNotConfiguredError } from "./errors.js";

/**
 * Provider definitions with their capabilities and configuration requirements
 */
const PROVIDER_DEFINITIONS: Record<
  ProviderName,
  {
    displayName: string;
    description: string;
    capabilities: ProviderCapability[];
    envVars: string[];
    configKeys: string[];
  }
> = {
  sonarr: {
    displayName: "Sonarr",
    description: "TV show management",
    capabilities: ["search", "add", "list", "delete", "queue", "calendar"],
    envVars: ["SONARR_URL", "SONARR_API_KEY"],
    configKeys: ["sonarr.url", "sonarr.apiKey"],
  },
  radarr: {
    displayName: "Radarr",
    description: "Movie management",
    capabilities: ["search", "add", "list", "delete", "queue"],
    envVars: ["RADARR_URL", "RADARR_API_KEY"],
    configKeys: ["radarr.url", "radarr.apiKey"],
  },
  radarr4k: {
    displayName: "Radarr 4K",
    description: "4K movie management",
    capabilities: ["search", "add", "list", "delete", "queue"],
    envVars: ["RADARR4K_URL", "RADARR4K_API_KEY"],
    configKeys: ["radarr4k.url", "radarr4k.apiKey"],
  },
  plex: {
    displayName: "Plex",
    description: "Media library",
    capabilities: ["search", "list", "collections"],
    envVars: ["PLEX_URL", "PLEX_TOKEN"],
    configKeys: ["plex.url", "plex.token"],
  },
  sabnzbd: {
    displayName: "SABnzbd",
    description: "Download client",
    capabilities: ["queue", "history", "pause", "resume"],
    envVars: ["SABNZBD_URL", "SABNZBD_API_KEY"],
    configKeys: ["sabnzbd.url", "sabnzbd.apiKey"],
  },
  overseerr: {
    displayName: "Overseerr",
    description: "Request management",
    capabilities: ["requests", "issues", "users", "search"],
    envVars: ["OVERSEERR_URL", "OVERSEERR_API_KEY"],
    configKeys: ["overseerr.url", "overseerr.apiKey"],
  },
  tmdb: {
    displayName: "TMDB",
    description: "Movie/TV database",
    capabilities: ["search", "collections", "recommendations", "trending"],
    envVars: ["TMDB_API_KEY"],
    configKeys: ["tmdb.apiKey"],
  },
};

/**
 * Cross-provider feature definitions
 */
const CROSS_PROVIDER_FEATURES: Array<{
  name: string;
  description: string;
  requiredProviders: ProviderName[];
}> = [
  {
    name: "Library Intelligence",
    description: "Cross-reference library with media managers",
    requiredProviders: ["plex"],
  },
  {
    name: "Request Workflow",
    description: "Manage media requests through Overseerr",
    requiredProviders: ["overseerr"],
  },
  {
    name: "TV Management",
    description: "Full TV show lifecycle management",
    requiredProviders: ["sonarr"],
  },
  {
    name: "Movie Management",
    description: "Full movie lifecycle management",
    requiredProviders: ["radarr"],
  },
  {
    name: "Download Monitoring",
    description: "Monitor and control downloads",
    requiredProviders: ["sabnzbd"],
  },
];

/**
 * Provider Registry - tracks which providers are configured and their capabilities
 */
export class ProviderRegistry {
  private readonly configuredProviders: Set<ProviderName>;
  private readonly config: Config;

  constructor(config: Config) {
    this.config = config;
    this.configuredProviders = new Set();
    this.detectConfiguredProviders();
  }

  private detectConfiguredProviders(): void {
    if (this.config.sonarr?.url && this.config.sonarr?.apiKey) {
      this.configuredProviders.add("sonarr");
    }
    if (this.config.radarr?.url && this.config.radarr?.apiKey) {
      this.configuredProviders.add("radarr");
    }
    if (this.config.radarr4k?.url && this.config.radarr4k?.apiKey) {
      this.configuredProviders.add("radarr4k");
    }
    if (this.config.plex?.url && this.config.plex?.token) {
      this.configuredProviders.add("plex");
    }
    if (this.config.sabnzbd?.url && this.config.sabnzbd?.apiKey) {
      this.configuredProviders.add("sabnzbd");
    }
    if (this.config.overseerr?.url && this.config.overseerr?.apiKey) {
      this.configuredProviders.add("overseerr");
    }
    if (this.config.tmdb?.apiKey) {
      this.configuredProviders.add("tmdb");
    }
  }

  /**
   * Check if a specific provider is configured
   */
  isConfigured(provider: ProviderName): boolean {
    return this.configuredProviders.has(provider);
  }

  /**
   * Get list of all configured provider names
   */
  getConfigured(): ProviderName[] {
    return Array.from(this.configuredProviders);
  }

  /**
   * Get list of all unconfigured provider names
   */
  getMissing(): ProviderName[] {
    const allProviders = Object.keys(PROVIDER_DEFINITIONS) as ProviderName[];
    return allProviders.filter((p) => !this.configuredProviders.has(p));
  }

  /**
   * Get detailed status for all providers
   */
  getStatus(): ProviderStatus[] {
    return (Object.keys(PROVIDER_DEFINITIONS) as ProviderName[]).map(
      (name) => ({
        name,
        displayName: PROVIDER_DEFINITIONS[name].displayName,
        description: PROVIDER_DEFINITIONS[name].description,
        configured: this.configuredProviders.has(name),
        capabilities: PROVIDER_DEFINITIONS[name].capabilities,
        envVars: PROVIDER_DEFINITIONS[name].envVars,
        configKeys: PROVIDER_DEFINITIONS[name].configKeys,
      }),
    );
  }

  /**
   * Get the full registry state including cross-provider features
   */
  getFullState(): ProviderRegistryState {
    const providers = this.getStatus();
    const features: CrossProviderFeature[] = CROSS_PROVIDER_FEATURES.map(
      (feature) => ({
        ...feature,
        available: feature.requiredProviders.every((p) =>
          this.configuredProviders.has(p),
        ),
      }),
    );

    return { providers, features };
  }

  /**
   * Require that specific providers are configured, throw if any are missing
   */
  requireProviders(...providers: ProviderName[]): void {
    const missing = providers.filter((p) => !this.configuredProviders.has(p));
    if (missing.length > 0) {
      throw new ProviderNotConfiguredError(missing);
    }
  }

  /**
   * Get capabilities for a specific provider (empty array if not configured)
   */
  getCapabilities(provider: ProviderName): ProviderCapability[] {
    if (!this.configuredProviders.has(provider)) {
      return [];
    }
    return PROVIDER_DEFINITIONS[provider].capabilities;
  }
}

/**
 * Get list of media providers (arr services + plex) that are available
 */
export function getAvailableMediaProviders(
  registry: ProviderRegistry,
): ProviderName[] {
  const mediaProviders: ProviderName[] = [
    "sonarr",
    "radarr",
    "radarr4k",
    "plex",
  ];
  return mediaProviders.filter((p) => registry.isConfigured(p));
}

/**
 * Utility to require providers - throws ProviderNotConfiguredError if missing
 */
export function requireProviders(
  registry: ProviderRegistry,
  ...providers: ProviderName[]
): void {
  registry.requireProviders(...providers);
}
