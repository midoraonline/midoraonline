# AGENTS.md — Production Engineering Rules


Authoritative rules for any AI/coding agent working in this repo. **Read before writing code.** Prefer these over general defaults; when in conflict with older code, follow this file and update the old code in scope.


Stack: **Next.js 16 (App Router, React 19) · TypeScript · Drizzle ORM (Postgres) · Auth.js v5 · SWR · FastAPI (external services) · Tailwind · Recharts / Chart.js / Plotly**.


---


## 0. Meta-rules


- **Minimalist.** No unrequested features, refactors, comments, or abstractions. Comments only when they say something the code cannot.
- **Modularize.** Small focused files, clear separation of concerns. Colocate route-only components under `_components/`.
- **Data-oriented.** Back non-trivial choices with a source (docs, benchmark, PR link) — no cargo-culting.
- **Corporate proxy.** All network installs (npm/pip/git) must go through the corporate proxy.
- **Encoding.** Never write TS/TSX via PowerShell `Set-Content` without `-Encoding utf8` (default UTF-16 LE breaks Next.js parsing). Prefer file-edit tools.
- **`.next` cache.** If a valid route 404s after moves/upgrades, stop dev server, delete `.next`, restart.


---


## 1. Project Architecture (App Router)


- Folders **are** the routing/loading/error contract — treat structure as first-class.
- **Server Components are the default.** Add `"use client"` only for state, effects, or browser APIs. Push `"use client"` as far *down* the tree as possible.
- Use **route groups** `(name)` to share layouts without touching the URL.
- **`params` / `searchParams` are Promises in Next.js 15+** — always `await` them.
- Use the **Metadata API** (`export const metadata` / `generateMetadata`) instead of hand-written `<title>`.
- `loading.tsx` and `error.tsx` are part of the route contract — see §9 and §10.
- Prefix route-only component folders with `_` (e.g. `_components/`) so they are not treated as routes.
- Middleware file is `middleware.ts` (renamed from `proxy.ts` in Next.js 16). Keep it edge-safe (no DB imports).


### 1.1 Page titles — do not duplicate what the header shows


The global `Navbar` (in `(main)` layout) derives a breadcrumb/title from `pathname` — e.g. `/settings` renders "Settings" at the top of every page.


**Do not repeat that title as an `<h1>` inside the page body.** Duplicating it wastes vertical space, dilutes hierarchy, and reads as noise.


Rules:
- Before adding a page-level `<h1>`, check whether the header already renders the same label (it will, for any single-segment route). If yes → **omit the `<h1>`**.
- Section headings (`<h2>`) for cards/panels inside the page are fine and expected — those describe *content*, not the *page*.
- If a page genuinely needs an in-body title different from the header (e.g. a nested detail view with a specific entity name), use it — but never restate the header verbatim.
- The small `"ACCOUNT" / "TOOL" / …` uppercase eyebrow above an `<h1>` is also redundant when the header already conveys the same context. Drop it unless it adds real information.
- Route-group segments like `(main)` don't appear in the breadcrumb, so those don't count as "shown in the header".


### 1.2 Space utilization — dashboards use the full container width


The `(main)` layout already provides responsive padding (`p-3 sm:p-4 lg:p-6`). Inside that, **use the full available width.** Do not slap `max-w-2xl` / `max-w-3xl` on a page and leave the rest of the screen empty.


