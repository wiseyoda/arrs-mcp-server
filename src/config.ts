import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface ServiceConfig {
  url: string;
  apiKey: string;
}

export interface PlexConfig {
  url: string;
  token: string;
}

export interface Config {
  sonarr?: ServiceConfig;
  radarr?: ServiceConfig;
  radarr4k?: ServiceConfig;
  plex?: PlexConfig;
  sabnzbd?: ServiceConfig;
}

function getEnvConfig(): Partial<Config> {
  const config: Partial<Config> = {};

  // Sonarr
  if (process.env.SONARR_URL && process.env.SONARR_API_KEY) {
    config.sonarr = {
      url: process.env.SONARR_URL,
      apiKey: process.env.SONARR_API_KEY,
    };
  }

  // Radarr
  if (process.env.RADARR_URL && process.env.RADARR_API_KEY) {
    config.radarr = {
      url: process.env.RADARR_URL,
      apiKey: process.env.RADARR_API_KEY,
    };
  }

  // Radarr4k
  if (process.env.RADARR4K_URL && process.env.RADARR4K_API_KEY) {
    config.radarr4k = {
      url: process.env.RADARR4K_URL,
      apiKey: process.env.RADARR4K_API_KEY,
    };
  }

  // Plex
  if (process.env.PLEX_URL && process.env.PLEX_TOKEN) {
    config.plex = {
      url: process.env.PLEX_URL,
      token: process.env.PLEX_TOKEN,
    };
  }

  // Sabnzbd
  if (process.env.SABNZBD_URL && process.env.SABNZBD_API_KEY) {
    config.sabnzbd = {
      url: process.env.SABNZBD_URL,
      apiKey: process.env.SABNZBD_API_KEY,
    };
  }

  return config;
}

function getFileConfig(): Partial<Config> {
  const configPath =
    process.env.CONFIG_PATH || join(process.cwd(), "config.json");

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content) as Partial<Config>;
  } catch (error) {
    console.error(
      `Warning: Failed to parse config file at ${configPath}:`,
      error,
    );
    return {};
  }
}

function mergeConfigs(
  fileConfig: Partial<Config>,
  envConfig: Partial<Config>,
): Config {
  // Environment variables take precedence over file config
  return {
    sonarr: envConfig.sonarr || fileConfig.sonarr,
    radarr: envConfig.radarr || fileConfig.radarr,
    radarr4k: envConfig.radarr4k || fileConfig.radarr4k,
    plex: envConfig.plex || fileConfig.plex,
    sabnzbd: envConfig.sabnzbd || fileConfig.sabnzbd,
  };
}

function validateConfig(config: Config): void {
  const configuredServices: string[] = [];
  const missingServices: string[] = [];

  if (config.sonarr?.url && config.sonarr?.apiKey) {
    configuredServices.push("Sonarr");
  } else if (config.sonarr?.url || config.sonarr?.apiKey) {
    missingServices.push("Sonarr (incomplete - need both url and apiKey)");
  }

  if (config.radarr?.url && config.radarr?.apiKey) {
    configuredServices.push("Radarr");
  }

  if (config.radarr4k?.url && config.radarr4k?.apiKey) {
    configuredServices.push("Radarr4k");
  }

  if (config.plex?.url && config.plex?.token) {
    configuredServices.push("Plex");
  }

  if (config.sabnzbd?.url && config.sabnzbd?.apiKey) {
    configuredServices.push("Sabnzbd");
  }

  if (configuredServices.length === 0) {
    throw new Error(
      "No services configured. Please set environment variables " +
        "(SONARR_URL, SONARR_API_KEY, etc.) or create a config.json file. " +
        "See config.example.json for the expected format.",
    );
  }

  if (missingServices.length > 0) {
    console.error(
      "Warning: Some services have incomplete configuration:",
      missingServices,
    );
  }

  console.error("Configured services:", configuredServices.join(", "));
}

export function loadConfig(): Config {
  const fileConfig = getFileConfig();
  const envConfig = getEnvConfig();
  const config = mergeConfigs(fileConfig, envConfig);

  validateConfig(config);

  return config;
}
