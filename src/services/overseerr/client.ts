import { HttpClient } from "../../shared/http.js";
import type { ServiceConfig } from "../../config.js";
import type {
  Request,
  RequestPage,
  User,
  UserPage,
  Quota,
  Issue,
  IssuePage,
  IssueComment,
  DiscoverPage,
} from "./types.js";

export class OverseerrClient {
  private http: HttpClient;

  constructor(config: ServiceConfig) {
    this.http = new HttpClient({
      baseUrl: `${config.url}/api/v1`,
      headers: { "X-Api-Key": config.apiKey },
      serviceName: "Overseerr",
    });
  }

  // ============================================================
  // Request Methods
  // ============================================================

  async getRequests(
    filter?: string,
    take: number = 20,
    skip: number = 0,
  ): Promise<RequestPage> {
    let path = `/request?take=${take}&skip=${skip}`;
    if (filter) {
      path += `&filter=${filter}`;
    }
    return this.http.get<RequestPage>(path);
  }

  async getRequest(id: number): Promise<Request> {
    return this.http.get<Request>(`/request/${id}`);
  }

  async approveRequest(id: number): Promise<Request> {
    return this.http.post<Request>(`/request/${id}/approve`);
  }

  async declineRequest(id: number): Promise<Request> {
    return this.http.post<Request>(`/request/${id}/decline`);
  }

  async deleteRequest(id: number): Promise<void> {
    await this.http.delete<void>(`/request/${id}`);
  }

  // ============================================================
  // User Methods
  // ============================================================

  async getUsers(take: number = 20, skip: number = 0): Promise<UserPage> {
    return this.http.get<UserPage>(`/user?take=${take}&skip=${skip}`);
  }

  async getUser(id: number): Promise<User> {
    return this.http.get<User>(`/user/${id}`);
  }

  async getUserRequests(userId: number): Promise<Request[]> {
    const page = await this.http.get<RequestPage>(
      `/user/${userId}/requests?take=100`,
    );
    return page.results;
  }

  async getUserQuota(userId: number): Promise<Quota> {
    return this.http.get<Quota>(`/user/${userId}/quota`);
  }

  // ============================================================
  // Issue Methods
  // ============================================================

  async getIssues(
    filter?: string,
    take: number = 20,
    skip: number = 0,
  ): Promise<IssuePage> {
    let path = `/issue?take=${take}&skip=${skip}`;
    if (filter) {
      path += `&filter=${filter}`;
    }
    return this.http.get<IssuePage>(path);
  }

  async getIssue(id: number): Promise<Issue> {
    return this.http.get<Issue>(`/issue/${id}`);
  }

  async addIssueComment(id: number, message: string): Promise<IssueComment> {
    return this.http.post<IssueComment>(`/issue/${id}/comment`, { message });
  }

  async resolveIssue(id: number): Promise<Issue> {
    return this.http.post<Issue>(`/issue/${id}/resolved`);
  }

  // ============================================================
  // Discovery Methods
  // ============================================================

  async getTrending(
    mediaType?: "movie" | "tv",
    page: number = 1,
  ): Promise<DiscoverPage> {
    if (mediaType === "movie") {
      return this.http.get<DiscoverPage>(`/discover/movies?page=${page}`);
    } else if (mediaType === "tv") {
      return this.http.get<DiscoverPage>(`/discover/tv?page=${page}`);
    }
    // Return combined trending
    return this.http.get<DiscoverPage>(`/discover/trending?page=${page}`);
  }

  async getUpcoming(page: number = 1): Promise<DiscoverPage> {
    return this.http.get<DiscoverPage>(
      `/discover/movies/upcoming?page=${page}`,
    );
  }

  // ============================================================
  // Media Lookup Methods
  // ============================================================

  async getMovieDetails(
    tmdbId: number,
  ): Promise<{ title: string; releaseDate?: string }> {
    const movie = await this.http.get<{
      title?: string;
      originalTitle?: string;
      releaseDate?: string;
    }>(`/movie/${tmdbId}`);
    return {
      title: movie.title || movie.originalTitle || "Unknown",
      releaseDate: movie.releaseDate,
    };
  }

  async getTvDetails(
    tmdbId: number,
  ): Promise<{ title: string; firstAirDate?: string }> {
    const tv = await this.http.get<{
      name?: string;
      originalName?: string;
      firstAirDate?: string;
    }>(`/tv/${tmdbId}`);
    return {
      title: tv.name || tv.originalName || "Unknown",
      firstAirDate: tv.firstAirDate,
    };
  }

  // ============================================================
  // Health Check
  // ============================================================

  async checkHealth(): Promise<{ version: string; status: string }> {
    const status = await this.http.get<{ version: string }>("/status");
    return { version: status.version, status: "ok" };
  }
}
