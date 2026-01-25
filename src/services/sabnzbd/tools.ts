/**
 * Sabnzbd MCP Tools
 *
 * Semantic tools (downloads_*) for common operations
 * Admin tools (sabnzbd_*) for troubleshooting
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "../../config.js";
import { SabnzbdClient } from "./client.js";
import { formatErrorResponse } from "../../shared/errors.js";
import {
  formatSpeed,
  formatEta,
  formatMb,
  formatSize,
  getSourceFromCategory,
  type QueueSlot,
  type HistorySlot,
} from "./types.js";

function formatQueueSlot(item: QueueSlot): string {
  const progress = parseInt(item.percentage, 10) || 0;
  const source = getSourceFromCategory(item.cat);
  const size = formatMb(item.mb);
  const sizeLeft = formatMb(item.mbleft);
  const eta = formatEta(item.timeleft);

  return (
    `${item.filename}\n` +
    `  ID: ${item.nzo_id}\n` +
    `  Progress: ${progress}% (${sizeLeft} / ${size}) | ETA: ${eta}\n` +
    `  Status: ${item.status} | Category: ${item.cat} [${source}]`
  );
}

function formatHistorySlot(item: HistorySlot): string {
  const size = formatSize(item.bytes);
  const source = getSourceFromCategory(item.category);
  const completedDate = new Date(item.completed * 1000).toLocaleString();
  const failed = item.status === "Failed" ? `\n  Error: ${item.fail_message}` : "";

  return (
    `${item.name}\n` +
    `  ID: ${item.nzo_id}\n` +
    `  Status: ${item.status} | Size: ${size}\n` +
    `  Category: ${item.category} [${source}] | Completed: ${completedDate}${failed}`
  );
}

export function registerSabnzbdTools(server: McpServer, config: Config): void {
  if (!config.sabnzbd) {
    console.error("Sabnzbd not configured, skipping tool registration");
    return;
  }

  const client = new SabnzbdClient(config.sabnzbd);

  // ============================================================
  // Semantic Tools (User-Facing)
  // ============================================================

  // downloads_queue - View current download queue
  server.tool(
    "downloads_queue",
    "View the current Sabnzbd download queue with progress and details",
    async () => {
      try {
        const queue = await client.getQueue();

        if (queue.slots.length === 0) {
          const status = queue.paused ? "Paused" : "Idle";
          return {
            content: [
              {
                type: "text",
                text: `No active downloads. Queue status: ${status}`,
              },
            ],
          };
        }

        const speed = formatSpeed(queue.speed);
        const totalEta = formatEta(queue.timeleft);
        const totalSize = formatMb(queue.mb);
        const sizeLeft = formatMb(queue.mbleft);

        let output = `Download Queue (${queue.slots.length} items)\n`;
        output += `Speed: ${speed} | Total: ${sizeLeft} / ${totalSize} | ETA: ${totalEta}\n`;
        output += queue.paused ? "Status: PAUSED\n" : "";
        output += "\n";

        output += queue.slots.map(formatQueueSlot).join("\n\n");

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // downloads_history - View download history
  server.tool(
    "downloads_history",
    "View recent download history including completed and failed items",
    {
      limit: z.coerce
        .number()
        .optional()
        .describe("Number of history items to show (default: 20)"),
    },
    async ({ limit }) => {
      try {
        const history = await client.getHistory(limit || 20);

        if (history.slots.length === 0) {
          return {
            content: [{ type: "text", text: "No download history." }],
          };
        }

        let output = `Download History (${history.slots.length} items)\n`;
        output += `Today: ${history.day_size} | Week: ${history.week_size} | Total: ${history.total_size}\n\n`;

        output += history.slots.map(formatHistorySlot).join("\n\n");

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // downloads_pause - Pause all downloads
  server.tool("downloads_pause", "Pause all Sabnzbd downloads", async () => {
    try {
      await client.pause();
      const queue = await client.getQueue();

      return {
        content: [
          {
            type: "text",
            text: `Downloads paused. ${queue.noofslots} items in queue.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatErrorResponse(error) }],
        isError: true,
      };
    }
  });

  // downloads_resume - Resume all downloads
  server.tool("downloads_resume", "Resume all Sabnzbd downloads", async () => {
    try {
      await client.resume();
      // Give Sabnzbd a moment to start and report speed
      await new Promise((resolve) => setTimeout(resolve, 500));
      const queue = await client.getQueue();
      const speed = formatSpeed(queue.speed);

      return {
        content: [
          {
            type: "text",
            text: `Downloads resumed. Speed: ${speed}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: formatErrorResponse(error) }],
        isError: true,
      };
    }
  });

  // downloads_speed - Set speed limit
  server.tool(
    "downloads_speed",
    "Set Sabnzbd download speed limit in MB/s, or set unlimited",
    {
      speed: z.coerce
        .number()
        .optional()
        .describe("Speed limit in MB/s (e.g., 10 for 10 MB/s)"),
      unlimited: z.boolean().optional().describe("Set to true to remove speed limit"),
    },
    async ({ speed, unlimited }) => {
      try {
        if (unlimited) {
          await client.setSpeedLimit(0);
          return {
            content: [{ type: "text", text: "Speed limit removed. Downloading at full speed." }],
          };
        }

        if (speed === undefined || speed < 0) {
          return {
            content: [
              {
                type: "text",
                text: "Please specify a speed in MB/s (e.g., speed: 10) or use unlimited: true",
              },
            ],
            isError: true,
          };
        }

        // Convert MB/s to KB/s for Sabnzbd API
        const speedKBs = Math.round(speed * 1024);
        await client.setSpeedLimit(speedKBs);

        return {
          content: [{ type: "text", text: `Speed limit set to ${speed} MB/s` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // ============================================================
  // Admin Tools (Service-Specific)
  // ============================================================

  // sabnzbd_delete - Delete a queue item
  server.tool(
    "sabnzbd_delete",
    "Remove an item from the Sabnzbd download queue",
    {
      nzo_id: z.string().describe("The nzo_id of the item to delete (from downloads_queue)"),
    },
    async ({ nzo_id }) => {
      try {
        // Find the item first to get its name
        const item = await client.findQueueItem(nzo_id);
        const itemName = item?.filename || nzo_id;

        await client.deleteItem(nzo_id);

        return {
          content: [{ type: "text", text: `Deleted "${itemName}" from queue.` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // sabnzbd_failed - List failed downloads
  server.tool(
    "sabnzbd_failed",
    "List failed downloads from history for investigation",
    async () => {
      try {
        const failed = await client.getFailedDownloads();

        if (failed.length === 0) {
          return {
            content: [{ type: "text", text: "No failed downloads." }],
          };
        }

        let output = `Failed Downloads (${failed.length} items)\n\n`;
        output += failed.map(formatHistorySlot).join("\n\n");

        return {
          content: [{ type: "text", text: output }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // sabnzbd_retry - Retry a failed download
  server.tool(
    "sabnzbd_retry",
    "Retry a failed download from history",
    {
      nzo_id: z.string().describe("The nzo_id of the failed item to retry (from sabnzbd_failed)"),
    },
    async ({ nzo_id }) => {
      try {
        // Find the item first to get its name
        const item = await client.findHistoryItem(nzo_id);
        if (!item) {
          return {
            content: [{ type: "text", text: `Could not find item with ID ${nzo_id} in history.` }],
            isError: true,
          };
        }

        if (item.status !== "Failed") {
          return {
            content: [
              {
                type: "text",
                text: `Item "${item.name}" is not failed (status: ${item.status}). Only failed items can be retried.`,
              },
            ],
            isError: true,
          };
        }

        await client.retry(nzo_id);

        return {
          content: [{ type: "text", text: `Retrying "${item.name}". Added to queue.` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // sabnzbd_priority - Change queue item priority
  server.tool(
    "sabnzbd_priority",
    "Change the priority of a queue item (move to top/bottom or set priority level)",
    {
      nzo_id: z.string().describe("The nzo_id of the item to prioritize (from downloads_queue)"),
      position: z
        .enum(["top", "bottom", "high", "normal", "low"])
        .describe("Where to move the item: top, bottom, or priority level (high/normal/low)"),
    },
    async ({ nzo_id, position }) => {
      try {
        // Find the item first to get its name
        const item = await client.findQueueItem(nzo_id);
        const itemName = item?.filename || nzo_id;

        if (position === "top") {
          await client.moveToTop(nzo_id);
        } else if (position === "bottom") {
          await client.moveToBottom(nzo_id);
        } else {
          const priorityMap: Record<string, number> = {
            high: 100,
            normal: 0,
            low: -100,
          };
          await client.setPriority(nzo_id, priorityMap[position]);
        }

        return {
          content: [{ type: "text", text: `Moved "${itemName}" to ${position} of queue.` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // sabnzbd_pause_item - Pause a specific item
  server.tool(
    "sabnzbd_pause_item",
    "Pause a specific item in the download queue",
    {
      nzo_id: z.string().describe("The nzo_id of the item to pause (from downloads_queue)"),
    },
    async ({ nzo_id }) => {
      try {
        const item = await client.findQueueItem(nzo_id);
        const itemName = item?.filename || nzo_id;

        await client.pauseItem(nzo_id);

        return {
          content: [{ type: "text", text: `Paused "${itemName}".` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // sabnzbd_resume_item - Resume a specific item
  server.tool(
    "sabnzbd_resume_item",
    "Resume a specific paused item in the download queue",
    {
      nzo_id: z.string().describe("The nzo_id of the item to resume (from downloads_queue)"),
    },
    async ({ nzo_id }) => {
      try {
        const item = await client.findQueueItem(nzo_id);
        const itemName = item?.filename || nzo_id;

        await client.resumeItem(nzo_id);

        return {
          content: [{ type: "text", text: `Resumed "${itemName}".` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: formatErrorResponse(error) }],
          isError: true,
        };
      }
    }
  );

  // sabnzbd_categories - List categories
  server.tool("sabnzbd_categories", "List configured Sabnzbd download categories", async () => {
    try {
      const categories = await client.getCategories();

      if (categories.length === 0) {
        return {
          content: [{ type: "text", text: "No categories configured." }],
        };
      }

      let output = `Download Categories (${categories.length}):\n\n`;
      for (const cat of categories) {
        const source = getSourceFromCategory(cat);
        output += `  - ${cat}${source !== "unknown" ? ` → ${source}` : ""}\n`;
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
  });
}
