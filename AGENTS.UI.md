# AGENTS.UI.md — Dashboard UI/UX Design Rules


Authoritative rules for any AI/coding agent building dashboard UI in this repo. **Read before designing screens.** Companion to `AGENTS.md` (engineering rules); when they overlap, both apply.


Stack: **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Recharts / Chart.js / Plotly**.


---


## 0. Meta-rules


- **Cockpit, not report.** Dashboards are tools people return to dozens of times a day. Density with discipline, not whitespace for its own sake.
- **Every element earns its pixels.** If a metric disappearing tomorrow wouldn't be noticed, it shouldn't be there today.
- **Ship both light and dark themes from day one.** Retrofitting dark mode later is one of the most painful refactors in a dashboard codebase.
- **Design and test at 1280–1366px as a first-class target.** A large share of real work-laptop traffic sits at or below this width. Dashboards designed only at 1920px commonly break one breakpoint down.


### 5-minute self-check before shipping any dashboard page


1. Count what competes for attention above the fold — more than six things and nobody has a clear first move.
2. Reload on a slow connection — does it show skeletons shaped like the real content, or a blank rectangle?
3. Empty a filter to zero results — does the empty state explain what happened and offer a way out?
4. Resize to ~1280–1366px — does it still work, or was it only designed at 1920px?
5. Try reaching a third-level page without a mouse — does keyboard navigation survive past the sidebar?


---


## 1. Full-Width Layout & Grid


### Use the full viewport width — no marketing-page max-width clamp


The `(main)` layout already provides responsive padding. Inside it, use the container's full width. **No page-level `max-w-2xl` / `max-w-3xl` clamp on dashboards.** If a max is needed for ultrawide, use `max-w-7xl mx-auto`.


Standard structure:


```
┌─────────────────────────────────────────────────────────┐
│ Header (full width, sticky, h-16)                        │
├───────────┬─────────────────────────────────────────────┤
│           │  KPI strip (4–6 cards)                       │
│ Sidebar   ├─────────────────────────────────────────────┤
│ 256px     │  12-column content grid                      │
│ (64px     │  charts / tables / panels                    │
│ collapsed)│                                               │
└───────────┴─────────────────────────────────────────────┘
```


### The 12-column grid, in Tailwind


```tsx
<main className="flex-1 min-w-0"> {/* min-w-0 prevents grid overflow */}
  <div className="p-3 sm:p-4 lg:p-6">
    {/* KPI strip — auto-fills, no breakpoint-specific columns needed */}
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 mb-6">
      <KpiCard /> <KpiCard /> <KpiCard /> <KpiCard />
    </div>
    {/* Content grid */}
    <div className="grid grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)]">
      <div className="col-span-12 lg:col-span-7">{/* chart */}</div>
      <div className="col-span-12 lg:col-span-5">{/* table */}</div>
      <div className="col-span-12">{/* full-width table */}</div>
    </div>
  </div>
</main>
```


### Grid cheatsheet


| Layout need | Tailwind classes |
| --- | --- |
| Full-width table/panel | `col-span-12` |
| Chart beside a data table | `col-span-12 lg:col-span-7` + `col-span-12 lg:col-span-5` |
| Three equal cards | `col-span-12 md:col-span-4` each |
| Sidebar detail panel (right) | `col-span-12 lg:col-span-4 lg:order-2` + main `lg:col-span-8 lg:order-1` |
| KPI card strip | `grid-cols-[repeat(auto-fill,minmax(200px,1fr))]` |


**Why Grid over Flexbox for content:** Flexbox handles one row well but fights you when panels align vertically across rows of mixed heights. `auto-rows-[minmax(200px,auto)]` keeps baselines aligned without JS measurement.


### Container queries — size components by their container, not the viewport


Container queries are production-safe as of 2026. Use `@container` on any card/chart wrapper that might be placed at different grid spans across pages:


```tsx
<div className="@container">
  <div className="flex flex-col @lg:flex-row @lg:items-center gap-4">
    {/* legend shows full labels at @lg container width, icons-only below —
        regardless of the actual viewport size */}
  </div>
</div>
```


---


## 2. Next.js Layout Structure


### One shared authenticated shell — sidebar and header live in a layout, not per-page


