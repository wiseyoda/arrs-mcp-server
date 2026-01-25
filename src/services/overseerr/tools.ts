import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../../config.js";
import { OverseerrClient } from "./client.js";
import { formatErrorResponse } from "../../shared/errors.js";
import { RequestStatus } from "./types.js";
import type { DiscoverResult } from "./types.js";

function formatRequestStatus(status: number): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "Pending";
    case RequestStatus.APPROVED:
      return "Approved";
    case RequestStatus.DECLINED:
      return "Declined";
    case RequestStatus.AVAILABLE:
      return "Available";
    default:
      return `Unknown (${status})`;
  }
}

// Helper to fetch title from TMDB ID - API doesn't include titles in responses
async function fetchMediaTitle(
  client: OverseerrClient,
  tmdbId: number,
  mediaType: "movie" | "tv",
): Promise<string> {
  try {
    if (mediaType === "movie") {
      const movie = await client.getMovieDetails(tmdbId);
      return movie.title;
    } else {
      const tv = await client.getTvDetails(tmdbId);
      return tv.title;
    }
  } catch {
    return "Unknown";
  }
}

function formatDiscoverResult(item: DiscoverResult): string {
  const title = item.title || item.name || "Unknown";
  const type = item.mediaType === "movie" ? "Movie" : "TV";
  const date = item.releaseDate || item.firstAirDate || "TBD";
  const rating = item.voteAverage ? `${item.voteAverage.toFixed(1)}/10` : "N/A";

  return `${title} (${type}) - ${date}\n   TMDB ID: ${item.id} | Rating: ${rating}`;
}