Rules:
- **No page-level narrow `max-w-*` clamp on dashboards.** The default width is "the container the layout gives you". If you need a max, use `max-w-7xl` (matches `all-tools`) and `mx-auto` so it centers on ultrawide.
- **Compose horizontally with a responsive grid** (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4/6`) so cards fill the row instead of stacking in a narrow column. Bias wider cards with `md:col-span-2` etc.
- **Narrow clamps are only justified for reading-optimized forms** (long paragraphs of prose, single-column signup forms). A dashboard, settings page, or tool page is never that.
- Charts / tables / lists should stretch to their container, not sit inside a narrow wrapper that leaves whitespace on either side.
- If a card genuinely has little content, group it in a row with siblings — don't let it span the full width alone unless it's the only card on that row.


## 2. Authentication


- Use **Auth.js v5** (`next-auth@beta`). Do not roll our own.
- **Split configs:** `auth.config.ts` (edge-safe, no adapter/db) imported by `middleware.ts`; `auth.ts` (full config with Drizzle adapter, providers) imported only in server contexts.
- **Providers:** Google, Microsoft (Azure AD / Entra ID), Credentials. Validate Credentials input with **Zod** in `authorize()`; compare with **bcrypt/Argon2**. Never log or store plaintext passwords.
- **JWT session strategy** for edge/serverless friendliness. Put only non-sensitive claims (`id`, `email`, `role`) in the JWT.
- Cookies: `httpOnly`, `secure` (prod), `sameSite: "lax"` (or `"strict"`). Always HTTPS.
- **Rate-limit** `/api/auth/*` (login, register, reset).
- **Middleware is not the authorization boundary.** Always re-check `auth()` **inside the Server Component / layout / Route Handler** that touches sensitive data. Reason: CVE-2025-29927 middleware bypass.
- Extend `Session` / `User` types via a `.d.ts` file to include `role`, `id`, etc.


## 3. SWR (client-side data fetching)


- **Default to Server Components** for reads. Only use SWR when data needs client-driven updates, must be shared across components via one cache entry, or requires focus/interval revalidation.
- Centralize the fetcher and global options (`revalidateOnFocus`, `dedupingInterval`, retry) in a single `SWRConfig` provider.
- Use **conditional keys** (`id ? \`/api/users/${id}\` : null`) instead of guarding inside the fetcher.
- **One key = one source of truth.** The same key must be used for `SWRConfig.fallback` (hydrated from server), the client read, and mutations.
- Optimistic updates: use `mutate(key, asyncFn, { optimisticData, rollbackOnError: true, revalidate: false })`. Do not use the legacy 3-arg `mutate(key, data, false)` pattern.
- No `useEffect` + `useState` fetching for new code.


## 4. Drizzle ORM


- **Never open a DB connection at module load in a way that runs during `next build`.** Guard behind env or lazy init if needed.
- Serverless/edge: `drizzle-orm/neon-http` with pooled URL, `prepare: false`.
- Long-running Node server: `drizzle-orm/node-postgres` with a `Pool`, tuned limits, graceful shutdown.
- Schema lives in `db/schemas/`. `relations()` is for `db.query.*` only; foreign keys come from `.references()`.
- **Migrations:** `drizzle-kit generate` + `drizzle-kit migrate` in prod. **Never `drizzle-kit push` in prod.** Run migrations **before** serving traffic — never inside a request handler.
- Multi-tenant: row-level (`tenantId` filtered on every query) is the default; back it with Postgres RLS as a safety net.
- DB client is a **singleton** at module scope.


## 5. FastAPI ↔ Next.js Integration


- Flow: **Browser → Next.js server (reads HttpOnly cookie) → FastAPI (Authorization: Bearer)**. Never expose the raw token to client JS. Never store JWT in `localStorage`.
- Auth.js Credentials provider calls FastAPI login inside `authorize()`, receives the token, Auth.js stores it inside its own encrypted HttpOnly session cookie.
- FastAPI stays **stateless**: verify JWT via a dependency; inject current user into protected routes.
- Validate every FastAPI input with **Pydantic**. Do not accept raw dicts.
- Client-side SWR calls must hit a **Next.js Route Handler**, not FastAPI directly. The Route Handler forwards the server-held token.
- Prefer generating a typed FastAPI client from OpenAPI (`openapi-typescript` / `orval`) with **Zod** validating the boundary.
- Keep the JWT contract (`sub`, `exp`, `role`) documented and independent of Auth.js internals so mobile/other clients can hit the same API.


## 6. User Context & State


- **Server-known data (session, role) does not belong in React Context.** Read via `auth()` in Server Components, pass as props.
- Context only for **client-side UI state** shared across a subtree.
- **Split contexts** by change frequency — one context per volatility class. Do not put user + theme + counters in one provider.
- **Memoize the provider `value` object.** A new object identity on every render re-renders all consumers.
- High-frequency state (inputs, scroll, live counters) belongs local, not in a broad Context.
- For complex client state, prefer **Zustand/Jotai** (this repo already uses Zustand in `stores/`) so subscribers can select a slice and skip broad re-renders.


### 6.1 The one allowed Context around auth: a thin action surface


The rule above bans **storing** session in Context. It does not ban a Context that **wraps** the already-canonical Zustand store to expose a stable action surface (`login`, `register`, `logout`, `refresh`, plus derived flags like `isAdmin` / `isMerchant`). This repo does exactly that in `lib/auth/AuthContext.tsx`:


- Zustand (`useSessionStore`) stays the single source of truth. Hydration and cross-tab sync still happen in `AppStateProvider` — the Context never fetches.
- `<AuthProvider>` reads a shallow slice with `useShallow` and memoizes the `value` object, so consumers that only use actions don't re-render when unrelated store keys change.
- Call sites choose the shape they want:
  - `useAppSession()` — pure state, unchanged, still preferred for read-only components.
  - `useAuth()` — state + login/register/logout/refresh + `isAdmin` / `isMerchant`. Preferred anywhere that also triggers an auth mutation, so the mutation and the analytics emit stay in one place.
- Do **not** introduce a second Context that also owns session state. Extend `AuthContext` instead.
- Do **not** put high-frequency state (typing, scroll) into `AuthContext`; it re-renders every consumer.


## 7. Performance / Re-renders


- **React Compiler is the primary mechanism.** If enabled, do not scatter manual `useMemo`/`useCallback`.
- Escape hatch: `"use no memo"` at the top of a Client Component the compiler must skip. Use sparingly — needing it broadly is a signal of a deeper problem.
- If manual memoization is required:
  - **Profile first.** Never memoize speculatively.
  - `useCallback` only helps when paired with a `React.memo`ed child. Otherwise it's noise.
  - Prefer **composition** (state colocation, `children` as prop) over memoization walls.
  - No inline object/array/function literals as props to memoized children.
- Fix Context re-render storms by splitting contexts and memoizing the `value` object.


## 8. Event-Driven / OOP


- Reach for EDA when: cross-cutting concerns (audit, notifications, cache invalidation), reactions must be added without touching the emitter, or async workflows.
- Trade-off: no single stack trace; consumers must be **idempotent**.
- In-process events: use a **typed `EventEmitter` wrapper** with an `EventMap`. No untyped `emitter.on("string", (any) => {})`.
- Classes only when justified: encapsulated state + behavior, enforced contract via interface, or DI for testability. Default to plain functions + data.
- Constructor-inject collaborators (repositories, clients). Do not import singletons inside domain logic.


## 9. Loading UI / Streaming


- `loading.tsx` is a Suspense boundary — use it for single-source pages.
- For pages with multiple independently-paced data sources, use **per-section `<Suspense>` boundaries** so fast sections stream in immediately.
- **Skeletons must match final dimensions exactly** (widths, grid, spacing) — zero layout shift on swap. Match the actual shape (cards stay cards, avatars stay circles).
- Animation: `animate-pulse` only. No shimmer parties.


## 10. Errors


- **`error.tsx`** (Client Component) — segment-level boundary. Nest at the segment where you want blast-radius contained.
- **`global-error.tsx`** — only for failures in the root `layout.tsx`. Renders its own `<html>`/`<body>`.
- For widget-level failures inside a page, use `react-error-boundary` around `<Suspense>`.
- **Never leak stack traces to the client in prod.** Log server-side with `error.digest`; show a generic actionable message.
- Every error UI must have a working `reset()` action.


## 11. Security Checklist (blocking for every PR)


- [ ] No secrets in `NEXT_PUBLIC_*`. These ship to the browser.
- [ ] All mutating API Routes verify **Origin/Host** (Server Actions do this by default; custom routes must add it or a CSRF token).
- [ ] Session cookies: `HttpOnly`, `Secure` (prod), `SameSite=Lax` or `Strict`.
- [ ] Every trust-boundary input validated (Zod for TS, Pydantic for FastAPI). Types alone are not validation.
- [ ] Auth re-checked in the Server Component/Route Handler, not only middleware (CVE-2025-29927).
- [ ] **Per-resource authorization**, not only per-route — verify the caller can access *this* record (no horizontal privilege escalation via guessable IDs).
- [ ] Outbound fetches from server code cannot be pointed at internal/metadata endpoints by user input (SSRF).
- [ ] Rate-limit `/api/auth/*` and other sensitive endpoints.
- [ ] Secrets in a secrets manager or platform env vars, scoped per env. Pre-commit secret scanning enabled.
- [ ] Consider CSP with nonces for inline scripts on sensitive pages.
- [ ] Keep Next.js patched — framework CVEs are real mitigations, not paperwork.


## 12. Charts & Data Visualization


### 12.1 Chart type by question
- Trend over time → **line** (area if magnitude matters).
- Precise comparison of a few categories → **bar** (column for short labels, horizontal for long labels or 10+ categories).
- Parts of a whole, **≤5 categories only** → pie/donut. Otherwise bar. **No 3D pies. No 3D anything.**
- Distribution → **histogram** (shape) or **box plot** (compare groups).
- Two numerics / correlation → **scatter** (bubble for a third dim).
- Hierarchical part-of-part → **treemap** / **sunburst**.
- Flow through stages → **funnel** (conversion) / **Sankey** (between categories).
- Starting-value → final-value additions/subtractions → **waterfall**.
- Geographic pattern → **choropleth map**.
- Density / activity by day×hour / correlation matrix → **heatmap**.
- One KPI → **stat card**, not a chart. Gauge only if a target band matters.


### 12.2 Guardrails
- **Bar/column y-axis starts at zero.** Non-negotiable.
- Line charts may zoom into a range only if the axis label calls it out.
- Prefer chart types the audience already reads for non-technical views.
- Never explicitly assign `undefined` to a Plotly trace property (`marker`, `line`, etc.) — Plotly's `'x' in obj` check crashes on `undefined` values. Use conditional spread: `...(cond ? { marker: {...} } : {})`.
- Never `Math.min(...arr)` / `Math.max(...arr)` on large arrays — stack overflow risk + NaN poisoning. Manual reduce loop only.


### 12.3 Volume → rendering strategy
- **< 1k points** → any SVG lib (Recharts) directly.
- **1k–10k** → SVG still fine; watch interaction frame time; consider server-side aggregation.
- **10k–100k** → Canvas (Chart.js / ECharts) or downsample first.
- **100k+ or streaming** → **aggregate/downsample server-side or in a Web Worker before the chart sees the data.** Use LTTB (`lttb` / `tsdownsample`) for time-series to preserve shape. No charting library saves you here — it's architectural.


### 12.4 Data source → strategy
- From our DB: aggregate in **SQL** (`GROUP BY`, `date_trunc`, window functions). Never pull 500k rows to sum them in the browser.
- High-resolution telemetry: **LTTB** downsample server-side.
- Streaming (websocket/polling): rolling window of the last N points (no unbounded arrays). Batch updates via `requestAnimationFrame` — don't re-render on every message.
- User-uploaded CSV/Excel with unknown volume: branch on row count → small = SVG chart; large = aggregate in a Web Worker first.


### 12.5 Library choices for this repo
- **Recharts** — default for dashboards up to ~10k points.
- **Chart.js / react-chartjs-2** — Canvas, 10k–100k range, already in deps.
- **Plotly** — existing usage; keep but respect the `undefined` trace-property rule above.
- **ECharts (`echarts-for-react`)** — reach for it when Recharts stutters or an exotic chart type is needed.
- **visx** — only when off-the-shelf can't express the design.


### 12.6 Next.js wiring
- Chart components are **Client Components**; fetch and aggregate in a Server Component and pass plain data as props.
- `ResponsiveContainer` needs the browser — keep the client boundary to the chart itself, not the whole page.
- Canvas libs (Chart.js, ECharts) generally need `dynamic(() => import(...), { ssr: false })` because they touch `window` at import.
- Wrap each chart in its own `<Suspense>` with a dimension-matched skeleton.
- **Memoize the `data` prop passed into a chart** — chart libs re-run internal layout on any reference change even when values are identical.


---


## Quick-reference


| Need | Use |
| --- | --- |
| Initial page load read | Server Component + direct DB query |
| Client-updating read | SWR, keyed consistently with server fallback |
| Form mutation | Server Action or SWR `mutate` (optimistic) |
| Auth (Google/MS/email) | Auth.js v5, split `auth.config.ts` / `auth.ts` |
| Call FastAPI | Server-side only; forward server-held token |
| Type-safe SQL | Drizzle singleton, `generate` + `migrate` in prod |
| Cross-cutting reactions | Typed `EventEmitter` (in-proc) or broker (distributed) |
| Prevent child re-render | React Compiler; else `memo` + stable props |
| Route loading | `loading.tsx` |
| Multiple paces on one page | Per-section `<Suspense>` |
| Contain a route crash | `error.tsx` at that segment |
| Compare few categories | Bar chart (pie only if ≤5) |
| Trend over time | Line (area if magnitude) |
| < 10k points | SVG (Recharts) |
| 100k+ / streaming | Aggregate/LTTB first → Canvas renderer |





