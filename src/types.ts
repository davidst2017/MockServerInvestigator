export interface ConnectionConfig {
  host: string;
  port: string;
}

export interface MockServerBody {
  type?: string;
  contentType?: string;
  // recorded request bodies
  string?: string;
  json?: string | Record<string, unknown>;
  xml?: string;
  // expectation body matchers
  xpath?: string;
  jsonPath?: string;
  regex?: string;
  jsonSchema?: string | Record<string, unknown>;
  rawBytes?: string;
}

export interface MockServerRequest {
  method: string;
  path: string;
  headers?: Record<string, string[]>;
  queryStringParameters?: Record<string, string[]>;
  body?: MockServerBody;
  timestamp?: string;
}

export interface MockServerResponse {
  statusCode: number;
  headers?: Record<string, string[]>;
  body?: MockServerBody;
}

export interface RequestResponseEntry {
  httpRequest: MockServerRequest;
  httpResponse?: MockServerResponse;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface ExpectationRequest {
  method?: string;
  path?: string;
  headers?: Record<string, string[]>;
  queryStringParameters?: Record<string, string[]>;
  body?: MockServerBody;
}

export interface ExpectationResponse {
  statusCode?: number;
  headers?: Record<string, string[]>;
  body?: MockServerBody;
  delay?: { timeUnit: string; value: number };
}

export interface ExpectationForward {
  host?: string;
  port?: number;
  scheme?: string;
}

export interface Expectation {
  id?: string;
  priority?: number;
  httpRequest: ExpectationRequest;
  httpResponse?: ExpectationResponse;
  httpForward?: ExpectationForward;
  times?: { remainingTimes?: number; unlimited?: boolean };
  timeToLive?: { unlimited?: boolean };
}

export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
  }
}
