# MockServer Investigator — Implementation Plan

## Tech Stack

| Concern | Choice | Reason |
|---------|--------|--------|
| Bundler | Vite 6 | Fast dev server, zero config |
| UI | React 19 + TypeScript 5.8 | Typed, component-based |
| Styling | Plain CSS (single file) | No extra deps, full control |
| HTTP | native `fetch` | No lib needed |
| State | `useState` + `useEffect` | No global state needed |

**No CSS framework, no state management library, no router.**

---

## File Structure

```
MockServerInvestigator/
├── SPEC.md
├── PLAN.md
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx             # React root
    ├── App.tsx              # Root component, state orchestration
    ├── App.css              # All styles
    ├── types.ts             # MockServer response shapes
    ├── api/
    │   └── mockserver.ts    # fetch wrappers for MockServer API
    └── components/
        ├── Header.tsx       # Connection status + controls
        ├── RequestList.tsx  # Left panel — list of requests
        └── RequestDetail.tsx # Right panel — detail + logs
```

---

## Data Flow

```
App (state owner)
 ├── state: host, port (loaded from localStorage, default localhost:6081)
 ├── state: pathFilter string
 ├── every 2s: fetchRequestResponses(host, port) → allRequests[]
 ├── derived: visibleRequests = allRequests.filter(path contains pathFilter)
 ├── on select: fetchLogs(host, port, req) → logs[]
 ├── Header receives: { host, port, onHostChange, onPortChange, connected,
 │                     autoRefresh, onToggle, onRefresh, onClear,
 │                     pathFilter, onPathFilterChange }
 ├── RequestList receives: { requests: visibleRequests, selectedId, onSelect }
 └── RequestDetail receives: { request, response, logs }
```

---

## Component Responsibilities

### `App.tsx`
- Owns all state: `requests`, `selectedEntry`, `logs`, `autoRefresh`, `connected`
- Polls `fetchRequestResponses` on interval when `autoRefresh` is true
- Fetches logs whenever `selectedEntry` changes
- Passes everything down as props

### `Header.tsx`
- **Host** input and **Port** input — editable, persisted to `localStorage`
- Changing either triggers a re-fetch immediately and updates all subsequent calls
- Green/red connection dot (derived from last fetch success/failure)
- Auto-refresh toggle button
- Manual refresh + clear buttons
- **Path filter** text input — live, client-side, filters the visible request list by path substring

### `RequestList.tsx`
- Receives `requests` already filtered by the path filter string
- Renders a scrollable list of request rows
- Each row: timestamp, method badge, path, status code, matched/unmatched badge
- Unmatched = response status 404 from MockServer (no expectation matched)
- Highlights selected row

### `RequestDetail.tsx`
- Two tabs: **Request/Response** and **Match Logs**
- Request/Response tab: renders body with JSON pretty-print when parseable
- Match Logs tab: renders log entries; `NO_MATCH_RESPONSE` type entries shown with red header + full message

---

## MockServer Proxy (Vite)

Because the host and port are dynamic, a static Vite proxy is not suitable — the target must change at runtime. Instead, **requests are made directly to the configured host/port URL**.

To avoid CORS issues, MockServer must be started with CORS enabled (it is by default). The app constructs the base URL from the current `host`/`port` state:

```ts
const baseUrl = (host: string, port: string) => `http://${host}:${port}`;
```

All `fetch` calls use this directly — no proxy needed. The `vite.config.ts` proxy config is removed.

---

## Technical Implementation Steps

---

### Step 1 — `src/types.ts`

Define all shapes derived from the MockServer REST API responses.

```ts
export interface ConnectionConfig {
  host: string;
  port: string;
}

// Raw MockServer body shape in request_responses
export interface MockServerBody {
  contentType?: string;
  string?: string;
  json?: string; // raw JSON string from MockServer
}

export interface MockServerRequest {
  method: string;
  path: string;
  headers?: Record<string, string[]>;
  queryStringParameters?: Record<string, string[]>;
  body?: MockServerBody;
  timestamp?: string; // added by retrieve endpoint
}

export interface MockServerResponse {
  statusCode: number;
  headers?: Record<string, string[]>;
  body?: MockServerBody;
}

