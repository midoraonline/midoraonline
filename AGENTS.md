# AGENTS.md — Midora Online Engineering Rules

Authoritative rules for any AI/coding agent working in **this** Midora workspace.
Read before writing code. Prefer these over general defaults; when in conflict with
older code in scope, follow this file and update the old code.

Companion docs:
- `AGENTS.UI.md` — UI density, stacking, and visual polish details
- Backend lives in sibling repo `midoraapi` (FastAPI); apply §5 there

---

## Stack (source of truth)

| Layer | Technology |
| --- | --- |
| Web app | **Next.js 16** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4** |
| HTTP client | **axios** via `lib/api/base.ts` (`apiFetch` / `apiHttp`) — not raw `fetch` for Midora API |
| Data UX | **SWR**, **Zustand** (`useSessionStore`) |
| Auth | **Custom JWT** (access + refresh) issued by FastAPI; HttpOnly cookies `midora_access` / `midora_refresh` |
| Uploads | **UploadThing** (bearer verified against `/auth/me`) |
| Realtime | **Supabase Realtime** with short-lived JWT from `/auth/me` |
| API | **FastAPI** + **Pydantic** + **Supabase/PostgREST** (`midoraapi`) |
| Payments | **Pesapal** (subscribe + IPN webhook) |
| Deploy | **Vercel** (frontend + Python API) |

Do **not** introduce Auth.js, Drizzle, NestJS, or React Native patterns into this repo unless the product explicitly adds that surface.

---

## Table of contents

