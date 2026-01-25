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

  constructor(message: string, statusCode: number, responseBody: string = "") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }

  toUserMessage(): string {
    switch (this.statusCode) {
      case 401:
        return "Authentication failed. Please check your API key.";
      case 403:
        return "Access denied. Your API key may not have sufficient permissions.";
      case 404:
        return "The requested resource was not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
        return "The server is experiencing issues. Please try again later.";
      default:
        return `Request failed with status ${this.statusCode}: ${this.message}`;
    }
  }
}

/**
 * Error thrown when a network request fails (connection issues, timeouts)
 */
export class NetworkError extends ArrsError {
  readonly url: string;

  constructor(message: string, url: string) {
    super(message);
    this.name = "NetworkError";
    this.url = url;
  }

  toUserMessage(): string {
    if (this.message.includes("timed out")) {
      return "The request timed out. The server may be slow or unavailable.";
    }
    if (this.message.includes("Cannot connect")) {
      return `Cannot connect to the server. Please verify:\n` +
        `- The service is running\n` +
        `- The URL is correct\n` +
        `- Your network connection is working`;
    }
    return `Network error: ${this.message}`;
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigError extends ArrsError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }

  toUserMessage(): string {
    return `Configuration error: ${this.message}`;
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
