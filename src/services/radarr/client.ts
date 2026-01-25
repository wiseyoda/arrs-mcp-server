import { HttpClient } from "../../shared/http.js";
import type { ServiceConfig } from "../../config.js";
import type {
  Movie,
  MovieLookup,
  QueueItem,
  QueuePage,
  QualityProfile,
  RootFolder,
  HealthCheck,
  Command,
  AddMovieRequest,
} from "./types.js";

export class RadarrClient {
  private http: HttpClient;

  constructor(config: ServiceConfig, serviceName = "Radarr") {
    this.http = new HttpClient({
      baseUrl: `${config.url}/api/v3`,
      headers: {
        "X-Api-Key": config.apiKey,
      },
      serviceName,
    });
  }

  // Movie operations

  /**
   * Search for movies by query string.
   *
   * IMPORTANT: The Radarr API has inconsistent return types:
   * - Text search `/movie/lookup?term=` returns an ARRAY
   * - IMDB lookup `/movie/lookup/imdb?imdbId=` returns a SINGLE OBJECT
   * - TMDB lookup `/movie/lookup/tmdb?tmdbId=` returns a SINGLE OBJECT
   *
   * We normalize all responses to arrays for consistent handling upstream.
   * See .specify/memory/api-standards.md for details.
   */
  async searchMovies(query: string): Promise<MovieLookup[]> {
    // Handle IMDB ID search - returns single object, wrap in array
    if (query.toLowerCase().startsWith("imdb:")) {
      const imdbId = query.substring(5).trim();
      const result = await this.http.get<MovieLookup>(
        `/movie/lookup/imdb?imdbId=${encodeURIComponent(imdbId)}`,
      );
      return result ? [result] : [];
    }
    // Handle TMDB ID search - returns single object, wrap in array
    if (query.toLowerCase().startsWith("tmdb:")) {
      const tmdbId = query.substring(5).trim();
      const result = await this.http.get<MovieLookup>(
        `/movie/lookup/tmdb?tmdbId=${encodeURIComponent(tmdbId)}`,
      );
      return result ? [result] : [];
    }
    // Default text search - returns array
    return this.http.get<MovieLookup[]>(
      `/movie/lookup?term=${encodeURIComponent(query)}`,
    );
  }

  async getAllMovies(): Promise<Movie[]> {
    return this.http.get<Movie[]>("/movie");
  }

  async getMovie(id: number): Promise<Movie> {
    return this.http.get<Movie>(`/movie/${id}`);
  }

  async addMovie(request: AddMovieRequest): Promise<Movie> {
    return this.http.post<Movie>("/movie", request);
  }

  async deleteMovie(
    id: number,
    deleteFiles: boolean = false,
    addImportExclusion: boolean = false,
  ): Promise<void> {
    const params = new URLSearchParams();
    params.set("deleteFiles", String(deleteFiles));
    params.set("addImportExclusion", String(addImportExclusion));
    await this.http.delete<void>(`/movie/${id}?${params.toString()}`);
  }

  // Queue operations

  async getQueue(
    page: number = 1,
    pageSize: number = 100,
    includeUnknownMovieItems: boolean = true,
  ): Promise<QueuePage> {
    return this.http.get<QueuePage>(
      `/queue?page=${page}&pageSize=${pageSize}&includeUnknownMovieItems=${includeUnknownMovieItems}`,
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
    } = {},
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

  // Commands

  async executeCommand(
    name: string,
    body: Record<string, unknown> = {},
  ): Promise<Command> {
    return this.http.post<Command>("/command", { name, ...body });
  }

  async searchMovie(movieIds: number[]): Promise<Command> {
    return this.executeCommand("MoviesSearch", { movieIds });
  }

  async rescanMovie(movieId?: number): Promise<Command> {
    const body: Record<string, unknown> = {};
    if (movieId !== undefined) {
      body.movieId = movieId;
    }
    return this.executeCommand("RescanMovie", body);
  }

  async refreshMovie(movieId?: number): Promise<Command> {
    const body: Record<string, unknown> = {};
    if (movieId !== undefined) {
      body.movieId = movieId;
    }
    return this.executeCommand("RefreshMovie", body);
  }

  // Health

  async getHealth(): Promise<HealthCheck[]> {
    return this.http.get<HealthCheck[]>("/health");
  }

  // Utility: Check if movie exists by TMDB ID

  async movieExists(tmdbId: number): Promise<Movie | null> {
    const allMovies = await this.getAllMovies();
    return allMovies.find((m) => m.tmdbId === tmdbId) || null;
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
        item.trackedDownloadStatus === "error",
    );
  }

  // Extended Tools (Phase 0050)

  /**
   * Rename movie files using Radarr's naming rules.
   * This triggers the RenameFiles command for the specified movie.
   */
  async renameMovie(movieId: number): Promise<Command> {
    return this.executeCommand("RenameFiles", { movieId });
  }

  /**
   * Get movie recommendations from Radarr's discovery/import lists.
   * Returns movies that Radarr recommends based on your library.
   */
  async getDiscovery(): Promise<MovieLookup[]> {
    // Radarr uses /movie/discover for recommendations
    // This endpoint returns movies recommended based on your existing library
    try {
      return await this.http.get<MovieLookup[]>("/movie/discover");
    } catch {
      // Fallback: some Radarr versions may not have /discover endpoint
      // Return empty array if not available
      return [];
    }
  }
}
