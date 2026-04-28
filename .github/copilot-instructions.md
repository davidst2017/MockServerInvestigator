# MockServer Investigator — Copilot Instructions

## Stack

React 19 + TypeScript + Vite. No CSS framework, no state management library, no router.

## Architecture rules

### 1. One fat component + small focused components
Every feature has one top-level "fat" component that composes the pieces (e.g. `RequestDetail.tsx`). All rendering details live in small single-responsibility sub-components. If a feature has more than one screen or sub-panel, create a dedicated folder (e.g. `src/components/RequestDetail/`).

### 2. Business logic in hooks
Any logic that involves state, side effects, or derived data belongs in a custom hook under `src/hooks/`. Components must not contain `useEffect`, `useCallback`, or `useRef` directly — they call a hook instead.

### 3. Fetch logic in dedicated hooks
Every API interaction has its own hook (e.g. `useRequestPolling`, `useExpectations`). Hooks call functions from `src/api/mockserver.ts`; they never call `fetch` directly. The API module is the only place raw `fetch` calls live.

### 4. UI components first
Before adding any inline JSX for a button, badge, table, or code block — check `src/components/ui/` first. If the UI primitive does not exist, create it there before using it. Current primitives:
- `Badge.tsx` — `MethodBadge`, `StatusBadge`, `MatchBadge`
- `KeyValueTable.tsx` — generic key/value table
- `CodeBlock.tsx` — `<pre>` wrapper

### 5. File layout

```
src/
  api/          # raw fetch functions only
  hooks/        # all custom hooks
  components/
    ui/         # reusable UI primitives
    Feature/    # folder per complex feature (sub-components + utils)
  types.ts      # all shared TypeScript types
```

## Conventions

- CSS lives in `App.css` using BEM-style class names — no inline styles except for truly one-off layout values.
- Types go in `src/types.ts`. Do not define local interfaces in component files unless they are props-only and private to that file.
- Hooks that fetch data must expose `loading` and `error` state.
- Abort in-flight fetch requests via `AbortController` when the triggering dep changes.