// One entry from /mockserver/retrieve?type=request_responses
export interface RequestResponseEntry {
  httpRequest: MockServerRequest;
  httpResponse?: MockServerResponse;
  timestamp: string;
}

// One entry from /mockserver/retrieve?type=logs
export interface LogEntry {
  logLevel: string;
  timestamp: string;
  type: string;       // e.g. "NO_MATCH_RESPONSE", "EXPECTATION_MATCHED"
  message: string;    // human-readable explanation from MockServer
  httpRequest?: MockServerRequest;
}
```

---

### Step 2 — `src/api/mockserver.ts`

Three functions, all accepting `ConnectionConfig`. No global state.

```ts
const base = (cfg: ConnectionConfig) => `http://${cfg.host}:${cfg.port}`;

// PUT /mockserver/retrieve?type=request_responses — empty body = all requests
export async function fetchRequestResponses(cfg: ConnectionConfig): Promise<RequestResponseEntry[]>

// PUT /mockserver/retrieve?type=logs — optional request filter in body to narrow results
export async function fetchLogs(cfg: ConnectionConfig, request?: Partial<MockServerRequest>): Promise<LogEntry[]>

// PUT /mockserver/reset
export async function clearAll(cfg: ConnectionConfig): Promise<void>
```

All three: catch `fetch` errors and throw a typed `ConnectionError` so `App.tsx` can set `connected = false`.

---

### Step 3 — `src/App.tsx` (state layer)

State:
```ts
const [config, setConfig]               // ConnectionConfig, init from localStorage
const [allEntries, setAllEntries]       // RequestResponseEntry[]
const [selectedEntry, setSelectedEntry] // RequestResponseEntry | null
const [logs, setLogs]                   // LogEntry[]
const [pathFilter, setPathFilter]       // string
const [autoRefresh, setAutoRefresh]     // boolean, default true
const [connected, setConnected]         // boolean
```

Derived (no state, computed inline):
```ts
const visibleEntries = allEntries.filter(e =>
  e.httpRequest.path.toLowerCase().includes(pathFilter.toLowerCase())
);
```

Effects:
- `useEffect([config, autoRefresh])` — start/clear `setInterval(2000)` that calls `fetchRequestResponses`; run once immediately on mount/config change
- `useEffect([selectedEntry])` — call `fetchLogs` for the selected request; clear logs when `selectedEntry` is null

Handlers:
- `handleConfigChange(field, value)` — update `config`, persist to `localStorage`, trigger immediate refresh
- `handleClear()` — call `clearAll`, reset `allEntries`, `selectedEntry`, `logs`, `pathFilter`
- `handleSelect(entry)` — set `selectedEntry`

---

### Step 4 — `src/components/Header.tsx`

Props:
```ts
interface HeaderProps {
  config: ConnectionConfig;
  onConfigChange: (field: keyof ConnectionConfig, value: string) => void;
  connected: boolean;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onRefresh: () => void;
  onClear: () => void;
  pathFilter: string;
  onPathFilterChange: (value: string) => void;
}
```

Layout (single row, flex):
```
[● connected]  [Host: ____] [Port: ____]   [Filter path: ________]   [⟳ Refresh] [Auto ✓] [🗑 Clear]
```

- Host/port: `<input type="text">` — `onChange` calls `onConfigChange` immediately
- Path filter: `<input type="text" placeholder="Filter by path…">` — `onChange` calls `onPathFilterChange`
- Connection dot: `●` colored green (`#22c55e`) or red (`#ef4444`) via inline style
- Auto-refresh button toggles label between "Auto ON" / "Auto OFF"

---

### Step 5 — `src/components/RequestList.tsx`

Props:
```ts
interface RequestListProps {
  entries: RequestResponseEntry[];  // already filtered
  selectedEntry: RequestResponseEntry | null;
  onSelect: (entry: RequestResponseEntry) => void;
}
```

Each row renders:
- `timestamp` formatted as `HH:mm:ss.SSS` (using `Date` + `toLocaleTimeString`)
- `method` in a `<span className={`badge badge-${method.toLowerCase()}`}>`
- `path` — truncated with CSS `text-overflow: ellipsis`
- `statusCode` from `httpResponse?.statusCode ?? '—'`
- Match badge: if `statusCode === 404` → `<span class="badge unmatched">UNMATCHED</span>`, else `<span class="badge matched">MATCHED</span>`

