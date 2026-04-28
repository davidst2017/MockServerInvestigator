# MockServer Investigator — Specification

## Purpose

A minimal React + TypeScript dev tool that connects to a running MockServer instance on `localhost:6081` and provides a readable, actionable view of:
- All received requests and their responses
- Why a given request did **not** match any expectation

## Problems with the built-in dashboard

- Cluttered, slow to navigate
- No clear "why didn't this match" explanation in one place
- Mixing matched/unmatched entries without clear visual distinction

---

## Features

### 1. Request List (left panel)
- Shows all received requests in reverse-chronological order
- Each row displays:
  - Timestamp
  - HTTP method badge (color-coded: GET=blue, POST=green, PUT=orange, DELETE=red)
  - Path
  - Response status code
  - Match status badge: **MATCHED** (green) or **UNMATCHED** (red)
- Auto-refresh every 2 seconds (toggle on/off)
- "Refresh now" button
- "Clear all" button (calls MockServer reset)

### 2. Request Detail (right panel)
Activated by clicking a request in the list. Shows two tabs:

#### Tab: Request / Response
- Full request: method, path, query params, headers, body (pretty-printed JSON or plain text)
- Full response: status code, headers, body

#### Tab: Match Logs
- Fetches MockServer logs filtered to the selected request
- Highlights `NO_MATCH_RESPONSE` and `EXPECTATION_NOT_MATCHED` log entries prominently
- Shows the raw `message` field which contains MockServer's explanation of why matching failed
- Matched entries shown in green, unmatched in red

### 3. Filter bar
- Text input to filter requests by path substring (case-insensitive, live filtering — no submit needed)
- Clears when the list is cleared
- Applied client-side after fetching (no re-fetch needed)

### 4. Header bar
- **Host** and **Port** text inputs — default `localhost` / `6081`, editable at runtime
- Changing either immediately updates all subsequent API calls and reconnects
- Settings are persisted to `localStorage` so they survive page refresh
- Connection indicator: green dot when MockServer is reachable, red when not
- Auto-refresh toggle + interval display

---

## MockServer API endpoints used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PUT` | `/mockserver/retrieve?type=request_responses` | All received requests + responses |
| `PUT` | `/mockserver/retrieve?type=logs` | Full log with matching details; accepts request filter in body |
| `PUT` | `/mockserver/retrieve?type=active_expectations` | (optional) show configured expectations |
| `PUT` | `/mockserver/reset` | Clear all recorded requests and logs |

---

## Non-goals
- No support for configuring expectations (that stays in `main.js`)
- No SOAP-specific rendering
- No authentication support
- No production build optimisation needed (dev tool only)
