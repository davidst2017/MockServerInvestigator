import {
  ConnectionConfig,
  ConnectionError,
  Expectation,
  LogEntry,
  MockServerRequest,
  RequestResponseEntry,
} from '../types';

const base = (cfg: ConnectionConfig) => `http://${cfg.host}:${cfg.port}`;

export async function fetchRequestResponses(cfg: ConnectionConfig): Promise<RequestResponseEntry[]> {
  try {
    const res = await fetch(`${base(cfg)}/mockserver/retrieve?type=request_responses`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new ConnectionError(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e instanceof ConnectionError) throw e;
    throw new ConnectionError(`Cannot reach MockServer at ${cfg.host}:${cfg.port}`);
  }
}

export async function fetchLogs(
  cfg: ConnectionConfig,
  request?: Partial<MockServerRequest>,
): Promise<LogEntry[]> {
  try {
    const res = await fetch(`${base(cfg)}/mockserver/retrieve?type=logs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: request ? JSON.stringify(request) : undefined,
    });
    if (!res.ok) throw new ConnectionError(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text.trim()) return [];
    // MockServer returns plain text log entries separated by dashes
    const SEPARATOR = '------------------------------------';
    return text
      .split(SEPARATOR)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block): LogEntry => {
        const lines = block.split('\n');
        const firstLine = lines[0].trim();
        const match = firstLine.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d+)\s+-\s+(.*)$/);
        if (match) {
          const rest = lines.slice(1).join('\n').trim();
          return {
            timestamp: match[1],
            message: rest ? `${match[2]}\n${rest}` : match[2],
          };
        }
        return { timestamp: '', message: block };
      });
  } catch (e) {
    if (e instanceof ConnectionError) throw e;
    throw new ConnectionError(`Cannot reach MockServer at ${cfg.host}:${cfg.port}`);
  }
}

export async function clearAll(cfg: ConnectionConfig): Promise<void> {
  try {
    const res = await fetch(`${base(cfg)}/mockserver/reset`, { method: 'PUT' });
    if (!res.ok) throw new ConnectionError(`HTTP ${res.status}`);
  } catch (e) {
    if (e instanceof ConnectionError) throw e;
    throw new ConnectionError(`Cannot reach MockServer at ${cfg.host}:${cfg.port}`);
  }
}

export async function fetchExpectations(cfg: ConnectionConfig): Promise<Expectation[]> {
  try {
    const res = await fetch(`${base(cfg)}/mockserver/retrieve?type=active_expectations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('[fetchExpectations] status:', res.status);
    if (!res.ok) throw new ConnectionError(`HTTP ${res.status}`);
    const text = await res.text();
    console.log('[fetchExpectations] raw (first 300 chars):', text.slice(0, 300));
    const data = JSON.parse(text);
    console.log('[fetchExpectations] parsed count:', Array.isArray(data) ? data.length : typeof data);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('[fetchExpectations] error:', e);
    if (e instanceof ConnectionError) throw e;
    throw new ConnectionError(`Cannot reach MockServer at ${cfg.host}:${cfg.port}`);
  }
}
