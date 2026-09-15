import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { ConfigError } from "./shared/errors.js";

export interface ServiceConfig {
  url: string;
  apiKey: string;
}

export interface PlexConfig {
  url: string;
  token: string;
}

export interface TmdbConfig {
  apiKey: string;
}

export interface Config {
  sonarr?: ServiceConfig;
  radarr?: ServiceConfig;
  radarr4k?: ServiceConfig;
  plex?: PlexConfig;
  sabnzbd?: ServiceConfig;
  overseerr?: ServiceConfig;
  tmdb?: TmdbConfig;
}

// Seerr is normalized to the historical internal provider key so tool names remain stable.
const serviceNames = [
  "sonarr",
  "radarr",
  "radarr4k",
  "plex",
  "sabnzbd",
  "overseerr",
  "tmdb",
] as const;
const secret = z.string().trim().min(1);
const url = z
  .string()
  .url()
  .refine((value) => {
    const parsed = new URL(value);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      !parsed.username &&
      !parsed.password &&
      !parsed.search &&
      !parsed.hash
    );
  }, "Use an HTTP(S) base URL without credentials, query, or fragment")
  .transform((value) => value.replace(/\/+$/, ""));
const serviceSchema = z.object({ url, apiKey: secret });
const schemas = {
  sonarr: serviceSchema,
  radarr: serviceSchema,
  radarr4k: serviceSchema,
  plex: z.object({ url, token: secret }),
  sabnzbd: serviceSchema,
  overseerr: serviceSchema,
  tmdb: z.object({ apiKey: secret }),
};

function fileConfig(): Record<string, unknown> {
  const path = process.env.CONFIG_PATH || join(process.cwd(), "config.json");
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch (error) {
    if (
      !process.env.CONFIG_PATH &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    )
      return {};
    throw new ConfigError("Cannot read configuration file.");
  }
  try {
    const parsed: unknown = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    // JSON parser errors can contain excerpts of credentials; do not log them.
    throw new ConfigError(
      "Configuration file must contain a valid JSON object.",
    );
  }
}

export function loadConfig(): Config {
  const file = fileConfig();
  const config: Config = {};
  for (const name of serviceNames) {
    const prefix = name.toUpperCase();
    const credential = name === "plex" ? "token" : "apiKey";
    const credentialEnv = name === "plex" ? "TOKEN" : "API_KEY";
    const base =
      name === "overseerr" ? (file.seerr ?? file.overseerr) : file[name];
    let envUrl = process.env[`${prefix}_URL`];
    let envSecret = process.env[`${prefix}_${credentialEnv}`];
    if (name === "overseerr") {
      envUrl = process.env.SEERR_URL ?? envUrl;
      envSecret = process.env.SEERR_API_KEY ?? envSecret;
    }
    if (base === undefined && envUrl === undefined && envSecret === undefined)
      continue;
    if (
      base !== undefined &&
      (!base || typeof base !== "object" || Array.isArray(base))
    ) {
      throw new ConfigError(
        `Invalid ${name} configuration: expected an object.`,
      );
    }
    const merged = {
      ...(base as Record<string, unknown> | undefined),
      ...(envUrl !== undefined ? { url: envUrl } : {}),
      ...(envSecret !== undefined ? { [credential]: envSecret } : {}),
    };
    const result = schemas[name].safeParse(merged);
    if (!result.success) {
      throw new ConfigError(
        `Invalid ${name} configuration: check ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}.`,
      );
    }
    Object.assign(config, { [name]: result.data });
  }
  if (Object.keys(config).length === 0)
    throw new ConfigError(
      "No services configured. Set service environment variables or create config.json; see config.example.json.",
    );
  console.error("Configured services:", Object.keys(config).join(", "));
  return config;
}
