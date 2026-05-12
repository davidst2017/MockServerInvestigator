import { Expectation, MockServerBody, MockServerRequest, MockServerResponse } from './types';

export function prettyBody(body?: MockServerBody): string {
  if (!body) return '';
  const b = body as Record<string, unknown>;

  if (b['json'] !== undefined) {
    const raw = b['json'];
    if (typeof raw !== 'string') return JSON.stringify(raw, null, 2);
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  if (typeof b['string'] === 'string') return b['string'];
  if (typeof b['xml'] === 'string') return b['xml'];
  if (typeof b['xpath'] === 'string') return b['xpath'];
  if (typeof b['jsonPath'] === 'string') return b['jsonPath'];
  if (typeof b['regex'] === 'string') return b['regex'];
  if (b['jsonSchema'] !== undefined) {
    const schema = b['jsonSchema'];
    return typeof schema === 'string' ? schema : JSON.stringify(schema, null, 2);
  }
  if (typeof b['rawBytes'] === 'string') return b['rawBytes'];

  return '';
}

function looksLikeRegex(pattern: string): boolean {
  return /[.*+?^${}()|[\]\\]/.test(pattern);
}

function matchesExpectedValue(actual: string, expected: string): boolean {
  if (actual === expected) return true;
  if (!looksLikeRegex(expected)) return false;
  try {
    return new RegExp(expected).test(actual);
  } catch {
    return false;
  }
}

function valuesMatch(actualValues: string[] | undefined, expectedValues: string[]): boolean {
  if (!actualValues || actualValues.length === 0) return false;
  return expectedValues.some((expected) =>
    actualValues.some((actual) => matchesExpectedValue(actual, expected)),
  );
}

function bodyMatches(requestBody: MockServerBody | undefined, matcherBody: MockServerBody): boolean {
  const requestText = getRawBodyText(requestBody);
  if (!requestText) return false;

  const mb = matcherBody as Record<string, unknown>;
  if (typeof mb['regex'] === 'string') {
    try {
      return new RegExp(mb['regex'] as string).test(requestText);
    } catch {
      return false;
    }
  }

  const matcherText = getRawBodyText(matcherBody);
  if (!matcherText) return true;
  if (requestText.includes(matcherText)) return true;

  // XPath / JSONPath / JSON schema cannot be reliably evaluated client-side.
  // If one of these is present, avoid false negatives in UI labeling.
  if (
    typeof mb['xpath'] === 'string' ||
    typeof mb['jsonPath'] === 'string' ||
    mb['jsonSchema'] !== undefined
  ) {
    return true;
  }

  return false;
}

function expectationMatchesRequest(request: MockServerRequest, expectation: Expectation): boolean {
  const matcher = expectation.httpRequest;

  if (matcher.method && !matchesExpectedValue(request.method, matcher.method)) return false;
  if (matcher.path && !matchesExpectedValue(request.path, matcher.path)) return false;

  if (matcher.headers) {
    const reqHeaders = request.headers ?? {};
    const reqHeadersLower = Object.fromEntries(
      Object.entries(reqHeaders).map(([k, v]) => [k.toLowerCase(), v]),
    );

    for (const [key, values] of Object.entries(matcher.headers)) {
      const reqValues = reqHeadersLower[key.toLowerCase()];
      if (!valuesMatch(reqValues, values as string[])) return false;
    }
  }

  if (matcher.queryStringParameters) {
    const reqParams = request.queryStringParameters ?? {};
    for (const [key, values] of Object.entries(matcher.queryStringParameters)) {
      if (!valuesMatch(reqParams[key], values as string[])) return false;
    }
  }

  if (matcher.body && !bodyMatches(request.body, matcher.body)) return false;

  return true;
}

/**
 * Extracts the SOAP action from a request's SOAPAction header.
 * The header value is typically wrapped in extra quotes, e.g. '"/my/action"' — those are stripped.
 */
export function getSoapAction(request: { headers?: Record<string, string[]> }): string | null {
  const value = request.headers?.['SOAPAction']?.[0];
  if (!value) return null;
  return value.replace(/^"+|"+$/g, '');
}

/**
 * Extracts a human-readable operation label for an expectation.
 *
 * For SOAP expectations the SOAPAction is typically a regex like
 * ".* /PartyProfile//getParty/.*" — we pull out the last meaningful path
 * segment as the operation name.
 *
 * Falls back to the XPath body matcher (truncated) if no SOAPAction is set.
 */
export function getExpectationOperation(request: {
  headers?: Record<string, string[]>;
  body?: MockServerBody;
}): string | null {
  const raw = request.headers?.['SOAPAction']?.[0];
  if (raw) {
    // Strip surrounding quotes
    const stripped = raw.replace(/^"+|"+$/g, '');
    // Remove regex anchors/wildcards and split on /
    const clean = stripped.replace(/\.\*/g, '').replace(/^\/+|\/+$/g, '');
    const parts = clean.split('/').filter((p) => p.length > 0);
    // The operation is typically the last non-version segment
    const op = [...parts].reverse().find((p) => !/^\d+(\.\d+)*$/.test(p));
    if (op) return op;
    return clean || stripped;
  }
  const b = request.body as Record<string, unknown> | undefined;
  if (b?.['xpath'] && typeof b['xpath'] === 'string' && b['xpath'] !== '.') {
    const xpath = b['xpath'] as string;
    return xpath.length > 40 ? xpath.slice(0, 40) + '…' : xpath;
  }
  return null;
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
export function findBestMatch(
  request: MockServerRequest,
  expectations: Expectation[],
): Expectation | null {
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

export function findMatchedExpectation(
  request: MockServerRequest,
  expectations: Expectation[],
): Expectation | null {
  for (const exp of expectations) {
    if (expectationMatchesRequest(request, exp)) return exp;
  }
  return null;
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
function bodySnippet(requestText: string): string {
  return requestText;
}

/**
 * Returns the list of conditions from the expectation that DID NOT match the request.
 * Used to explain *why* an unmatched request failed.
 */
export function getMismatchedConditions(
  request: MockServerRequest,
  expectation: Expectation,
): MatchedCondition[] {
  const matcher = expectation.httpRequest;
  const conditions: MatchedCondition[] = [];

  if (matcher.method && matcher.method !== request.method) {
    conditions.push({
      label: 'Method',
      value: `expected ${matcher.method}, got ${request.method}`,
    });
  }

  if (matcher.path && matcher.path !== request.path) {
    conditions.push({ label: 'Path', value: `expected ${matcher.path}, got ${request.path}` });
  }

  if (matcher.headers) {
    const reqHeaders = request.headers ?? {};
    for (const [key, values] of Object.entries(matcher.headers)) {
      const reqValues = reqHeaders[key];
      const matched = valuesMatch(reqValues, values as string[]);
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
      const matched = valuesMatch(reqValues, values as string[]);
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
    if (matcherText && !requestText) {
      conditions.push({
        label: 'Body',
        value: `expected body matcher ${matcherText}, got (missing)`,
      });
    } else if (!bodyMatches(request.body, matcher.body)) {
      conditions.push({
        label: 'Body',
        value: `Matcher:\n${matcherText}\n\nRequest body (first 300 chars):\n${requestText.slice(0, 300)}${requestText.length > 300 ? '…' : ''}`,
        isCode: true,
      });
    }
  }

  return conditions;
}

export function getMatchedConditions(
  request: MockServerRequest,
  expectation: Expectation,
): MatchedCondition[] {
  const matcher = expectation.httpRequest;
  const conditions: MatchedCondition[] = [];

  if (!matcher.method || matchesExpectedValue(request.method, matcher.method)) {
    conditions.push({
      label: 'Method',
      value: matcher.method ? `${matcher.method} (matched ${request.method})` : '(any)',
    });
  }

  if (!matcher.path || matchesExpectedValue(request.path, matcher.path)) {
    conditions.push({
      label: 'Path',
      value: matcher.path ? `${matcher.path} (matched ${request.path})` : '(any)',
    });
  }

  if (matcher.headers) {
    const reqHeaders = request.headers ?? {};
    const reqHeadersLower = Object.fromEntries(
      Object.entries(reqHeaders).map(([k, v]) => [k.toLowerCase(), v]),
    );
    for (const [key, values] of Object.entries(matcher.headers)) {
      const reqValues = reqHeadersLower[key.toLowerCase()];
      if (!reqValues) continue;
      const matched = (values as string[]).find((expected) =>
        reqValues.some((actual) => matchesExpectedValue(actual, expected)),
      );
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
      const matched = (values as string[]).find((expected) =>
        reqValues.some((actual) => matchesExpectedValue(actual, expected)),
      );
      if (matched !== undefined) {
        conditions.push({ label: `Query: ${key}`, value: matched });
      }
    }
  }

  if (matcher.body) {
    const matcherText = getRawBodyText(matcher.body);
    const requestText = getRawBodyText(request.body);
    if (bodyMatches(request.body, matcher.body)) {
      conditions.push({
        label: 'Body',
        value: matcherText
          ? `Expectation matcher body:\n${matcherText}\n\nRequest body:\n${bodySnippet(requestText)}`
          : `Request body:\n${bodySnippet(requestText)}`,
        isCode: true,
      });
    }
  }

  return conditions;
}

/**
 * Prefer expectation-based matching for 404 responses to avoid false
 * "unmatched" when an expectation intentionally returns 404.
 */
export function isLikelyMatched(
  request: MockServerRequest,
  response: MockServerResponse | undefined,
  expectations: Expectation[],
): boolean {
  if (findMatchedExpectation(request, expectations)) return true;
  if (!response) return false;
  return response.statusCode !== 404;
}
