/**
 * Base error class for arrs-mcp-server errors
 */
export class ArrsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArrsError";
  }

  /**
   * Returns a user-friendly error message suitable for display to Claude
   */
  toUserMessage(): string {
    return this.message;
  }
}

/**
 * Error thrown when an API request fails
 */
export class ApiError extends ArrsError {
  readonly statusCode: number;
  readonly responseBody: string;
  readonly service?: string;
  readonly endpoint?: string;

  constructor(
    message: string,
    statusCode: number,
    responseBody: string = "",
    options?: { service?: string; endpoint?: string },
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.service = options?.service;
    this.endpoint = options?.endpoint;
  }

  toUserMessage(): string {
    const servicePrefix = this.service ? `[${this.service}] ` : "";
    switch (this.statusCode) {
      case 401:
        return `${servicePrefix}Authentication failed. Please check your API key.`;
      case 403:
        return `${servicePrefix}Access denied. Your API key may not have sufficient permissions.`;
      case 404:
        return `${servicePrefix}The requested resource was not found. Use the list tool to find valid IDs.`;
      case 429:
        return `${servicePrefix}Too many requests. Please wait a moment and try again.`;
      case 500:
      case 502:
      case 503:
        return `${servicePrefix}The server is experiencing issues. Please try again later.`;
      default:
        return `${servicePrefix}Request failed with status ${this.statusCode}: ${this.message}`;
    }
  }
}

/**
 * Error thrown when a network request fails (connection issues, timeouts)
 */
export class NetworkError extends ArrsError {
  readonly url: string;
  readonly service?: string;

  constructor(message: string, url: string, service?: string) {
    super(message);
    this.name = "NetworkError";
    this.url = url;
    this.service = service;
  }

  toUserMessage(): string {
    const servicePrefix = this.service ? `[${this.service}] ` : "";
    if (this.message.includes("timed out")) {
      return `${servicePrefix}The request timed out. The server may be slow or unavailable.`;
    }
    if (this.message.includes("Cannot connect")) {
      return (
        `${servicePrefix}Cannot connect to the server. Please verify:\n` +
        `- The service is running\n` +
        `- The URL is correct\n` +
        `- Your network connection is working`
      );
    }
    return `${servicePrefix}Network error: ${this.message}`;
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigError extends ArrsError {
  readonly setting?: string;
  readonly service?: string;

  constructor(
    message: string,
    options?: { setting?: string; service?: string },
  ) {
    super(message);
    this.name = "ConfigError";
    this.setting = options?.setting;
    this.service = options?.service;
  }

  toUserMessage(): string {
    const servicePrefix = this.service ? `[${this.service}] ` : "";
    if (this.setting) {
      return `${servicePrefix}Missing required setting: ${this.setting}. ${this.message}`;
    }
    return `${servicePrefix}Configuration error: ${this.message}`;
  }
}

/**
 * Formats an error for display in MCP tool responses
 */
export function formatErrorResponse(error: unknown): string {
  if (error instanceof ArrsError) {
    return error.toUserMessage();
  }
  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return "An unexpected error occurred.";
}