The `(main)/layout.tsx` shell renders once and persists across navigation. Because Next.js only re-renders the changed segment, the sidebar/header **don't remount or flash** between dashboard pages. This is a structural reason (not a styling one) to put chrome in a layout.


### Header rules


- `sticky top-0 z-10` with a **solid** background (`bg-background/95 backdrop-blur`), never fully transparent — translucent headers over scrolling table rows become unreadable.
- Single row, ~64px (`h-16`) tall. Breadcrumbs on the left orient the user; actions/identity on the right.
- **Page titles: do not duplicate what the header shows.** The `Navbar` derives a breadcrumb/title from `pathname` — `/settings` renders "Settings" at the top. Do not repeat that title as an `<h1>` inside the page body. Section headings (`<h2>`) inside the page are fine; those describe *content*, not the *page*.
- Drop the small `"ACCOUNT" / "TOOL"` uppercase eyebrow when the header already conveys the same context.


### Sidebar specs


| Property | Value |
| --- | --- |
| Expanded width | 256px (`w-64`) |
| Collapsed width | 64px (`w-16`) — icon + tooltip on hover |
| Nav item height | 36px desktop; 44px if reused in touch/tablet context |
| Section label | 12px, sentence case, muted color, 24px top margin |
| Active state | ~8% primary-color background fill **+ a 3px left accent border** — not color alone |
| Transition | ~200ms ease-in-out on **width only**, so content doesn't reflow/jump |


**Sidebar over top navigation for anything beyond ~10 sections.** Top nav either truncates into a hamburger or grows a second tier of tabs — both hide features. Sidebar stays visible and scales from 5 to 50 sections without restructuring.


---


## 3. Responsiveness


### Breakpoints — Tailwind defaults, don't invent new ones


| Prefix | Width | Typical device |
| --- | --- | --- |
| (base) | 0px+ | Mobile |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Small laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large/external displays |


### Rules per layout piece