1. [Core principles](#1-core-principles)
2. [UI tokens & precision craft](#2-ui-tokens--precision-craft)
3. [Next.js App Router (this repo)](#3-nextjs-app-router-this-repo)
4. [Auth, cookies & API client](#4-auth-cookies--api-client)
5. [FastAPI backend (`midoraapi`)](#5-fastapi-backend-midoraapi)
6. [Quality, git & checklist](#6-quality-git--checklist)

---

## 1. Core principles

### 1.1 Clean boundaries & DRY

- **Separation of concerns**: UI components do not own HTTP details; call `lib/api/*`. Domain/authz rules live on the API (`core/authz.py`, route dependencies), not only in the UI.
- **Single responsibility**: one focused module per concern (`lib/api/shops.ts`, `payments/service.py`).
- **DRY**: if navigation, API shapes, category maps, or filter logic appear twice, extract (`lib/browseCategories.ts`, `lib/productCardMap.ts`, shared authz helpers).
- **Composition over inheritance**: prefer small props/children wrappers. Backend modules follow `AppModule` registration in `app/factory/routers.py`.

### 1.2 Concise code & early returns

- Target under 150 lines for new components/modules when practical. Existing large files (`ProductFormPage`, admin clients) should be split when you touch them — do not grow them.
- Early returns and guard clauses; avoid nested pyramids.
- Prefer map/filter over mutating loops for transforms.

### 1.3 Comments & dead code

- At most **one short line** explaining non-obvious *why* (proxy TLS, cookie Path quirks, etc.).
- No commented-out code, unused imports, or leftover `console.log` in committed code.

### 1.4 Security & config

- **Zero secrets in git**. Use `.env` / Vercel env; keep `.env*` gitignored.
- Never put `SUPABASE_SERVICE_ROLE_KEY` (or mail passwords) in the Next.js client bundle. Service role belongs only on the API.
- Validate inputs with **Zod** (frontend forms) and **Pydantic** (API).
- Passwords: **bcrypt** on the API; never log tokens, OTPs, or raw payment payloads.
- Propagate **`X-Correlation-Id`** on API calls (`apiFetch` already sets it).

### 1.5 Observability

- API: structured logging + correlation id middleware (`app/factory/middleware.py`).
- Prefer `ApiError` with `status` + `code` over opaque failures in the UI (toast the `detail`).

---

## 2. UI tokens & precision craft

Follow Midora’s semantic tokens in `app/globals.css` (background, foreground, muted, accent, border, surface, radius). Prefer token classes (`bg-background`, `text-muted`, `border-border`) over hardcoded hex.

### 2.1 Interaction & a11y

- Focus: visible rings (`dm-focus` / `focus-visible:ring-*`).
- Touch targets ≥ 44px on mobile primary actions.
- Respect `prefers-reduced-motion`.
- Contrast: aim WCAG 2.1 AA (4.5:1) in light and dark.

### 2.2 Components

- Buttons: primary / secondary / ghost / outline with crisp radius and `active:scale-[0.98]`.
- Cards: surface/card tokens, light border, restrained shadow.
- Forms: border-input, muted placeholders, clear error text (not only color).

### 2.3 Mobile search (important)

- **One** mobile product search entry point: the **navbar search icon** that expands `ProductSearchBar`.
- Do **not** render a second always-visible mobile search on the home feed (or elsewhere) that duplicates the navbar control.

More UI density rules: `AGENTS.UI.md`.

---

## 3. Next.js App Router (this repo)

### 3.1 Routing & layouts

- Route groups are first-class:
  - `(main)` — public marketplace shell (navbar/footer)
  - `(auth)` — login / register / verify
  - `(merchant)`, `(customer)`, `(admin)`, `(chat)` — role shells
- **Server Components by default.** `"use client"` only for state, effects, browser APIs; push it as far down as possible.
- `params` / `searchParams` are **Promises** — always `await` them.
- Use Metadata API (`metadata` / `generateMetadata`).
- Edge gate: `proxy.ts` (Next 16). Keep it edge-safe (no DB). Protect prefixes with cookie presence checks; still re-check auth in server data loaders.

### 3.2 Page titles & width

- Navbar already shows the page label for many routes — **do not duplicate** that as an in-body `<h1>` when it restates the header.
- Dashboards use the full layout width; avoid pointless `max-w-2xl` clamps on tool pages. Reading-optimized forms may stay narrower.

### 3.3 Data loading

- Browser → Midora API: **`apiFetch` / `lib/api/*`** (axios; cookies via `/api/dev-proxy` for `/api/v1/*`).
- RSC / route handlers: `serverApiFetch` / `lib/api/server.ts` (Bearer from `midora_access`).
- Client lists: **SWR**; session: **Zustand** + `AppStateProvider` hydration on `AUTH_CHANGED`.
- Colocate skeletons under `components/skeletons/` matching layout geometry.

### 3.4 File organization

- Feature UI under `components/<area>/`; API wrappers under `lib/api/`.
- Route-only private folders: `_components/`.
- Keep `lib/api/base.ts` as the only place that knows axios timeouts, refresh-on-401, and correlation headers.

---

## 4. Auth, cookies & API client

### 4.1 Cookie model

- Access: `midora_access` (short TTL), refresh: `midora_refresh`.
- Browser traffic for `/api/v1/*` goes through **`/api/dev-proxy`** so Set-Cookie binds to the frontend host (SSR can read cookies).
- After login/register/Google/verify: call **`/api/auth/set-cookies`** with tokens, then `notifyAuthChanged()` so `AppStateProvider` re-hydrates `/auth/me`.
- Logout must:
  1. `resetSession()` immediately
  2. Clear frontend cookies (`/api/auth/clear-cookies` — all Path/SameSite/Secure variants)
  3. Hit logout via proxy **and** API host
  4. Clear cookies again
- Never silently ignore `set-cookies` failures on login.

### 4.2 Authorization UX vs enforcement

- Navbar/`proxy.ts` cookie checks are UX only.
- Server loaders and API routes enforce auth. Merchant/admin mutations must fail closed without a valid access token / role.

### 4.3 axios rules

- Use `apiFetch` for JSON Midora API calls.
- Use `apiHttp` for same-origin auth helpers (clear-cookies, logout proxy).
- Leave raw `fetch` only for streaming/binary/proxy edge cases (`app/api/dev-proxy`, image watermark upstream, geocode), not for ordinary JSON API traffic.

---

## 5. FastAPI backend (`midoraapi`)

### 5.1 Module layout

- Feature packages: `auth/`, `shop/`, `marketplace/`, `payments/`, `admin/`, `feed/`, `listingModeration/`, `notifications/`, …
- Wire modules in `app/factory/routers.py` (`AppModule` registry).
- Thin routers → services → Supabase client. Shared authz: `core/authz.py` (`ensure_shop_owner`, `ensure_product_owner`).
- Config: `core/config.py` (`pydantic-settings`). Production boot must refuse default `APP_JWT_SECRET` / missing critical keys.

### 5.2 Auth & data access

- JWT access + rotating refresh (`jti` store). Cookie helpers in `auth/cookies.py`.
- Prefer **user-scoped** Supabase access when JWT/RLS is correctly configured. Do **not** expand the temporary “always service role” shortcut in `get_supabase_client` — treat RLS restoration as high priority; until then, every admin-client route **must** enforce ownership/role checks in Python.
- Admin router: `dependencies=[Depends(require_admin)]`. Align `staff` vs `admin` with the frontend if both roles exist.
- Rate-limit auth/OTP/AI buckets (`core/rate_limit.py`); on serverless, plan for a shared store.

### 5.3 Errors & payments

- Stable error envelope via `app/factory/errors.py`: `{ detail, code }`.
- Pesapal IPN is public; in production re-verify status via Pesapal API before activating plans; log + idempotency via `pesapal_webhook_logs`.

### 5.4 Tests

- Add pytest next to changed behavior (auth, authz, webhook). Do not ship payment/auth changes with zero tests.

---

## 6. Quality, git & checklist

### 6.1 Git

- Conventional commits: `feat|fix|refactor|docs|chore(scope): …`
- Branches: `feat/…`, `fix/…`, etc.
- Before push: `npm run typecheck` (frontend) / targeted pytest (API).

### 6.2 Pre-commit checklist

- [ ] No duplicate mobile search (navbar icon only)
- [ ] API calls go through axios `apiFetch` / `apiHttp` (except documented proxy/binary cases)
- [ ] No new secrets; service role not in Next client env
- [ ] Ownership/role checks on any admin-client / mutation path
- [ ] Cookies cleared completely on logout; session reset immediately
- [ ] Server Components default; `"use client"` minimized
- [ ] No duplicate page `<h1>` that restates the navbar title
- [ ] Tokens/colors from CSS variables, not random hex
- [ ] Typecheck/lint clean; no `console.log` left behind
- [ ] Tests for auth/payment/authz changes

---

## Anti-patterns (do not do)

- Second always-visible mobile `ProductSearchBar` on home in addition to the navbar icon
- Calling FastAPI with raw `fetch` from feature code instead of `apiFetch`
- Trusting only `proxy.ts` cookie presence for authorization
- Growing 800+ line form/admin files without splitting when editing them
- Documenting Auth.js/Drizzle/NestJS as Midora’s stack (it is not)
