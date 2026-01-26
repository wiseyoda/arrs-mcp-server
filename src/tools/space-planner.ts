/**
 * Space Planner Tool
 *
 * Smart cleanup recommendations based on file size, watch age, and content rating.
 * Formula: score = (size_gb × days_since_watched) / (rating × rewatch_factor)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../config.js";
import type { ProviderRegistry } from "../providers/index.js";
import { PlexClient } from "../services/plex/client.js";
import { formatErrorResponse } from "../shared/errors.js";
import type { PlexMediaItem } from "../services/plex/types.js";

// ============================================================================
// Types (T017)
// ============================================================================

interface CleanupCandidate {
  id: string;
  title: string;
  year?: number;
  type: "movie" | "show";
  sizeBytes: number;
  sizeGb: number;
  lastWatched?: Date;
  daysSinceWatched: number;
  rating: number;
  score: number;
  reason: string;
}

interface SpacePlannerResult {
  targetGb: number;
  recommendations: CleanupCandidate[];
  runningTotalGb: number;
  summary: {
    totalCandidates: number;
    totalSizeGb: number;
    moviesCount: number;
    showsCount: number;
  };
}

// ============================================================================
// Scoring Formula (T017)
// ============================================================================

const DEFAULT_RATING = 5.0; // Used when no rating available
const REWATCH_FACTOR = 1.0; // Could be enhanced to detect rewatchable content
const NEVER_WATCHED_DAYS = 365 * 5; // Treat never-watched as 5 years old

/**
 * Calculate cleanup score for an item.
 * Higher score = better deletion candidate.
 *
 * Formula: (size_gb × days_since_watched) / (rating × rewatch_factor)
 */
function calculateCleanupScore(
  sizeGb: number,
  daysSinceWatched: number,
  rating: number,
): number {
  const effectiveRating = Math.max(rating, 1); // Avoid division by zero
  return (sizeGb * daysSinceWatched) / (effectiveRating * REWATCH_FACTOR);
}

/**
 * Determine reason for cleanup recommendation
 */
function getCleanupReason(
  sizeGb: number,
  daysSinceWatched: number,
  rating: number,
  neverWatched: boolean,
): string {
  const reasons: string[] = [];

  if (sizeGb > 20) {
    reasons.push("large file");
  } else if (sizeGb > 10) {
    reasons.push("medium file");
  }

  if (neverWatched) {
    reasons.push("never watched");
  } else if (daysSinceWatched > 365 * 2) {
    reasons.push("watched 2+ years ago");
  } else if (daysSinceWatched > 365) {
    reasons.push("watched 1+ year ago");
  }

  if (rating < 5) {
    reasons.push("low rating");
  } else if (rating < 6) {
    reasons.push("below average rating");
  }

  return reasons.length > 0 ? reasons.join(", ") : "cleanup candidate";
}

// ============================================================================
// Data Collection (T018)
// ============================================================================

function getItemSize(item: PlexMediaItem): number {
  if (!item.Media || item.Media.length === 0) return 0;
  return item.Media.reduce((total, media) => {
    if (!media.Part) return total;
    return (
      total + media.Part.reduce((sum, part) => sum + (part.size || 0), 0)
    );
  }, 0);
}

function getItemRating(item: PlexMediaItem): number {
  // Prefer audience rating, fall back to critic rating, then default
  if (item.audienceRating) return item.audienceRating;
  if (item.rating) return item.rating;
  return DEFAULT_RATING;
}

