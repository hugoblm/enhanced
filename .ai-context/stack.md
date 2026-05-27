# Stack & Dependencies

> _Last verified: 2026-05-27 against branch `staging`._

---

## Runtime

- **Node**: 22 (nvm)
- **Package manager**: npm
- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)

---

## Dependencies (production)

| Package | Version | Purpose | Used? |
|---------|---------|---------|-------|
| `next` | 16.2.6 | Framework | Yes |
| `react` / `react-dom` | 19.2.4 | UI | Yes |
| `geist` | ^1.7.1 | Geist font (local, not Google Fonts) | Yes |
| `@supabase/supabase-js` | ^2.106.2 | Supabase client | Yes (configured) |
| `@supabase/ssr` | ^0.10.3 | Supabase server-side auth (cookies) | Yes (configured) |
| `tailwindcss` | ^4 | Styling | Yes |
| `@tailwindcss/typography` | ^0.5.19 | Prose styling for markdown | Installed, not used |
| `shadcn` | ^4.8.1 | Component CLI | Yes (initialized) |
| `@base-ui/react` | ^1.5.0 | shadcn/ui primitives | Yes (via shadcn) |
| `class-variance-authority` | ^0.7.1 | Component variants | Yes (via shadcn) |
| `clsx` / `tailwind-merge` | latest | Class merging (`cn()`) | Yes |
| `lucide-react` | ^1.16.0 | Icons | Installed, not used |
| `tw-animate-css` | ^1.4.0 | Animations | Installed, not used |
| `zod` | ^4.4.3 | Schema validation | Installed, not used |
| `react-hook-form` | ^7.76.1 | Form management | Installed, not used |
| `@hookform/resolvers` | ^5.4.0 | Zod resolver for RHF | Installed, not used |
| `zustand` | ^5.0.13 | Client state management | Installed, not used |
| `ai` | ^6.0.191 | Vercel AI SDK | Installed, not used |
| `@ai-sdk/mcp` | ^1.0.43 | MCP client for AI SDK | Installed, not used |
| `@openrouter/ai-sdk-provider` | ^2.9.0 | OpenRouter provider | Installed, not used |
| `react-markdown` | ^10.1.0 | Markdown rendering | Installed, not used |
| `remark-gfm` | ^4.0.1 | GitHub-flavored markdown | Installed, not used |
| `rehype-sanitize` | ^6.0.0 | HTML sanitization | Installed, not used |
| `nanoid` | ^5.1.11 | Short unique IDs | Installed, not used |
| `posthog-js` | ^1.376.2 | PostHog browser analytics | Installed, not used |
| `posthog-node` | ^5.21.2 | PostHog server analytics | Installed, not used |

---

## Key files

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `src/lib/supabase/server.ts` | Server Supabase client (reads cookies) |
| `src/lib/supabase/middleware.ts` | Session refresh logic (`updateSession`) |
| `src/middleware.ts` | Next.js middleware — calls `updateSession` on every request |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/components/ui/button.tsx` | shadcn/ui Button (only component installed so far) |

---

## CLIs

| Tool | Version | Source | Purpose |
|------|---------|--------|---------|
| Vercel CLI | 54.4.1 | Homebrew (`vercel-cli`) | Deploy, env management |
| Supabase CLI | 2.101.0 | Homebrew (`supabase/tap`) | DB migrations, type generation |

---

## Supabase project

- **Project ref**: `gzuhqxzvapnalztkoaca`
- **URL**: `https://gzuhqxzvapnalztkoaca.supabase.co`
- **Region**: configured via Supabase dashboard
- **Tables**: none (no migrations yet)
- **Auth**: Magic Link enabled (no password, no OAuth)
- **Local config**: `supabase/config.toml` (linked via `supabase link`)
