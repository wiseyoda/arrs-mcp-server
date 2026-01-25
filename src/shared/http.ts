import { ApiError, NetworkError } from "./errors.js";

export interface HttpClientConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
}

export class HttpClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: HttpClientConfig) {
    // Remove trailing slash from base URL
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.headers = config.headers || {};
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...this.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ApiError(
          `API request failed: ${response.status} ${response.statusText}`,
          response.status,
          errorBody
        );
      }

      const data = (await response.json()) as T;
      return { data, status: response.status };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new NetworkError(`Request timed out after ${this.timeout}ms`, url);
        }
        if (
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("fetch failed")
        ) {
          throw new NetworkError(`Cannot connect to server at ${this.baseUrl}`, url);
        }
        throw new NetworkError(error.message, url);
      }

      throw new NetworkError("Unknown network error", url);
    }
  }

  async get<T>(path: string): Promise<T> {
    const response = await this.request<T>("GET", path);
    return response.data;
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>("POST", path, body);
    return response.data;
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.request<T>("PUT", path, body);
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.request<T>("DELETE", path);
    return response.data;
  }
}