async function collectCandidates(
  plexClient: PlexClient,
  type: "all" | "movies" | "shows",
): Promise<CleanupCandidate[]> {
  const candidates: CleanupCandidate[] = [];
  const libraries = await plexClient.getLibraries();
  const now = new Date();

  // Filter libraries by type
  const targetLibraries = libraries.filter((lib) => {
    if (type === "movies") return lib.type === "movie";
    if (type === "shows") return lib.type === "show";
    return lib.type === "movie" || lib.type === "show";
  });

  for (const lib of targetLibraries) {
    const { items } = await plexClient.getLibraryItems(lib.key, {
      size: 10000,
    });

    for (const item of items) {
      const sizeBytes = getItemSize(item);
      if (sizeBytes === 0) continue; // Skip items without size info

      const sizeGb = sizeBytes / (1024 * 1024 * 1024);
      const rating = getItemRating(item);

      // Calculate days since watched
      let daysSinceWatched: number;
      let neverWatched = false;
      let lastWatched: Date | undefined;

      if (item.lastViewedAt) {
        lastWatched = new Date(item.lastViewedAt * 1000);
        daysSinceWatched = Math.floor(
          (now.getTime() - lastWatched.getTime()) / (1000 * 60 * 60 * 24),
        );
      } else {
        // Never watched - use addedAt as fallback
        neverWatched = true;
        const addedAt = new Date(item.addedAt * 1000);
        daysSinceWatched = Math.floor(
          (now.getTime() - addedAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        // Cap at NEVER_WATCHED_DAYS for scoring purposes
        daysSinceWatched = Math.min(daysSinceWatched, NEVER_WATCHED_DAYS);
      }

      const score = calculateCleanupScore(sizeGb, daysSinceWatched, rating);
      const reason = getCleanupReason(
        sizeGb,
        daysSinceWatched,
        rating,
        neverWatched,
      );

      candidates.push({
        id: `plex:${item.ratingKey}`,
        title: item.title,
        year: item.year,
        type: lib.type === "movie" ? "movie" : "show",
        sizeBytes,
        sizeGb,
        lastWatched,
        daysSinceWatched,
        rating,
        score,
        reason,
      });
    }
  }

  return candidates;
}

// ============================================================================
// Tool Registration (T019, T020)
// ============================================================================

export function registerSpacePlannerTool(
  server: McpServer,
  config: Config,
  _registry: ProviderRegistry,
): void {
  server.tool(
    "space_planner",
    "Get smart cleanup recommendations based on file size, watch age, and rating. " +
      "Items are scored using: (size_gb × days_since_watched) / (rating × rewatch_factor). " +
      "Higher scores = better deletion candidates (large, old, low-rated items first).",
    {
      target_gb: z
        .number()
        .positive()
        .describe("Target space to free up in GB"),
      type: z
        .enum(["all", "movies", "shows"])
        .optional()
        .default("all")
        .describe('Content type: "all", "movies", or "shows"'),
      exclude_favorites: z
        .boolean()
        .optional()
        .default(false)
        .describe("Exclude items rated 8+ from recommendations"),
    },
    async ({ target_gb, type, exclude_favorites }) => {
      try {
        if (!config.plex) {
          return {
            content: [
              {
                type: "text",
                text: "Plex is required for space planning. Configure Plex in your settings.",
              },
            ],
            isError: true,
          };
        }

        const plexClient = new PlexClient(config.plex);

        // Collect all candidates
        let candidates = await collectCandidates(plexClient, type);

        // Filter out favorites if requested
        if (exclude_favorites) {
          candidates = candidates.filter((c) => c.rating < 8);
        }

        // Sort by score (highest first = best deletion candidates)
        candidates.sort((a, b) => b.score - a.score);

        // Build recommendations until we hit target
        const result: SpacePlannerResult = {
          targetGb: target_gb,
          recommendations: [],
          runningTotalGb: 0,
          summary: {
            totalCandidates: candidates.length,
            totalSizeGb: candidates.reduce((sum, c) => sum + c.sizeGb, 0),
            moviesCount: candidates.filter((c) => c.type === "movie").length,
            showsCount: candidates.filter((c) => c.type === "show").length,
          },
        };

        for (const candidate of candidates) {
          if (result.runningTotalGb >= target_gb) {
            break;
          }
          result.recommendations.push(candidate);
          result.runningTotalGb += candidate.sizeGb;
        }

        // Format output
        let output = `# Space Planner Recommendations\n\n`;
        output += `**Target**: ${target_gb.toFixed(1)} GB | `;
        output += `**Type**: ${type}\n`;
        output += `**Analyzed**: ${result.summary.totalCandidates} items `;
        output += `(${result.summary.moviesCount} movies, ${result.summary.showsCount} shows) `;
        output += `totaling ${result.summary.totalSizeGb.toFixed(1)} GB\n\n`;

        if (result.recommendations.length === 0) {
          output += "No cleanup candidates found.\n";
        } else {
          output += `## Top ${result.recommendations.length} Recommendations\n\n`;
          output += `| # | Title | Year | Size | Last Watched | Rating | Score | Reason |\n`;
          output += `|---|-------|------|------|--------------|--------|-------|--------|\n`;

          let runningTotal = 0;
          for (let i = 0; i < result.recommendations.length; i++) {
            const rec = result.recommendations[i];
            runningTotal += rec.sizeGb;

            const lastWatchedStr = rec.lastWatched
              ? rec.lastWatched.toISOString().split("T")[0]
              : "never";

            output += `| ${i + 1} | ${rec.title} | ${rec.year || "N/A"} | `;
            output += `${rec.sizeGb.toFixed(1)} GB | ${lastWatchedStr} | `;
            output += `${rec.rating.toFixed(1)} | ${rec.score.toFixed(0)} | ${rec.reason} |\n`;
          }

          output += `\n**Running Total**: ${result.runningTotalGb.toFixed(1)} GB`;

          if (result.runningTotalGb >= target_gb) {
            output += ` (target reached)\n`;
          } else {
            output += ` (${(target_gb - result.runningTotalGb).toFixed(1)} GB short of target)\n`;
          }

          // Show scoring explanation
          output += `\n---\n\n`;
          output += `**Scoring Formula**: (size_gb × days_since_watched) / (rating × rewatch_factor)\n`;
          output += `Higher scores indicate better cleanup candidates.\n`;
        }

        return {
          content: [{ type: "text", text: output.trim() }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );
}
