# MockServer Investigator

A minimal React + TypeScript developer tool for inspecting traffic on a running [MockServer](https://www.mock-server.com/) instance.

## What it does

MockServer's built-in dashboard is cluttered and hard to navigate. This tool gives you a clean, focused view of:

### Requests view
- **All recorded requests and their responses** — shown in reverse-chronological order with colour-coded method badges and matched/unmatched status.
- **SOAP action display** — SOAP requests show the `SOAPAction` header value beneath the path so you can identify operations at a glance without opening the detail.
- **Live filtering** — type any path substring or SOAP action name to filter the list instantly without re-fetching.
- **Auto-refresh** — the list polls MockServer every 2 seconds (toggle on/off at any time).
- **Resizable list panel** — drag the divider between the list and detail panel to any width you need.

### Request detail
- **Request / Response tab** — full headers, query params, and body for both sides of the exchange.
- **Match Logs tab** — surfaces `NO_MATCH_RESPONSE` and `EXPECTATION_NOT_MATCHED` log entries with MockServer's own explanation of what failed.
- **Matched Expectation** (green) — for matched requests, shows exactly which conditions triggered the match (method, path, headers, SOAPAction, body snippet), the full expectation matcher, and the configured response.
- **Closest Expectation** (amber) — for unmatched requests, finds the expectation that scored closest and shows a **"Why it didn't match"** section (red) listing every failing condition side-by-side with what was expected vs what arrived, including body matchers. Supports all MockServer body matcher types: `xml`, `json`, `xpath`, `jsonPath`, `regex`, `jsonSchema`.

### Expectations view
- **Active expectations list** — browse all expectations currently loaded in MockServer.
- **Expectation detail** — full matcher (method, path, headers, query params, body), response (status, headers, body), forward target, and times configuration.

### General
- **Configurable host/port** — defaults to `localhost:6081`, editable in the header at runtime and persisted to `localStorage`.

## MockServer CORS configuration

Because this tool makes requests directly to MockServer from the browser, MockServer **must** be started with CORS enabled. Add the following environment variables to your MockServer deployment:

```
MOCKSERVER_ENABLE_CORS_FOR_API: "true"
MOCKSERVER_ENABLE_CORS_FOR_ALL_RESPONSES: "true"
MOCKSERVER_CORS_ALLOW_ORIGIN: "*"
MOCKSERVER_CORS_ALLOW_METHODS: "CONNECT, DELETE, GET, HEAD, OPTIONS, POST, PUT, PATCH, TRACE"
MOCKSERVER_CORS_ALLOW_HEADERS: "Allow, Content-Encoding, Content-Length, Content-Type, ETag, Expires, Last-Modified, Location, Server, Vary, Authorization"
MOCKSERVER_CORS_MAX_AGE_IN_SECONDS: "300"
```

Without these settings the browser will block all requests and the tool will show a red connection indicator.

## Getting started

### Local dev

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and point the **Host** / **Port** inputs at your MockServer instance.

### Docker

```bash
docker build -t mockserverinvestigator .
docker run -p 5173:8080 mockserverinvestigator
```

Open [http://localhost:5173](http://localhost:5173). The container runs nginx on unprivileged port 8080 as a non-root user — the `-p 5173:8080` flag maps it to 5173 on your host.

#### Supply chain attestation

To generate SBOM and provenance attestations (requires Docker BuildKit):

```bash
docker buildx build --provenance=true --sbom=true -t mockserverinvestigator .
```

## Releasing a new version

Releases are driven by git tags. The GitHub Actions workflow builds and pushes two Docker Hub tags (`x.y.z` and `latest`) whenever a `v*` tag is pushed.

```bash
npm version minor        # bumps package.json, commits, and creates the tag (e.g. v1.1.0)
git push --follow-tags   # pushes the commit and the tag — triggers the CI build
```

Use `npm version patch` for bug fixes and `npm version major` for breaking changes.

## Tech stack

- [Vite 6](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
- No CSS framework, no state management library, no router — plain CSS and React built-ins only.