- **Sidebar:** below `lg:`, becomes an off-canvas drawer that **overlays** content (doesn't push it):
  ```tsx
  <aside className={cn(
    "fixed inset-y-0 left-0 z-20 w-64 -translate-x-full transition-transform lg:static lg:translate-x-0",
    open && "translate-x-0"
  )}>
  ```
- **KPI strip:** `grid-cols-[repeat(auto-fill,minmax(200px,1fr))]` reflows from 4–6 across down to 1–2 with zero breakpoint code.
- **12-column content grid:** collapse to `col-span-12` (stacked) below `lg:`. Never squeeze two panels into unreadably narrow columns on a laptop screen.
- **Tables:** don't stack rows into cards below a breakpoint unless mobile is a *primary* use case. Default to horizontal scroll with a sticky first column:
  ```tsx
  <div className="overflow-x-auto">
    <table className="min-w-full">
      {/* sticky on th/td of the first column, not the whole thead */}
  ```
- **Charts:** wrap in `ResponsiveContainer` (Recharts) or a `@container`-aware wrapper. Never ship a fixed pixel width.
- **Filters:** horizontal bars work up to ~6–8 filters; beyond that, collapse into a drawer/panel.


Even for internal ops tools, plan for glanceable mobile access. It doesn't need feature parity — a collapsed drawer, stacked grid, and scrollable tables usually get you there.


---


## 4. Filters — UX Patterns


Filters are the most trust-fragile part of a dashboard. If a global filter visibly updates two charts but silently leaves a third unchanged, users stop trusting *every* number on the page.


### Rules


- **Every component either responds to an active global filter or clearly says it doesn't.** Silent non-response is the single biggest filter-related trust breaker.
- **Show active filters as persistent, removable chips** — never hidden behind a collapsed panel:
  ```tsx
  <div className="flex flex-wrap items-center gap-2">
    {activeFilters.map((f) => (
      <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm">
        {f.label}
        <button onClick={() => removeFilter(f.id)} className="text-muted-foreground hover:text-foreground">
          <X className="size-3" />
        </button>
      </span>
    ))}
    {activeFilters.length > 1 && (
      <button onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground">
        Clear all
      </button>
    )}
  </div>
  ```
- **"Clear all" must be immediately visible** once more than one filter is active — never in a submenu.
- **Design the zero-result state explicitly.** Say what happened and offer a way out ("No wells match Region: Europe + Status: Shut-in. Clear filters"), not a bare "No data".
- **Collapse into a filter drawer past ~6–8 filters**, triggered by a "Filters" button with an active-count badge:
  ```tsx
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" className="gap-2">
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && <Badge variant="secondary">{activeCount}</Badge>}
      </Button>
    </SheetTrigger>
    <SheetContent>{/* full filter form */}</SheetContent>
  </Sheet>
  ```
- **Placement:** page-scoped filters go directly above what they affect. Truly global filters (session-wide date range, org selector) go in the sticky header.


---


## 5. Theming — Tailwind v4 + CSS Variables


### Ship both themes from day one


Dark mode for people who stare at charts for hours is not cosmetic — it measurably reduces eye strain over multi-hour sessions. Set up the token system before building screens, not after.


### The pattern: raw CSS variables + non-inline `@theme`


Tailwind v4 is CSS-first. **Critical:** `@theme inline` bakes values at build time and breaks runtime theme switching. Use a **two-layer setup** — raw values in `:root` / `.dark`, mapped into utilities by a plain (non-inline) `@theme`.


```css
/* globals.css */
@import "tailwindcss";


/* Layer 1 — raw values, swapped at runtime by .dark */
:root {
  --color-background: oklch(100% 0 0);
  --color-surface:    oklch(98% 0 0);
  --color-foreground: oklch(20% 0 0);
  --color-muted:      oklch(55% 0 0);
  --color-border:     oklch(90% 0 0);
  --color-primary:    oklch(59% 0.24 255);


  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 1px 2px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06);
}


.dark {
  --color-background: oklch(14% 0 0);
  --color-surface:    oklch(18% 0 0);
  --color-foreground: oklch(96% 0 0);
  --color-muted:      oklch(65% 0 0);
  --color-border:     oklch(28% 0 0);
  --color-primary:    oklch(70% 0.19 255);


  /* Shadows need a dark-mode pass — near-invisible on dark backgrounds otherwise */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 1px 2px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
}


/* Layer 2 — maps raw variables to utilities. NOT @theme inline */
@theme {
  --color-background: var(--color-background);
  --color-surface:    var(--color-surface);
  --color-foreground: var(--color-foreground);
  --color-muted:      var(--color-muted);
  --color-border:     var(--color-border);
  --color-primary:    var(--color-primary);
}
```


### Flash-of-wrong-theme fix


Set the `dark` class on `<html>` via an inline script in the root layout's `<head>` (runs before hydration), not only in a client `useEffect`.


### Why CSS variables, not scattered `dark:` prefixes


Tailwind's `dark:` variant forces you to write every dark-mode override on every element — every new component doubles its color utilities. CSS variables flip the whole theme by swapping values at one point. For a dashboard with dozens of components, use variable tokens as the default.


### Semantic naming, not hue naming


Name tokens by **role** (`--color-primary`, `--color-danger`, `--color-surface`), not by hue (`--color-blue-600`). This is what makes a rebrand, multi-tenant color scheme, or high-contrast accessibility mode a single-point change.


---


## 6. Shadows & Elevation


Elevation is information, not decoration. Shadows communicate what floats above what, what's fixed vs. scrollable, what interrupts flow (modal) vs. what belongs to it (card). Used inconsistently — a modal with a lighter shadow than a card — it actively confuses hierarchy.


### Elevation scale — 3–4 levels, mapped to specific uses


| Level | Use | Token |
| --- | --- | --- |
| 0 | Base page background | `shadow-none` |
| 1 | Cards, table rows | `shadow-sm` |
| 2 | Dropdowns, popovers, sticky headers | `shadow-md` |
| 3 | Modals, dialogs, drawers | `shadow-lg` |


### The technique that separates convincing depth from a flat gray blur


A single shadow reads as a fuzzy gray outline, not depth. **Layer 2–3 shadows** at different blur radii and opacities:


```css
.card {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.08),
    0 4px 8px rgba(0, 0, 0, 0.06),
    0 16px 32px rgba(0, 0, 0, 0.04);
}
```


Three layers is enough — Material Design itself uses three. Beyond that, the visual gain is imperceptible and it costs paint performance.


### Rules


- **Use a dark, low-opacity color, never solid black.** `rgba(0,0,0,0.06–0.15)` blends into the surrounding UI; pure black looks harsh.
- **Opacity decreases as elevation increases** (counter-intuitively) — the shadow should get larger and *softer*, not just bigger.
- **Shadows need a dark-mode pass** — a shadow tuned for white background is near-invisible on dark surfaces. Bump opacity (`0.06 → 0.3+`) or lean on a lighter **surface color** to convey elevation in dark mode.
- **Promote shadow values into tokens.** Never paste literal `box-shadow` strings per component.
- **Performance:** `box-shadow` is GPU-composited and fine for static elements. Never animate its offset/blur on scrolling or frequently-updating elements — animate `opacity` or `transform` instead.
- **Use elevation sparingly.** Reserve level 2–3 for genuinely temporary/overlaying things (dropdowns, modals), not every card.


---


## 7. Color & Accessibility


### Palette structure


Keep the working palette to ~5–7 colors: one primary/brand, a couple of secondary accents, semantic colors (success/warning/danger), and a neutral gray scale. Generate a 5–10 shade scale for each — a flat single value per color isn't enough for real UI.


```css
:root {
  --color-success: oklch(65% 0.15 145);
  --color-warning: oklch(75% 0.15 85);
  --color-danger:  oklch(60% 0.20 25);
  --color-info:    oklch(60% 0.15 250);
}
```


### Contrast is non-negotiable


WCAG AA: **4.5:1** for normal text, **3:1** for large text (≥18pt/24px or ≥14pt/18.7px bold), **3:1** for non-text UI (icons, chart lines, input borders). Check every pairing — body text, badge text, placeholder text, muted text on card surfaces — with a tool like the WebAIM contrast checker. Insufficient contrast is the single most common accessibility failure in dashboards, because dense data UIs lean on light grays and pastel badges that often fail at a glance.


### Chart-specific rules


- **Never rely on color alone.** Pair red/green trend indicators with a shape (▲/▼) or label. Test in grayscale — if meaning disappears, it was color-only.
- **Override chart-library default palettes.** Built-in defaults frequently fail WCAG on white/dark backgrounds. Map series colors to your own token system.
- **Use a perceptually-designed palette** (ColorBrewer, Viridis family) for multi-series charts and heatmaps — built to stay distinguishable for color-vision deficiencies and to encode magnitude correctly in sequential data.
- **One consistent color strategy across the dashboard beats "perfect" per-chart colors.** Reuse the same semantic mapping (this blue = current period, this amber = warning) everywhere.


### Axis integrity


Semantic color doesn't fix a misleading axis. Bar charts start y-axis at zero. No 3D pies. No 3D anything. See `AGENTS.md` §12 for the full chart-integrity ruleset.


---


## 8. Component Patterns


### KPI card


```tsx
export function KpiCard({ label, value, delta, sparklineData }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-foreground">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className={cn("flex items-center gap-1 text-sm", delta >= 0 ? "text-success" : "text-danger")}>
          {delta >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
          {Math.abs(delta)}%
        </span>
        <MiniSparkline data={sparklineData} />
      </div>
    </div>
  );
}
```


- **One primary number** (large, high-contrast, ~28–32px), **one comparison** (vs. last period/target, small, secondary color), **one visual** (sparkline or trend arrow). Not all three chart types on one card.
- Short label ("Revenue", not "Total Revenue for the Current Reporting Period"). Explanations go in tooltips.
- Card width: 200–280px in a `grid-cols-[repeat(auto-fill,minmax(200px,1fr))]` row.
- **Cap the KPI strip at 4–6 numbers.** Every number must be something that changes someone's next action. Dashboards with 15+ KPI cards get ignored — the numbers become wallpaper and decision quality degrades past ~5–7 primary metrics.


### Table


```tsx
<div className="overflow-hidden rounded-lg border border-border">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="sticky top-0 z-[1] bg-surface border-b border-border">
        <tr>
          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Well</th>
          <th className="px-4 py-3 text-right font-medium text-muted-foreground">Pressure</th>
          <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/50">
            <td className="px-4 py-3">{row.well}</td>
            <td className="px-4 py-3 text-right tabular-nums">{row.pressure}</td>
            <td className="px-4 py-3 text-center"><StatusBadge status={row.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```


- **Sticky header on scroll**, solid background, legible over scrolling rows.
- **Row height:** 48–52px comfortable; 36–40px dense. Offer both as a density toggle if users span casual and heavy use.
- **Alignment:** left for text, right for numbers with `tabular-nums`, center for short status badges.
- **Pagination for reference tables** (data referenced by position). **Infinite scroll only for feeds** nobody bookmarks a position in.
- Don't collapse to stacked cards on mobile unless mobile is a genuinely primary use case — horizontal scroll with a pinned first column handles occasional tablet use with far less engineering.


---


## 9. Loading, Empty, Error States


Every dashboard component needs all three states designed. Engineering mechanics (Suspense, error boundaries) are in `AGENTS.md` §9–10. UX rules:


- **Skeletons, not spinners**, matching the real component's shape and dimensions exactly. Sets expectation of *what's coming*, measurably reduces perceived wait time, prevents layout shift on swap. `animate-pulse` only — no shimmer parties.
- **Empty state = icon/illustration + one sentence naming what happened + a clear way out.** ("No invoices yet — create your first invoice" / "No wells match these filters — clear filters"). A bare "No data" in gray is a dead end.
- **Error state scoped to the component**, not a full-page blocking modal. Red/amber inline banner with a retry action on the failing card, rest of the dashboard keeps working. One flaky endpoint should never take down a session.


---


## 10. Ship Checklist


- [ ] Content area uses full available width — no marketing-page max-width clamp.
- [ ] Layout tested at 1280–1366px, not just 1920px.
- [ ] Sidebar collapses to icon rail or drawer below `lg:`; content grid stacks to single column below `lg:`.
- [ ] KPI strip capped at 4–6 cards, each with exactly one number + one comparison + one visual.
- [ ] Header is sticky with a solid (non-transparent) background.
- [ ] Page does not repeat the header's title as an `<h1>` in the body.
- [ ] Active filters shown as removable chips with a visible "Clear all"; every chart either responds to global filters or explicitly says it doesn't.
- [ ] Filter bar collapses into a drawer past ~6–8 filters.
- [ ] Both light and dark themes implemented via CSS variables (not scattered `dark:` classes), verified for flash-free load.
- [ ] Shadows layered (2–3 levels), tokenized, with a higher-opacity pass for dark mode.
- [ ] Every text/background and icon/background pair checked against WCAG AA (4.5:1 text, 3:1 non-text).
- [ ] Color is never the only signal — trend/status indicators pair color with shape or label.
- [ ] Chart palette overrides the library default and uses a perceptually-distinct, colorblind-safe scale.
- [ ] Every async component has a shape-matched loading skeleton, a designed empty state, and a scoped error state.
- [ ] Table headers sticky on scroll; numbers right-aligned with `tabular-nums`; row height matches data density.
- [ ] Keyboard navigation reaches at least three levels deep without a mouse.


---


## Quick-reference


| Need | Use |
| --- | --- |
| Full-width dashboard | No `max-w-*` clamp; `max-w-7xl mx-auto` only for ultrawide |
| Multi-panel content area | `grid grid-cols-12 gap-6 auto-rows-[minmax(200px,auto)]` |
| KPI strip | `grid-cols-[repeat(auto-fill,minmax(200px,1fr))]` |
| Component sized by container | `@container` + `@lg:`, `@md:` variants |
| Persistent shell | Sidebar + header in `(main)/layout.tsx`, not per-page |
| Theme switching | CSS variables in `:root` / `.dark`, non-inline `@theme` map |
| Elevation | Tokenized shadow-sm / -md / -lg, layered (2–3 shadows), dark-mode pass |
| Active filter display | Removable chips + "Clear all", zero-result state names the cause |
| Filter overflow | Drawer past ~6–8 filters, with active-count badge on trigger |
| Loading | Shape-matched skeleton (`animate-pulse`), not a spinner |
| Empty | Icon + sentence + action, not "No data" |
| Error | Scoped inline banner with retry, not a page-level modal |
| Table on narrow screens | Horizontal scroll + sticky first column (default); stacked cards only if mobile is primary |
| Chart colors | Override library defaults, use colorblind-safe palette, pair color with shape/label |



