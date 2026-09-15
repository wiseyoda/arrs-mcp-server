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
  DiscoverPage,
} from "./types.js";

export class OverseerrClient {
  private http: HttpClient;

  constructor(config: ServiceConfig) {
    this.http = new HttpClient({
      baseUrl: `${config.url.replace(/\/+$/, "")}/api/v1`,
      headers: { "X-Api-Key": config.apiKey },
      serviceName: "Seerr/Overseerr",
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
    // Seerr/Overseerr do not implement filter=declined; filter the complete inventory locally.
    if (filter === "declined") {
      const requests: Request[] = [];
      let offset = 0;
      let total: number;
      do {
        const page = await this.getRequests(undefined, 100, offset);
        total = page.pageInfo.results;
        if (!page.results.length && offset < total)
          throw new Error(
            "Request pagination ended before all records were returned.",
          );
        requests.push(
          ...page.results.filter((request) => request.status === 3),
        );
        offset += page.results.length;
      } while (offset < total);
      return {
        results: requests.slice(skip, skip + take),
        pageInfo: {
          pages: Math.ceil(requests.length / Math.max(1, take)),
          pageSize: take,
          results: requests.length,
          page: Math.floor(skip / Math.max(1, take)) + 1,
        },
      };
    }
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
    const results: Request[] = [];
    let total: number;
    do {
      const page = await this.http.get<RequestPage>(
        `/user/${userId}/requests?take=100&skip=${results.length}`,
      );
      total = page.pageInfo.results;
      if (!page.results.length && results.length < total)
        throw new Error("User request pagination ended early.");
      results.push(...page.results);
    } while (results.length < total);
    return results;
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

  async addIssueComment(id: number, message: string): Promise<Issue> {
    return this.http.post<Issue>(`/issue/${id}/comment`, { message });
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
    const result = await this.http.get<DiscoverPage>(
      `/discover/trending?page=${page}${mediaType ? `&mediaType=${mediaType}` : ""}`,
    );
    // Legacy Overseerr ignores mediaType, so enforce it locally as well.
    return {
      ...result,
      results: result.results.filter(
        (item) =>
          (item.mediaType === "movie" || item.mediaType === "tv") &&
          (!mediaType || item.mediaType === mediaType),
      ),
    };
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
