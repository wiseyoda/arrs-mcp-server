import { HttpClient } from "../../shared/http.js";
import type { PlexConfig } from "../../config.js";
import type {
  PlexLibrary,
  PlexMediaItem,
  PlexMediaContainer,
  PlexServerIdentity,
  LibraryInfo,
  MediaItemInfo,
} from "./types.js";

export class PlexClient {
  private http: HttpClient;

  constructor(config: PlexConfig) {
    this.http = new HttpClient({
      baseUrl: config.url.replace(/\/$/, ""),
      headers: {
        Accept: "application/json",
        "X-Plex-Token": config.token,
      },
      serviceName: "Plex",
    });
  }

  // Server operations

  async getServerIdentity(): Promise<PlexServerIdentity> {
    return this.http.get<PlexServerIdentity>("/");
  }

  // Library operations

  async getLibraries(): Promise<LibraryInfo[]> {
    const response =
      await this.http.get<PlexMediaContainer<PlexLibrary>>("/library/sections");
    const directories = response.MediaContainer.Directory || [];
    return directories.map((lib) => ({
      key: lib.key,
      title: lib.title,
      type: lib.type,
    }));
  }

  async getLibraryItems(
    libraryKey: string,
    options: {
      start?: number;
      size?: number;
    } = {},
  ): Promise<{ items: PlexMediaItem[]; totalSize: number }> {
    const params = new URLSearchParams();
    if (options.start !== undefined) {
      params.set("X-Plex-Container-Start", String(options.start));
    }
    if (options.size !== undefined) {
      params.set("X-Plex-Container-Size", String(options.size));
    }
    const query = params.toString();
    const path = `/library/sections/${libraryKey}/all${query ? `?${query}` : ""}`;
    const response =
      await this.http.get<PlexMediaContainer<PlexMediaItem>>(path);
    return {
      items: response.MediaContainer.Metadata || [],
      totalSize:
        response.MediaContainer.totalSize || response.MediaContainer.size,
    };
  }