export function registerOverseerrTools(
  server: McpServer,
  config: Config,
): void {
  if (!config.overseerr) {
    console.error("Overseerr not configured, skipping tool registration");
    return;
  }

  const client = new OverseerrClient(config.overseerr);

  // ============================================================
  // Semantic Tools (User-Facing)
  // ============================================================

  // request_list - List requests with filtering
  server.tool(
    "request_list",
    "List media requests from Overseerr with optional status filtering",
    {
      status: z
        .enum(["pending", "approved", "available", "declined", "all"])
        .optional()
        .describe("Filter by status. Default: all"),
      limit: z.coerce
        .number()
        .optional()
        .default(20)
        .describe("Maximum results to return. Default: 20"),
    },
    async ({ status, limit }) => {
      try {
        const filter = status && status !== "all" ? status : undefined;
        const page = await client.getRequests(filter, limit);

        if (page.results.length === 0) {
          const statusMsg = filter ? ` with status "${filter}"` : "";
          return {
            content: [{ type: "text", text: `No requests found${statusMsg}.` }],
          };
        }

        // Fetch titles for all requests in parallel
        const requestsWithTitles = await Promise.all(
          page.results.map(async (request) => {
            let title = "Unknown";
            try {
              if (request.type === "movie") {
                const movie = await client.getMovieDetails(request.media.tmdbId);
                title = movie.title;
              } else {
                const tv = await client.getTvDetails(request.media.tmdbId);
                title = tv.title;
              }
            } catch {
              // Fall back to Unknown if lookup fails
            }
            return { request, title };
          }),
        );

        const formatted = requestsWithTitles
          .map(({ request, title }) => {
            const type = request.type === "movie" ? "Movie" : "TV";
            const requestStatus = formatRequestStatus(request.status);
            const requester = request.requestedBy.displayName;
            const date = new Date(request.createdAt).toLocaleDateString();
            const tmdbId = request.media.tmdbId;

            return `[${request.id}] ${title} (${type}) - ${requestStatus}\n   Requested by: ${requester} on ${date}\n   TMDB ID: ${tmdbId}`;
          })
          .join("\n\n");

        const total = page.pageInfo.results;

        return {
          content: [
            {
              type: "text",
              text: `Found ${total} requests:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // request_approve - Approve a pending request
  server.tool(
    "request_approve",
    "Approve a pending media request. The media will be added to Sonarr/Radarr.",
    {
      request_id: z.coerce.number().describe("ID of the request to approve"),
    },
    async ({ request_id }) => {
      try {
        const request = await client.approveRequest(request_id);

        // Fetch title from media endpoint
        let title = "Unknown";
        try {
          if (request.type === "movie") {
            const movie = await client.getMovieDetails(request.media.tmdbId);
            title = movie.title;
          } else {
            const tv = await client.getTvDetails(request.media.tmdbId);
            title = tv.title;
          }
        } catch {
          // Fall back to Unknown if lookup fails
        }

        return {
          content: [
            {
              type: "text",
              text:
                `Approved request #${request_id} for "${title}".\n` +
                `The ${request.type} will be added to ${request.type === "movie" ? "Radarr" : "Sonarr"} and search will begin.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // request_decline - Decline a request with optional reason
  server.tool(
    "request_decline",
    "Decline a media request with an optional reason",
    {
      request_id: z.coerce.number().describe("ID of the request to decline"),
      reason: z
        .string()
        .max(500)
        .optional()
        .describe("Optional reason for declining (max 500 chars)"),
    },
    async ({ request_id, reason }) => {
      try {
        const request = await client.declineRequest(request_id);

        // Fetch title from media endpoint
        let title = "Unknown";
        try {
          if (request.type === "movie") {
            const movie = await client.getMovieDetails(request.media.tmdbId);
            title = movie.title;
          } else {
            const tv = await client.getTvDetails(request.media.tmdbId);
            title = tv.title;
          }
        } catch {
          // Fall back to Unknown if lookup fails
        }

        const reasonMsg = reason ? `\nReason: ${reason}` : "";

        return {
          content: [
            {
              type: "text",
              text: `Declined request #${request_id} for "${title}".${reasonMsg}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // ============================================================
  // Service-Specific Tools (Admin)
  // ============================================================

  // overseerr_request_details - Full request details
  server.tool(
    "overseerr_request_details",
    "Get detailed information about a specific request",
    {
      request_id: z.coerce.number().describe("ID of the request"),
    },
    async ({ request_id }) => {
      try {
        const request = await client.getRequest(request_id);
        const type = request.type === "movie" ? "Movie" : "TV Series";
        const status = formatRequestStatus(request.status);

        // Fetch title from media endpoint since request doesn't include it
        let title = "Unknown";
        try {
          if (request.type === "movie") {
            const movie = await client.getMovieDetails(request.media.tmdbId);
            title = movie.title;
          } else {
            const tv = await client.getTvDetails(request.media.tmdbId);
            title = tv.title;
          }
        } catch {
          // Fall back to Unknown if lookup fails
        }

        let output = `Request #${request.id}\n`;
        output += `Title: ${title}\n`;
        output += `Type: ${type}\n`;
        output += `Status: ${status}\n`;
        output += `TMDB ID: ${request.media.tmdbId}\n`;
        output += `Requested by: ${request.requestedBy.displayName}\n`;
        output += `Created: ${new Date(request.createdAt).toLocaleString()}\n`;
        output += `Updated: ${new Date(request.updatedAt).toLocaleString()}`;

        if (request.seasons && request.seasons.length > 0) {
          const seasonNums = request.seasons
            .map((s) => s.seasonNumber)
            .join(", ");
          output += `\nSeasons: ${seasonNums}`;
        }

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_request_delete - Delete a request (with confirmation)
  server.tool(
    "overseerr_request_delete",
    "Delete a request from Overseerr. Requires explicit confirmation.",
    {
      request_id: z.coerce.number().describe("ID of the request to delete"),
      confirm: z
        .boolean()
        .describe("Must be true to confirm deletion. Required for safety."),
    },
    async ({ request_id, confirm }) => {
      if (!confirm) {
        return {
          content: [
            {
              type: "text",
              text: "Deletion cancelled. Set confirm=true to delete the request.",
            },
          ],
        };
      }

      try {
        // Get request details first for confirmation message
        const request = await client.getRequest(request_id);

        // Fetch title from media endpoint
        let title = "Unknown";
        try {
          if (request.type === "movie") {
            const movie = await client.getMovieDetails(request.media.tmdbId);
            title = movie.title;
          } else {
            const tv = await client.getTvDetails(request.media.tmdbId);
            title = tv.title;
          }
        } catch {
          // Fall back to Unknown if lookup fails
        }

        await client.deleteRequest(request_id);

        return {
          content: [
            {
              type: "text",
              text: `Deleted request #${request_id} for "${title}".`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_users - List all users
  server.tool(
    "overseerr_users",
    "List all Overseerr users with request counts",
    {
      limit: z.coerce
        .number()
        .optional()
        .default(50)
        .describe("Maximum results to return. Default: 50"),
    },
    async ({ limit }) => {
      try {
        const page = await client.getUsers(limit);

        if (page.results.length === 0) {
          return {
            content: [{ type: "text", text: "No users found." }],
          };
        }

        const formatted = page.results
          .map(
            (user) =>
              `[${user.id}] ${user.displayName} (${user.email})\n   Requests: ${user.requestCount}`,
          )
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${page.pageInfo.results} users:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_user_requests - User's request history
  server.tool(
    "overseerr_user_requests",
    "View a specific user's request history",
    {
      user_id: z.coerce.number().describe("ID of the user"),
    },
    async ({ user_id }) => {
      try {
        const [user, requests] = await Promise.all([
          client.getUser(user_id),
          client.getUserRequests(user_id),
        ]);

        if (requests.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `${user.displayName} has no requests.`,
              },
            ],
          };
        }

        // Fetch titles for all requests in parallel
        const requestsWithTitles = await Promise.all(
          requests.map(async (request) => {
            const title = await fetchMediaTitle(
              client,
              request.media.tmdbId,
              request.type,
            );
            return { request, title };
          }),
        );

        const formatted = requestsWithTitles
          .map(({ request, title }) => {
            const type = request.type === "movie" ? "Movie" : "TV";
            const status = formatRequestStatus(request.status);
            const date = new Date(request.createdAt).toLocaleDateString();
            const tmdbId = request.media.tmdbId;

            return `[${request.id}] ${title} (${type}) - ${status}\n   Requested on ${date}\n   TMDB ID: ${tmdbId}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Requests by ${user.displayName}:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_user_quota - User quota info
  server.tool(
    "overseerr_user_quota",
    "Check a user's request quota and limits",
    {
      user_id: z.coerce.number().describe("ID of the user"),
    },
    async ({ user_id }) => {
      try {
        const [user, quota] = await Promise.all([
          client.getUser(user_id),
          client.getUserQuota(user_id),
        ]);

        let output = `Quota for ${user.displayName}:\n\n`;

        if (!quota.movie.restricted && !quota.tv.restricted) {
          output += "No quota restrictions configured.";
        } else {
          if (quota.movie.restricted) {
            output += `Movies: ${quota.movie.remaining}/${quota.movie.limit} remaining\n`;
          } else {
            output += "Movies: Unlimited\n";
          }

          if (quota.tv.restricted) {
            output += `TV Shows: ${quota.tv.remaining}/${quota.tv.limit} remaining`;
          } else {
            output += "TV Shows: Unlimited";
          }
        }

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_issues - List issues
  server.tool(
    "overseerr_issues",
    "List reported issues with optional status filtering",
    {
      status: z
        .enum(["open", "resolved", "all"])
        .optional()
        .describe("Filter by status. Default: all"),
      limit: z.coerce
        .number()
        .optional()
        .default(20)
        .describe("Maximum results to return. Default: 20"),
    },
    async ({ status, limit }) => {
      try {
        const filter = status && status !== "all" ? status : undefined;
        const page = await client.getIssues(filter, limit);

        if (page.results.length === 0) {
          const statusMsg = filter ? ` with status "${filter}"` : "";
          return {
            content: [{ type: "text", text: `No issues found${statusMsg}.` }],
          };
        }

        // Fetch titles for all issues in parallel
        const issuesWithTitles = await Promise.all(
          page.results.map(async (issue) => {
            const title = await fetchMediaTitle(
              client,
              issue.media.tmdbId,
              issue.media.mediaType,
            );
            return { issue, title };
          }),
        );

        const issueTypes: Record<number, string> = {
          1: "Video",
          2: "Audio",
          3: "Subtitles",
          4: "Other",
        };

        const formatted = issuesWithTitles
          .map(({ issue, title }) => {
            const type = issueTypes[issue.issueType] || "Unknown";
            const statusText = issue.status === 1 ? "Open" : "Resolved";
            const reporter = issue.createdBy.displayName;
            const date = new Date(issue.createdAt).toLocaleDateString();

            return `[${issue.id}] ${title} - ${type} Issue (${statusText})\n   Reported by: ${reporter} on ${date}\n   Comments: ${issue.comments.length}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${page.pageInfo.results} issues:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_issue_details - Issue details
  server.tool(
    "overseerr_issue_details",
    "Get detailed information about a specific issue",
    {
      issue_id: z.coerce.number().describe("ID of the issue"),
    },
    async ({ issue_id }) => {
      try {
        const issue = await client.getIssue(issue_id);
        const title = await fetchMediaTitle(
          client,
          issue.media.tmdbId,
          issue.media.mediaType,
        );
        const issueTypes: Record<number, string> = {
          1: "Video",
          2: "Audio",
          3: "Subtitles",
          4: "Other",
        };
        const type = issueTypes[issue.issueType] || "Unknown";
        const statusText = issue.status === 1 ? "Open" : "Resolved";

        let output = `Issue #${issue.id}\n`;
        output += `Media: ${title}\n`;
        output += `Type: ${type}\n`;
        output += `Status: ${statusText}\n`;
        output += `Reporter: ${issue.createdBy.displayName}\n`;
        output += `Created: ${new Date(issue.createdAt).toLocaleString()}\n`;

        if (issue.problemSeason) {
          output += `Problem Season: ${issue.problemSeason}`;
          if (issue.problemEpisode) {
            output += `, Episode: ${issue.problemEpisode}`;
          }
          output += "\n";
        }

        if (issue.comments.length > 0) {
          output += `\nComments (${issue.comments.length}):\n`;
          for (const comment of issue.comments) {
            const date = new Date(comment.createdAt).toLocaleString();
            output += `  [${comment.user.displayName}] ${date}\n`;
            output += `  ${comment.message}\n\n`;
          }
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

  // overseerr_issue_comment - Add comment to issue
  server.tool(
    "overseerr_issue_comment",
    "Add a comment to an issue",
    {
      issue_id: z.coerce.number().describe("ID of the issue"),
      comment: z.string().min(1).describe("Comment text to add"),
    },
    async ({ issue_id, comment }) => {
      try {
        const newComment = await client.addIssueComment(issue_id, comment);

        return {
          content: [
            {
              type: "text",
              text: `Added comment to issue #${issue_id}:\n"${newComment.message}"`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_issue_resolve - Resolve an issue
  server.tool(
    "overseerr_issue_resolve",
    "Mark an issue as resolved",
    {
      issue_id: z.coerce.number().describe("ID of the issue to resolve"),
    },
    async ({ issue_id }) => {
      try {
        const issue = await client.resolveIssue(issue_id);
        const title = await fetchMediaTitle(
          client,
          issue.media.tmdbId,
          issue.media.mediaType,
        );

        return {
          content: [
            {
              type: "text",
              text: `Resolved issue #${issue_id} for "${title}".`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_trending - Trending content
  server.tool(
    "overseerr_trending",
    "Get trending movies and TV shows",
    {
      type: z
        .enum(["movie", "tv", "all"])
        .optional()
        .describe("Filter by media type. Default: all"),
      limit: z.coerce
        .number()
        .optional()
        .default(10)
        .describe("Maximum results to return. Default: 10"),
    },
    async ({ type, limit }) => {
      try {
        const mediaType =
          type === "movie" ? "movie" : type === "tv" ? "tv" : undefined;
        const page = await client.getTrending(mediaType);

        if (page.results.length === 0) {
          return {
            content: [{ type: "text", text: "No trending content found." }],
          };
        }

        const results = page.results.slice(0, limit);
        const formatted = results.map(formatDiscoverResult).join("\n\n");
        const typeLabel =
          type === "all" ? "content" : type === "tv" ? "TV shows" : "movies";

        return {
          content: [
            {
              type: "text",
              text: `Trending ${typeLabel}:\n\n${formatted}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    },
  );

  // overseerr_upcoming - Upcoming movies
  server.tool(
    "overseerr_upcoming",
    "Get upcoming movie releases",
    {
      limit: z.coerce
        .number()
        .optional()
        .default(10)
        .describe("Maximum results to return. Default: 10"),
    },
    async ({ limit }) => {
      try {
        const page = await client.getUpcoming();

        if (page.results.length === 0) {
          return {
            content: [{ type: "text", text: "No upcoming movies found." }],
          };
        }

        const results = page.results.slice(0, limit);
        const formatted = results.map(formatDiscoverResult).join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Upcoming movies:\n\n${formatted}`,
            },
          ],
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
