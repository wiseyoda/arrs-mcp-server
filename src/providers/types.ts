/**
 * Provider types for the provider registry system
 */

/**
 * Capabilities that a provider can offer
 */
export type ProviderCapability =
  | "search"
  | "add"
  | "list"
  | "delete"
  | "queue"
  | "calendar"
  | "history"
  | "pause"
  | "resume"
  | "collections"
  | "recommendations"
  | "trending"
  | "requests"
  | "issues"
  | "users";

/**
 * Provider names supported by the system
 */
export type ProviderName =
  | "sonarr"
  | "radarr"
  | "radarr4k"
  | "plex"
  | "sabnzbd"
  | "overseerr"
  | "tmdb";

/**
 * Status of a provider including its configuration state and capabilities
 */
export interface ProviderStatus {
  /** Provider identifier */
  name: ProviderName;
  /** Display name for user-facing output */
  displayName: string;
  /** Brief description of what this provider does */
  description: string;
  /** Whether the provider is configured and available */
  configured: boolean;
  /** List of capabilities this provider offers */
  capabilities: ProviderCapability[];
  /** Environment variables needed to configure this provider */
  envVars: string[];
  /** Config.json keys needed to configure this provider */
  configKeys: string[];
}

/**
 * Cross-provider feature that requires multiple providers
 */
export interface CrossProviderFeature {
  /** Feature identifier */
  name: string;
  /** Human-readable description */
  description: string;
  /** Providers required for this feature (all must be configured) */
  requiredProviders: ProviderName[];
  /** Whether all required providers are configured */
  available: boolean;
}

/**
 * Complete registry of all providers and cross-provider features
 */
export interface ProviderRegistryState {
  /** All provider statuses */
  providers: ProviderStatus[];
  /** Cross-provider features and their availability */
  features: CrossProviderFeature[];
}