Selected row gets `class="row selected"`.

---

### Step 6 — `src/components/RequestDetail.tsx`

Props:
```ts
interface RequestDetailProps {
  entry: RequestResponseEntry | null;
  logs: LogEntry[];
}
```

State: `activeTab: 'request' | 'logs'`

**Tab: Request / Response**

Request section:
- Method + path as heading
- Headers table (two-column: name / value)
- Query params table if present
- Body: attempt `JSON.parse` — if succeeds render `<pre>{JSON.stringify(parsed, null, 2)}</pre>`, else render raw string

Response section (same layout):
- Status code as heading
- Headers table
- Body (same JSON-or-raw rendering)

**Tab: Match Logs**

For each `LogEntry`:
- If `type` is `NO_MATCH_RESPONSE` or `EXPECTATION_NOT_MATCHED`: render in a red-bordered card with full `message` in `<pre>`
- If `type` is `EXPECTATION_MATCHED`: render in a green-bordered card
- All others: render in a neutral grey card
- Log entries shown in chronological order

Empty state: "No logs for this request." if `logs.length === 0`.

---

### Step 7 — `src/App.css`

Sections:
```
/* Reset + base */
/* Layout: full-height flex column (header + content) */
/* Content: flex row (list 35% + detail 65%) */
/* Header bar */
/* Inputs */
/* Connection dot */
/* Request list + rows */
/* Method + match badges */
/* Request detail: tabs */
/* Request detail: sections */
/* Pre / code blocks */
/* Log entry cards */
/* Scrollbars */
```

Color palette (dark theme):
| Token | Value |
|-------|-------|
| `--bg` | `#0f1117` |
| `--surface` | `#1a1d27` |
| `--border` | `#2e3244` |
| `--text` | `#e2e8f0` |
| `--text-muted` | `#94a3b8` |
| `--matched` | `#22c55e` |
| `--unmatched` | `#ef4444` |
| `--selected` | `#2563eb` |

---

### Step 8 — `src/main.tsx`

Boilerplate React 19 root render. Import `App` and `App.css`.

---

### Step 9 — Infrastructure files

**`package.json`** — dependencies:
- `react@^19`, `react-dom@^19` (runtime)
- `@types/react@^19`, `@types/react-dom@^19`, `@vitejs/plugin-react@^4`, `typescript@^5.8`, `vite@^6` (dev)

**`tsconfig.json`** — key options:
- `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`, `"strict": true`, `"noEmit": true`

**`vite.config.ts`** — `@vitejs/plugin-react` only, no proxy

**`index.html`** — single `<div id="root">` + script module entry

---

### Step 10 — `Dockerfile` + `.dockerignore`

Multi-stage build: **build stage** compiles the Vite app, **serve stage** serves the static output with `nginx:alpine`.

```dockerfile
# Stage 1 — build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

`.dockerignore`:
```
node_modules
dist
*.md
.git
```

Because the app fetches MockServer directly from the browser (dynamic host/port), **no nginx proxy config is needed** — the built static files are all that's required.

---

### Step 11 — Install and verify

```bash
cd MockServerInvestigator
npm install
npm run dev
```

Expected: Vite starts on `http://localhost:5173`, app loads, attempts to connect to `localhost:6081`.

---

## Running the tool

### Dev mode
```bash
cd MockServerInvestigator
npm install
npm run dev
# Open http://localhost:5173
# MockServer host/port configurable in the UI (default: localhost:6081)
```

### Docker build & publish
```bash
cd MockServerInvestigator

# Build image
docker build -t <dockerhub-user>/mockserver-investigator:latest .

# Test locally (app on :8080, pointing at MockServer on host machine)
docker run -p 8080:80 <dockerhub-user>/mockserver-investigator:latest
# Open http://localhost:8080 — set host to host.docker.internal, port 6081

# Push to Docker Hub
docker login
docker push <dockerhub-user>/mockserver-investigator:latest

# Optional: tag a version
docker tag <dockerhub-user>/mockserver-investigator:latest <dockerhub-user>/mockserver-investigator:1.0.0
docker push <dockerhub-user>/mockserver-investigator:1.0.0
```

> **Note:** When running in Docker, the browser connects to MockServer directly. Use `host.docker.internal` as the host if MockServer is running on the same machine outside Docker.
