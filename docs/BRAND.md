# Midora Online — brand reference

Use this document as the single place for **UI colors**, **type**, and **logo** rules. Implementation lives in `app/globals.css` (`:root` and `@theme inline`) and `app/layout.tsx` (fonts).

---

## Colors (product UI)

These are the **canonical** values for the web app. Prefer CSS variables in components; Tailwind maps them to `bg-primary`, `text-accent`, `border-border`, etc.

| Role | Hex / value | Usage |
|------|-------------|--------|
| **Primary** | `#4A6767` | Primary buttons, strong brand emphasis, key interactive states |
| **On primary** | `#F9F9F8` | Text and icons on primary buttons (`primary-foreground`) |
| **Accent** | `#66798F` | Links, secondary highlights, icon hovers, selection tint |
| **Secondary** | `#757779` | Supporting text, less prominent labels |
| **Background** | `#F1F4F8` | Page background (cool neutral, aligned with accent) |
| **Surface** | `#FFFFFF` | Cards, inputs, elevated panels |
| **Foreground** | `#2A3331` | Primary body and heading text |
| **Muted** | `#757779` | Helper text, captions (same as secondary in practice) |
| **Border** | `rgba(102, 121, 143, 0.14)` | Default borders and dividers |
| **Ring** | `rgba(102, 121, 143, 0.22)` | Focus rings (`focus-visible`) |

**Shadows (subtle):** use the existing tokens in `globals.css` (`--shadow`, `--shadow-sm`) — soft, accent-tinted, not heavy.

**Do not** introduce ad hoc greens, purples, or high-chrome gradients for core surfaces; stay within this cool, muted system unless you are illustrating a specific state (e.g. success/error) and keep those restrained.

---

## Typography

| Role | Font | Weights | Where |
|------|------|---------|--------|
| **UI / body** | Plus Jakarta Sans | 400–700 | Default `body`, forms, nav |
| **Display / marketing** | Fraunces | 500–700 | Class `font-display` — hero headings, editorial moments |
| **Code / technical** | IBM Plex Mono | 400–500 | Code snippets, IDs if needed |

Load paths: `next/font/google` in `app/layout.tsx` (`--font-plus-jakarta`, `--font-fraunces`, `--font-ibm-plex-mono`).

**Wordmark:** set **“Midora Online”** in Plus Jakarta Sans, semibold, tight tracking — as used next to the logo in auth and nav.

---

## Logo (Midora Online mark)

### Asset

- **File:** `public/logo.png`
- **Public URL:** `/logo.png` (also used as OG fallback in shop metadata when no shop logo exists)

### Design (current mark)

The logo is a **flat, vector-style illustration** of **two storefronts** side by side on a shared base:

- **Backdrop:** a solid dark **maroon / wine** shape suggesting a wide **“M”** or twin peaks behind the shops.
- **Storefronts:** scalloped **awnings** — upper stripe in **warm cream** with **maroon** diagonal stripes; lower scalloped edge **maroon**.
- **Left shop:** large window with light **glare** lines; door with vertical handle.
- **Right shop:** double doors with handles.
- **Style:** thick outlines, rounded corners on awnings and handles, **no gradients or shadows** in the mark itself.

**Approximate colors in the artwork** (for illustration exports or future vector work):

- Dark: `#4A0E0E` – `#5C1616`
- Light: `#FAD4C0` – `#F9D9C3`

### Usage in the app

- Treat the mark as **square**; use **`rounded-xl`** (or **`rounded-2xl`** for larger hero use) to match UI radius language.
- **Typical sizes:** ~48px navigation; ~56–60px auth header; scale proportionally, never stretch non-uniformly.
- **Alt text:** `Midora Online` (or include context, e.g. shop name only for merchant logos).
- **Background:** Prefer placing on **surface** or **page background**; avoid busy patterns behind the maroon/cream mark.

### Relationship to UI green (`#4A6767`)

The **UI primary** is a muted teal; the **logo** uses **maroon and cream**. That pairing is intentional for now: the mark reads as a warm “marketplace” icon while the interface stays cool and calm. If you produce a **secondary logo variant** (monochrome or recolored), prefer mapping dark shapes to **`#4A6767`** and lights to **`#F9F9F8`** or **`#F1F4F8`** for lockups on marketing materials or favicons.

### Merchant / shop logos

Shops use **uploaded** logos (`logo_url`), not this file. Guidelines for merchants: square or near-square, readable at small sizes, simple backgrounds.

---

## Quick reference for designers

- **UI palette:** teal primary `#4A6767`, slate accent `#66798F`, gray secondary `#757779`, cool gray page `#F1F4F8`.
- **Logo file:** `public/logo.png` — dual storefront, maroon + cream, flat.
- **Type:** Plus Jakarta Sans (UI) + Fraunces (display).
