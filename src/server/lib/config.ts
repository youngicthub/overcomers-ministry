/** Thrown when a required environment variable is missing, so routes can
 * answer with a clear 503 instead of a mysterious 500. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/** An error that should be reported to the client with a specific status. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}
