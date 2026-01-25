import { HttpClient } from "../../shared/http.js";
import type { TmdbConfig } from "../../config.js";
import type {
  Collection,
  CollectionSearchResponse,
  CollectionSearchResult,
  Movie,
  MovieSearchResponse,
} from "./types.js";

export class TmdbClient {
  private http: HttpClient;
  private apiKey: string;

  constructor(config: TmdbConfig) {
    this.apiKey = config.apiKey;
    this.http = new HttpClient({
      baseUrl: "https://api.themoviedb.org/3",
      serviceName: "TMDB",
    });
  }

  private addApiKey(path: string): string {
    const separator = path.includes("?") ? "&" : "?";
    return `${path}${separator}api_key=${this.apiKey}`;
  }

  // ============================================================
  // Collection Methods
  // ============================================================

  async searchCollections(query: string): Promise<CollectionSearchResult[]> {
    const encodedQuery = encodeURIComponent(query);
    const path = this.addApiKey(`/search/collection?query=${encodedQuery}`);
    const response = await this.http.get<CollectionSearchResponse>(path);
    return response.results;
  }

  async getCollection(id: number): Promise<Collection> {
    const path = this.addApiKey(`/collection/${id}`);
    return this.http.get<Collection>(path);
  }

  // ============================================================
  // Movie Methods
  // ============================================================

  async getMovie(id: number): Promise<Movie> {
    const path = this.addApiKey(`/movie/${id}`);
    return this.http.get<Movie>(path);
  }

  async getSimilar(id: number, page: number = 1): Promise<Movie[]> {
    const path = this.addApiKey(`/movie/${id}/similar?page=${page}`);
    const response = await this.http.get<MovieSearchResponse>(path);
    return response.results;
  }

  async getRecommendations(id: number, page: number = 1): Promise<Movie[]> {
    const path = this.addApiKey(`/movie/${id}/recommendations?page=${page}`);
    const response = await this.http.get<MovieSearchResponse>(path);
    return response.results;
  }

  async searchMovies(query: string, page: number = 1): Promise<Movie[]> {
    const encodedQuery = encodeURIComponent(query);
    const path = this.addApiKey(`/search/movie?query=${encodedQuery}&page=${page}`);
    const response = await this.http.get<MovieSearchResponse>(path);
    return response.results;
  }
}
