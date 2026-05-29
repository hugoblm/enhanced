# Design System — Obra shadcn/ui Kit

> _Last verified: 2026-05-27 against branch `feat/design-system`._

---

## Provenance

- **Kit**: Obra shadcn/ui community edition 1.6.0
- **Figma**: https://www.figma.com/design/73iSHOmT7JfFixxC8KmKqX
- **Base**: shadcn/ui (Tailwind CSS v4)
- **Token source files**: `DesignSystem/` (Figma export, not committed — reference only)

---

## Color Tokens

Values are hex, extracted from `DesignSystem/semantic colors/shadcn.tokens.json` (light) and `shadcn-dark.tokens.json` (dark). Implemented in `src/app/globals.css`.

### Light mode (`:root`)

| CSS Variable | Hex | Obra source |
|---|---|---|
| `--background` | `#FFFFFF` | white |
| `--foreground` | `#0A0A0A` | brand-neutrals/950 |
| `--card` | `#FFFFFF` | white |
| `--card-foreground` | `#0A0A0A` | brand-neutrals/950 |
| `--popover` | `#FFFFFF` | white (aligned on `--card`) |
| `--popover-foreground` | `#0A0A0A` | brand-neutrals/950 (aligned on `--card-foreground`) |
| `--primary` | `#171717` | brand-neutrals/900 |
| `--primary-foreground` | `#FAFAFA` | brand-neutrals/50 |
| `--secondary` | `#F5F5F5` | brand-neutrals/100 |
| `--secondary-foreground` | `#171717` | brand-neutrals/900 |
| `--muted` | `#F5F5F5` | brand-neutrals/100 |
| `--muted-foreground` | `#737373` | brand-neutrals/500 |
| `--accent` | `#F5F5F5` | brand-neutrals/100 |
| `--accent-foreground` | `#171717` | brand-neutrals/900 |
| `--destructive` | `#DC2626` | red/600 |
| `--border` | `#E5E5E5` | brand-neutrals/200 |
| `--input` | `#FFFFFF` | white |
| `--ring` | `#D4D4D4` | brand-neutrals/300 |

### Dark mode (`.dark`)

| CSS Variable | Hex | Obra source |
|---|---|---|
| `--background` | `#0A0A0A` | brand-neutrals/950 |
| `--foreground` | `#FAFAFA` | brand-neutrals/50 |
| `--card` | `#171717` | brand-neutrals/900 |
| `--card-foreground` | `#FFFFFF` | white |
| `--popover` | `#171717` | brand-neutrals/900 (aligned on `--card`) |
| `--popover-foreground` | `#FFFFFF` | white (aligned on `--card-foreground`) |
| `--primary` | `#F5F5F5` | brand-neutrals/100 |
| `--primary-foreground` | `#0A0A0A` | brand-neutrals/950 |
| `--secondary` | `#262626` | brand-neutrals/800 |
| `--secondary-foreground` | `#F5F5F5` | brand-neutrals/100 |
| `--muted` | `#171717` | brand-neutrals/900 |
| `--muted-foreground` | `#A3A3A3` | brand-neutrals/400 |
| `--accent` | `#171717` | brand-neutrals/900 |
| `--accent-foreground` | `#F5F5F5` | brand-neutrals/100 |
| `--destructive` | `#9E4042` | custom (intentional dark contrast) |
| `--border` | `#404040` | brand-neutrals/700 |
| `--input` | `rgb(255 255 255 / 5%)` | white/alpha-5 |
| `--ring` | `#404040` | brand-neutrals/700 |

### Sidebar tokens (both modes)

| CSS Variable | Light | Dark |
|---|---|---|
| `--sidebar` | `#FAFAFA` | `#0A0A0A` |
| `--sidebar-foreground` | `#404040` | `#D4D4D4` |
| `--sidebar-primary` | `#171717` | `#FAFAFA` |
| `--sidebar-primary-foreground` | `#FAFAFA` | `#171717` |
| `--sidebar-accent` | `#F5F5F5` | `#171717` |
| `--sidebar-accent-foreground` | `#171717` | `#F5F5F5` |
| `--sidebar-border` | `#E5E5E5` | `#262626` |
| `--sidebar-ring` | `#D4D4D4` | `#404040` |

### Chart colors (both modes)

| CSS Variable | Light | Dark |
|---|---|---|
| `--chart-1` | `#F54A00` (orange) | `#1447E6` (blue) |
| `--chart-2` | `#009689` (teal) | `#00BC7D` (green) |
| `--chart-3` | `#104E64` (dark teal) | `#FD9A00` (orange) |
| `--chart-4` | `#FFB900` (golden) | `#AD46FF` (purple) |
| `--chart-5` | `#FE9A00` (amber) | `#FF2056` (red) |

---

## Border Radius

Source: `DesignSystem/border.shadcn.tokens.json`

| CSS Variable | Value | Derivation |
|---|---|---|
| `--radius` | `0.625rem` (10px) | Base radius |
| `--radius-sm` | `calc(var(--radius) * 0.6)` | 6px |
| `--radius-md` | `calc(var(--radius) * 0.8)` | 8px |
| `--radius-lg` | `var(--radius)` | 10px |
| `--radius-xl` | `calc(var(--radius) * 1.4)` | 14px |
| `--radius-2xl` | `calc(var(--radius) * 1.8)` | 18px |

---

## Typography

Fonts loaded via Google Fonts `<link>` in `src/app/layout.tsx`.

### Font families

| CSS Variable | Stack | Primary font | Use |
|---|---|---|---|
| `--font-heading` | Kedebideri, Cantarell, system-ui, sans-serif | Kedebideri | H1–H4, section titles |
| `--font-ui` | Kedebideri, Cantarell, system-ui, sans-serif | Kedebideri | Buttons, pills, captions uppercase |
| `--font-body` / `--font-sans` | Cantarell, system-ui, sans-serif | Cantarell | Body, paragraphs |
| `--font-mono` | JetBrains Mono, ui-monospace, Menlo, monospace | JetBrains Mono | Data, queries, shortcuts |

### Font weights loaded

| Font | Weights | Italics |
|---|---|---|
| Kedebideri | 400, 500, 600, 700, 800, 900 | No |
| Cantarell | 400, 700 | 400i, 700i |
| JetBrains Mono | 400, 500, 600 | No |

### Usage rules

| Element | Family | Weight |
|---|---|---|
| H1 / H2 / H3 / H4 | Kedebideri (`font-heading`) | 600 |
| Buttons, status pills, captions UPPERCASE | Kedebideri (`font-ui`) | 500 |
| Body, paragraphs | Cantarell (`font-body`) | 400 |
| Strong emphasis in body | Cantarell (`font-body`) | 700 |
| Voice transcripts, user quotes | Cantarell italic | 400i |
| Data, queries, shortcuts (⌘K) | JetBrains Mono (`font-mono`) | 400 / 500 |

---

## Format Decision

Tokens are stored in **hex** (not oklch) in `globals.css` for direct traceability to the Figma source. The `@theme inline` block is format-agnostic — it maps Tailwind classes to CSS variables regardless of color space.

---

## Maintenance

- **Source of truth**: Obra Figma file → exported token JSONs → `globals.css`
- **When updating colors**: extract new tokens from Figma, update `globals.css`, update this doc in the same commit
- **Every value in this doc must match `globals.css` exactly** — if they diverge, `globals.css` is right, fix this doc
