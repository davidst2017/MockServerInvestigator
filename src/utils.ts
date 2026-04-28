import { Expectation, MockServerBody, MockServerRequest } from './types';

export function prettyBody(body?: MockServerBody): string {
  if (!body) return '';
  const raw: unknown = (body as Record<string, unknown>).json ?? body.string ?? '';
  if (!raw) return '';
  if (typeof raw !== 'string') return JSON.stringify(raw, null, 2);
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

/**
 * Extracts the SOAP action from a request's SOAPAction header.
 * The header value is typically wrapped in extra quotes, e.g. '"/my/action"' — those are stripped.
 */
export function getSoapAction(request: MockServerRequest): string | null {
  const value = request.headers?.['SOAPAction']?.[0];
  if (!value) return null;
  return value.replace(/^"+|"+$/g, '');
}

/**
 * Scores how well an expectation matches a given request.
 * Higher score = closer match. Used to find the "best guess" when a request is unmatched.
 *
 * Scoring weights:
 *   +3  method exact match (or expectation has no method constraint)
 *   +3  path exact match
 *   +1  path partial match (one is a prefix of the other)
 *   +2  SOAPAction header match (important for SOAP services with shared paths)
 *   +1  each other matching request header key+value
 *   +1  each matching query param key+value
 */
export function scoreExpectation(request: MockServerRequest, expectation: Expectation): number {
  const matcher = expectation.httpRequest;
  let score = 0;

  // Method
  if (!matcher.method || matcher.method === request.method) score += 3;

  // Path
  if (!matcher.path) {
    score += 1;
  } else if (matcher.path === request.path) {
    score += 3;
  } else if (request.path.startsWith(matcher.path) || matcher.path.startsWith(request.path)) {
    score += 1;
  }

  // Headers
  if (matcher.headers) {
    const reqHeaders = request.headers ?? {};
    for (const [key, values] of Object.entries(matcher.headers)) {
      const reqValues = reqHeaders[key];
      if (!reqValues) continue;
      const matches = (values as string[]).some((v) => reqValues.includes(v));
      if (matches) score += key === 'SOAPAction' ? 2 : 1;
    }
  }

  // Query params
  if (matcher.queryStringParameters) {
    const reqParams = request.queryStringParameters ?? {};
    for (const [key, values] of Object.entries(matcher.queryStringParameters)) {
      const reqValues = reqParams[key];
      if (reqValues && (values as string[]).some((v) => reqValues.includes(v))) score += 1;
    }
  }

  return score;
}

/**
 * Returns the expectation that best matches the given request, or null if none score > 0.
 */
export function findBestMatch(request: MockServerRequest, expectations: Expectation[]): Expectation | null {
  if (expectations.length === 0) return null;
  let best: Expectation | null = null;
  let bestScore = 0;
  for (const exp of expectations) {
    const score = scoreExpectation(request, exp);
    if (score > bestScore) {
      bestScore = score;
      best = exp;
    }
  }
  return best;
}

export interface MatchedCondition {
  label: string;
  value: string;
  isCode?: boolean;
}

/**
 * Extracts a plain text representation from a body object.
 * Handles all MockServer body formats: recorded requests (json object/string, xml, string)
 * and expectation matchers (xpath, jsonPath, regex, jsonSchema, string).
 */
function getRawBodyText(body: MockServerBody | undefined): string {
  if (!body) return '';
  const b = body as Record<string, unknown>;
  // Recorded XML body
  if (typeof b['xml'] === 'string') return b['xml'];
  // JSON body — can be a string or an object on recorded requests
  if (b['json'] !== undefined) {
    const j = b['json'];
    return typeof j === 'string' ? j : JSON.stringify(j, null, 2);
  }
  // Expectation matchers
  if (typeof b['xpath'] === 'string') return b['xpath'];
  if (typeof b['jsonPath'] === 'string') return b['jsonPath'];
  if (typeof b['regex'] === 'string') return b['regex'];
  if (b['jsonSchema'] !== undefined) {
    const s = b['jsonSchema'];
    return typeof s === 'string' ? s : JSON.stringify(s, null, 2);
  }
  if (typeof b['string'] === 'string') return b['string'];
  return '';
}

/**
 * Given a request body text and a matcher snippet, returns a ~300-char window
 * around the first occurrence of the snippet, or the first 300 chars of the body.
 */
function bodySnippet(requestText: string, matcherText: string): string {
  const WINDOW = 150;
  const idx = requestText.indexOf(matcherText);
  if (idx !== -1) {
    const start = Math.max(0, idx - WINDOW);
    const end = Math.min(requestText.length, idx + matcherText.length + WINDOW);
    return (start > 0 ? '…' : '') + requestText.slice(start, end) + (end < requestText.length ? '…' : '');
  }
  // No direct substring — show the first 300 chars as context
  return requestText.slice(0, 300) + (requestText.length > 300 ? '…' : '');
}

/**
 * Returns the list of conditions from the expectation that DID NOT match the request.
 * Used to explain *why* an unmatched request failed.
 */
export function getMismatchedConditions(request: MockServerRequest, expectation: Expectation): MatchedCondition[] {
  const matcher = expectation.httpRequest;
  const conditions: MatchedCondition[] = [];

  if (matcher.method && matcher.method !== request.method) {
    conditions.push({ label: 'Method', value: `expected ${matcher.method}, got ${request.method}` });
  }

  if (matcher.path && matcher.path !== request.path) {
    conditions.push({ label: 'Path', value: `expected ${matcher.path}, got ${request.path}` });
  }

  if (matcher.headers) {
    const reqHeaders = request.headers ?? {};
    for (const [key, values] of Object.entries(matcher.headers)) {
      const reqValues = reqHeaders[key];
      const matched = reqValues && (values as string[]).some((v) => reqValues.includes(v));
      if (!matched) {
        const expected = (values as string[]).join(' | ');
        const got = reqValues ? reqValues.join(', ') : '(missing)';
        conditions.push({ label: `Header: ${key}`, value: `expected ${expected}, got ${got}` });
      }
    }
  }

  if (matcher.queryStringParameters) {
    const reqParams = request.queryStringParameters ?? {};
    for (const [key, values] of Object.entries(matcher.queryStringParameters)) {
      const reqValues = reqParams[key];
      const matched = reqValues && (values as string[]).some((v) => reqValues.includes(v));
      if (!matched) {
        const expected = (values as string[]).join(' | ');
        const got = reqValues ? reqValues.join(', ') : '(missing)';
        conditions.push({ label: `Query: ${key}`, value: `expected ${expected}, got ${got}` });
      }
    }
  }

  if (matcher.body) {
    const matcherText = getRawBodyText(matcher.body);
    const requestText = getRawBodyText(request.body);
    if (matcherText && requestText && !requestText.includes(matcherText)) {
      conditions.push({
        label: 'Body',
        value: `Matcher:\n${matcherText}\n\nRequest body (first 300 chars):\n${requestText.slice(0, 300)}${requestText.length > 300 ? '…' : ''}`,
        isCode: true,
      });
    }
  }

  return conditions;
}


export function getMatchedConditions(request: MockServerRequest, expectation: Expectation): MatchedCondition[] {
  const matcher = expectation.httpRequest;
  const conditions: MatchedCondition[] = [];

  if (!matcher.method || matcher.method === request.method) {
    conditions.push({ label: 'Method', value: matcher.method ?? '(any)' });
  }

  if (!matcher.path || matcher.path === request.path) {
    conditions.push({ label: 'Path', value: matcher.path ?? '(any)' });
  }

  if (matcher.headers) {
    const reqHeaders = request.headers ?? {};
    for (const [key, values] of Object.entries(matcher.headers)) {
      const reqValues = reqHeaders[key];
      if (!reqValues) continue;
      const matched = (values as string[]).find((v) => reqValues.includes(v));
      if (matched !== undefined) {
        conditions.push({ label: `Header: ${key}`, value: matched });
      }
    }
  }

  if (matcher.queryStringParameters) {
    const reqParams = request.queryStringParameters ?? {};
    for (const [key, values] of Object.entries(matcher.queryStringParameters)) {
      const reqValues = reqParams[key];
      if (!reqValues) continue;
      const matched = (values as string[]).find((v) => reqValues.includes(v));
      if (matched !== undefined) {
        conditions.push({ label: `Query: ${key}`, value: matched });
      }
    }
  }

  if (matcher.body) {
    const matcherText = getRawBodyText(matcher.body);
    const requestText = getRawBodyText(request.body);
    if (matcherText && requestText) {
      conditions.push({
        label: 'Body',
        value: bodySnippet(requestText, matcherText),
        isCode: true,
      });
    }
  }

  return conditions;
}
