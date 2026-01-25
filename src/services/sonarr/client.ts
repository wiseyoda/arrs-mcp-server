import { HttpClient } from "../../shared/http.js";
import type { ServiceConfig } from "../../config.js";
import type {
  Series,
  SeriesLookup,
  Episode,
  QueueItem,
  QueuePage,
  QualityProfile,
  RootFolder,
  HealthCheck,
  Command,
  AddSeriesRequest,
} from "./types.js";

export class SonarrClient {
  private http: HttpClient;

  constructor(config: ServiceConfig) {
    this.http = new HttpClient({
      baseUrl: `${config.url}/api/v3`,
      headers: {
        "X-Api-Key": config.apiKey,
      },
    });
  }

  // Series operations

  async searchSeries(query: string): Promise<SeriesLookup[]> {
    return this.http.get<SeriesLookup[]>(`/series/lookup?term=${encodeURIComponent(query)}`);
  }

  async getAllSeries(): Promise<Series[]> {
    return this.http.get<Series[]>("/series");
  }

  async getSeries(id: number): Promise<Series> {
    return this.http.get<Series>(`/series/${id}`);
  }

  async addSeries(request: AddSeriesRequest): Promise<Series> {
    return this.http.post<Series>("/series", request);
  }

  async deleteSeries(id: number, deleteFiles: boolean = false): Promise<void> {
    await this.http.delete<void>(`/series/${id}?deleteFiles=${deleteFiles}`);
  }

  // Episode operations

  async getEpisodes(seriesId: number): Promise<Episode[]> {
    return this.http.get<Episode[]>(`/episode?seriesId=${seriesId}`);
  }

  // Queue operations

  async getQueue(
    page: number = 1,
    pageSize: number = 100,
    includeUnknownSeriesItems: boolean = true
  ): Promise<QueuePage> {
    return this.http.get<QueuePage>(
      `/queue?page=${page}&pageSize=${pageSize}&includeUnknownSeriesItems=${includeUnknownSeriesItems}`
    );
  }

  async getQueueDetails(): Promise<QueueItem[]> {
    const queue = await this.getQueue(1, 1000);
    return queue.records;
  }

  async deleteQueueItem(
    id: number,
    options: {
      removeFromClient?: boolean;
      blocklist?: boolean;
      skipRedownload?: boolean;
    } = {}
  ): Promise<void> {
    const params = new URLSearchParams();
    if (options.removeFromClient !== undefined) {
      params.set("removeFromClient", String(options.removeFromClient));
    }
    if (options.blocklist !== undefined) {
      params.set("blocklist", String(options.blocklist));
    }
    if (options.skipRedownload !== undefined) {
      params.set("skipRedownload", String(options.skipRedownload));
    }
    await this.http.delete<void>(`/queue/${id}?${params.toString()}`);
  }

  // Profile and folder operations

  async getProfiles(): Promise<QualityProfile[]> {
    return this.http.get<QualityProfile[]>("/qualityprofile");
  }

  async getRootFolders(): Promise<RootFolder[]> {
    return this.http.get<RootFolder[]>("/rootfolder");
  }

  // Calendar

  async getCalendar(start?: Date, end?: Date): Promise<Episode[]> {
    const params = new URLSearchParams();
    if (start) {
      params.set("start", start.toISOString());
    }
    if (end) {
      params.set("end", end.toISOString());
    }
    const query = params.toString();
    return this.http.get<Episode[]>(`/calendar${query ? `?${query}` : ""}`);
  }

  // Commands

  async executeCommand(name: string, body: Record<string, unknown> = {}): Promise<Command> {
    return this.http.post<Command>("/command", { name, ...body });
  }

  async searchMissingEpisodes(seriesId?: number): Promise<Command> {
    const body: Record<string, unknown> = {};
    if (seriesId !== undefined) {
      body.seriesId = seriesId;
    }
    return this.executeCommand("MissingEpisodeSearch", body);
  }

  async searchSeason(seriesId: number, seasonNumber: number): Promise<Command> {
    return this.executeCommand("SeasonSearch", { seriesId, seasonNumber });
  }

  async rescanSeries(seriesId?: number): Promise<Command> {
    const body: Record<string, unknown> = {};
    if (seriesId !== undefined) {
      body.seriesId = seriesId;
    }
    return this.executeCommand("RescanSeries", body);
  }

  // Health

  async getHealth(): Promise<HealthCheck[]> {
    return this.http.get<HealthCheck[]>("/health");
  }

  // Utility: Check if series exists

  async seriesExists(tvdbId: number): Promise<Series | null> {
    const allSeries = await this.getAllSeries();
    return allSeries.find((s) => s.tvdbId === tvdbId) || null;
  }

  /**
   * Get items stuck in importing state or with errors.
   *
   * IMPORTANT: Check for BOTH importPending AND importBlocked states!
   * importBlocked was discovered during Phase 0020 testing - items can get
   * stuck in this state and need manual intervention.
   * See .specify/memory/api-standards.md "Queue Item States" section.
   */
  async getStuckItems(): Promise<QueueItem[]> {
    const queue = await this.getQueueDetails();
    return queue.filter(
      (item) =>
        item.trackedDownloadState === "importPending" ||
        item.trackedDownloadState === "importBlocked" ||
        item.trackedDownloadStatus === "warning" ||
        item.trackedDownloadStatus === "error"
    );
  }
}