  async getUnwatchedItems(libraryKey: string): Promise<PlexMediaItem[]> {
    const response = await this.http.get<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${libraryKey}/unwatched`,
    );
    return response.MediaContainer.Metadata || [];
  }

  async getRecentlyAdded(
    libraryKey: string,
    limit: number = 50,
  ): Promise<PlexMediaItem[]> {
    const response = await this.http.get<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${libraryKey}/newest?X-Plex-Container-Size=${limit}`,
    );
    return response.MediaContainer.Metadata || [];
  }

  // Search operations

  async searchAll(query: string): Promise<Map<string, PlexMediaItem[]>> {
    const response = await this.http.get<PlexMediaContainer<PlexMediaItem>>(
      `/hubs/search?query=${encodeURIComponent(query)}`,
    );
    const results = new Map<string, PlexMediaItem[]>();
    const hubs = response.MediaContainer.Hub || [];
    for (const hub of hubs) {
      if (hub.Metadata && hub.Metadata.length > 0) {
        results.set(hub.title, hub.Metadata);
      }
    }
    return results;
  }

  async searchLibrary(
    libraryKey: string,
    query: string,
  ): Promise<PlexMediaItem[]> {
    const response = await this.http.get<PlexMediaContainer<PlexMediaItem>>(
      `/library/sections/${libraryKey}/all?title=${encodeURIComponent(query)}`,
    );
    return response.MediaContainer.Metadata || [];
  }

  // Item operations

  async getItem(ratingKey: string): Promise<PlexMediaItem | null> {
    try {
      const response = await this.http.get<PlexMediaContainer<PlexMediaItem>>(
        `/library/metadata/${ratingKey}`,
      );
      const items = response.MediaContainer.Metadata || [];
      return items.length > 0 ? items[0] : null;
    } catch {
      return null;
    }
  }

  async deleteItem(ratingKey: string): Promise<void> {
    await this.http.delete<void>(`/library/metadata/${ratingKey}`);
  }

  // Library management

  async refreshLibrary(libraryKey: string): Promise<void> {
    await this.http.get<void>(`/library/sections/${libraryKey}/refresh`);
  }

  async refreshAllLibraries(): Promise<void> {
    const libraries = await this.getLibraries();
    for (const library of libraries) {
      await this.refreshLibrary(library.key);
    }
  }

  // Utility methods

  async getLibraryByName(name: string): Promise<LibraryInfo | null> {
    const libraries = await this.getLibraries();
    const lowerName = name.toLowerCase();
    return (
      libraries.find((lib) => lib.title.toLowerCase() === lowerName) || null
    );
  }

  parseMediaItem(item: PlexMediaItem, libraryTitle: string): MediaItemInfo {
    let sizeBytes: number | undefined;
    let videoResolution: string | undefined;
    let videoCodec: string | undefined;
    let audioCodec: string | undefined;
    let audioChannels: number | undefined;

    if (item.Media && item.Media.length > 0) {
      const media = item.Media[0];
      videoResolution = media.videoResolution;
      videoCodec = media.videoCodec;
      audioCodec = media.audioCodec;
      audioChannels = media.audioChannels;
      if (media.Part && media.Part.length > 0) {
        sizeBytes = media.Part.reduce((sum, part) => sum + (part.size || 0), 0);
      }
    }

    return {
      ratingKey: item.ratingKey,
      title: item.title,
      year: item.year,
      library: libraryTitle,
      type: item.type,
      watched: (item.viewCount || 0) > 0,
      viewCount: item.viewCount || 0,
      lastViewedAt: item.lastViewedAt
        ? new Date(item.lastViewedAt * 1000)
        : undefined,
      addedAt: new Date(item.addedAt * 1000),
      sizeBytes,
      // Enhanced fields
      rating: item.rating,
      audienceRating: item.audienceRating,
      contentRating: item.contentRating,
      duration: item.duration,
      studio: item.studio,
      summary: item.summary,
      tagline: item.tagline,
      originallyAvailableAt: item.originallyAvailableAt,
      genres: item.Genre?.map((g) => g.tag),
      countries: item.Country?.map((c) => c.tag),
      directors: item.Director?.map((d) => d.tag),
      actors: item.Role?.map((r) => r.tag),
      videoResolution,
      videoCodec,
      audioCodec,
      audioChannels,
    };
  }

  formatSize(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatRating(rating: number | undefined): string {
    if (rating === undefined) return "N/A";
    // Convert from 0-10 scale to percentage for RT-style display
    return `${Math.round(rating * 10)}%`;
  }

  // Extended Tools (Phase 0050)

  /**
   * Get collections from a library.
   * If no libraryKey is provided, returns collections from all libraries.
   */
  async getCollections(libraryKey?: string): Promise<
    Array<{
      ratingKey: string;
      title: string;
      childCount: number;
      library: string;
    }>
  > {
    const collections: Array<{
      ratingKey: string;
      title: string;
      childCount: number;
      library: string;
    }> = [];

    const libraries = libraryKey
      ? [{ key: libraryKey, title: libraryKey }]
      : await this.getLibraries();

    for (const lib of libraries) {
      try {
        const response = await this.http.get<
          PlexMediaContainer<{
            ratingKey: string;
            title: string;
            childCount: number;
          }>
        >(`/library/sections/${lib.key}/collections`);
        const metadata = response.MediaContainer.Metadata || [];
        for (const collection of metadata) {
          collections.push({
            ratingKey: collection.ratingKey,
            title: collection.title,
            childCount: collection.childCount || 0,
            library: lib.title,
          });
        }
      } catch {
        // Library may not support collections, skip
      }
    }

    return collections;
  }

  /**
   * Get duplicate items from a library.
   * Plex identifies duplicates based on metadata matching.
   */
  async getDuplicates(libraryKey?: string): Promise<
    Array<{
      title: string;
      year?: number;
      library: string;
      duplicateCount: number;
      totalSizeBytes: number;
      items: Array<{
        ratingKey: string;
        sizeBytes: number;
        resolution?: string;
      }>;
    }>
  > {
    const duplicates: Array<{
      title: string;
      year?: number;
      library: string;
      duplicateCount: number;
      totalSizeBytes: number;
      items: Array<{
        ratingKey: string;
        sizeBytes: number;
        resolution?: string;
      }>;
    }> = [];

    const libraries = libraryKey
      ? [{ key: libraryKey, title: libraryKey }]
      : await this.getLibraries();

    for (const lib of libraries) {
      try {
        // Use Plex's duplicate filter
        const response = await this.http.get<PlexMediaContainer<PlexMediaItem>>(
          `/library/sections/${lib.key}/all?duplicate=1`,
        );
        const items = response.MediaContainer.Metadata || [];

        // Group by title+year to find actual duplicates
        const groups = new Map<string, PlexMediaItem[]>();
        for (const item of items) {
          const key = `${item.title}|${item.year || ""}`;
          const existing = groups.get(key) || [];
          existing.push(item);
          groups.set(key, existing);
        }

        for (const [, groupItems] of groups) {
          if (groupItems.length > 1) {
            const dupItems = groupItems.map((item) => {
              let sizeBytes = 0;
              let resolution: string | undefined;
              if (item.Media && item.Media.length > 0) {
                resolution = item.Media[0].videoResolution;
                if (item.Media[0].Part) {
                  sizeBytes = item.Media[0].Part.reduce(
                    (sum, part) => sum + (part.size || 0),
                    0,
                  );
                }
              }
              return {
                ratingKey: item.ratingKey,
                sizeBytes,
                resolution,
              };
            });

            duplicates.push({
              title: groupItems[0].title,
              year: groupItems[0].year,
              library: lib.title,
              duplicateCount: groupItems.length,
              totalSizeBytes: dupItems.reduce((sum, i) => sum + i.sizeBytes, 0),
              items: dupItems,
            });
          }
        }
      } catch {
        // Library may not support duplicate filter, skip
      }
    }

    return duplicates;
  }

  /**
   * Trigger Plex database optimization.
   * This cleans up the database and can improve performance.
   */
  async optimizeDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // Plex optimize endpoint
      await this.http.put<void>("/library/optimize?async=1", {});
      return {
        success: true,
        message:
          "Database optimization started. This may take a while depending on library size.",
      };
    } catch {
      // Try alternative endpoint
      try {
        await this.http.get<void>("/library/optimize");
        return {
          success: true,
          message: "Database optimization started.",
        };
      } catch {
        return {
          success: false,
          message:
            "Database optimization not available on this Plex server version.",
        };
      }
    }
  }
}
