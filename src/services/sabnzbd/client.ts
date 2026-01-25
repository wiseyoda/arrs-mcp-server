/**
 * Sabnzbd API Client
 *
 * Uses query parameter authentication (apikey + output=json).
 * Unlike Sonarr/Radarr which use header-based auth.
 */

import { ApiError, NetworkError } from "../../shared/errors.js";
import type { ServiceConfig } from "../../config.js";
import type {
  QueueResponse,
  QueueInfo,
  HistoryResponse,
  HistoryInfo,
  HistorySlot,
  SimpleResponse,
  CategoriesResponse,
  ServerStatus,
} from "./types.js";

export class SabnzbdClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: ServiceConfig) {
    // Remove trailing slash from base URL
    this.baseUrl = config.url.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeout = 30000;
  }

  /**
   * Make a request to the Sabnzbd API with query parameter authentication
   */
  private async request<T>(mode: string, params: Record<string, string> = {}): Promise<T> {
    const searchParams = new URLSearchParams({
      mode,
      apikey: this.apiKey,
      output: "json",
      ...params,
    });

    const url = `${this.baseUrl}/api?${searchParams.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ApiError(
          `Sabnzbd API request failed: ${response.status} ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T) : (undefined as T);

      // Sabnzbd returns error in JSON body, not HTTP status
      if (data && typeof data === "object" && "error" in data) {
        const errorData = data as { error: string };
        throw new ApiError(`Sabnzbd API error: ${errorData.error}`, 400, JSON.stringify(data));
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new NetworkError(`Request timed out after ${this.timeout}ms`, url);
        }
        if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
          throw new NetworkError(`Cannot connect to Sabnzbd at ${this.baseUrl}`, url);
        }
        throw new NetworkError(error.message, url);
      }

      throw new NetworkError("Unknown network error", url);
    }
  }

  // Queue Operations

  /**
   * Get the current download queue
   */
  async getQueue(): Promise<QueueInfo> {
    const response = await this.request<QueueResponse>("queue");
    return response.queue;
  }

  /**
   * Get server status (simplified queue info)
   */
  async getServerStatus(): Promise<ServerStatus> {
    const queue = await this.getQueue();
    return {
      status: queue.status,
      speed: queue.speed,
      speedlimit: queue.speedlimit,
      paused: queue.paused,
      noofslots: queue.noofslots,
      timeleft: queue.timeleft,
      mb: queue.mb,
      mbleft: queue.mbleft,
    };
  }

  // History Operations

  /**
   * Get download history
   */
  async getHistory(limit: number = 50): Promise<HistoryInfo> {
    const response = await this.request<HistoryResponse>("history", {
      limit: String(limit),
    });
    return response.history;
  }

  /**
   * Get failed downloads from history
   */
  async getFailedDownloads(): Promise<HistorySlot[]> {
    const history = await this.getHistory(100);
    return history.slots.filter((item) => item.status === "Failed");
  }

  // Control Operations

  /**
   * Pause all downloads
   */
  async pause(): Promise<boolean> {
    const response = await this.request<SimpleResponse>("pause");
    return response.status;
  }

  /**
   * Resume all downloads
   */
  async resume(): Promise<boolean> {
    const response = await this.request<SimpleResponse>("resume");
    return response.status;
  }

  /**
   * Set speed limit in KB/s (0 = unlimited)
   */
  async setSpeedLimit(speedKBs: number): Promise<boolean> {
    const response = await this.request<SimpleResponse>("config", {
      name: "speedlimit",
      value: String(speedKBs),
    });
    return response.status;
  }

  // Item Operations

  /**
   * Pause a specific queue item
   */
  async pauseItem(nzoId: string): Promise<boolean> {
    const response = await this.request<SimpleResponse>("queue", {
      name: "pause",
      value: nzoId,
    });
    return response.status;
  }

  /**
   * Resume a specific queue item
   */
  async resumeItem(nzoId: string): Promise<boolean> {
    const response = await this.request<SimpleResponse>("queue", {
      name: "resume",
      value: nzoId,
    });
    return response.status;
  }

  /**
   * Delete a queue item
   */
  async deleteItem(nzoId: string): Promise<boolean> {
    const response = await this.request<SimpleResponse>("queue", {
      name: "delete",
      value: nzoId,
    });
    return response.status;
  }

  /**
   * Retry a failed download from history
   */
  async retry(nzoId: string): Promise<boolean> {
    const response = await this.request<SimpleResponse>("retry", {
      value: nzoId,
    });
    return response.status;
  }

  /**
   * Change queue item priority
   * Priority values: -100 (low), -50, 0 (normal), 50, 100 (high), 2 (force)
   */
  async setPriority(nzoId: string, priority: number): Promise<boolean> {
    const response = await this.request<SimpleResponse>("queue", {
      name: "priority",
      value: nzoId,
      value2: String(priority),
    });
    return response.status;
  }

  /**
   * Move item to top of queue (priority = 2 = force)
   */
  async moveToTop(nzoId: string): Promise<boolean> {
    return this.setPriority(nzoId, 2);
  }

  /**
   * Move item to bottom of queue (priority = -100 = low)
   */
  async moveToBottom(nzoId: string): Promise<boolean> {
    return this.setPriority(nzoId, -100);
  }

  // Categories

  /**
   * Get list of configured categories
   */
  async getCategories(): Promise<string[]> {
    const response = await this.request<CategoriesResponse>("get_cats");
    return response.categories;
  }

  // Utility

  /**
   * Find a queue item by nzo_id
   */
  async findQueueItem(nzoId: string): Promise<QueueInfo["slots"][0] | null> {
    const queue = await this.getQueue();
    return queue.slots.find((item) => item.nzo_id === nzoId) || null;
  }

  /**
   * Find a history item by nzo_id
   */
  async findHistoryItem(nzoId: string): Promise<HistorySlot | null> {
    const history = await this.getHistory(100);
    return history.slots.find((item) => item.nzo_id === nzoId) || null;
  }
}
