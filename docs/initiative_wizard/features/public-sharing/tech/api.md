# API — Public Sharing

> The `/p/[slug]` public page, `generateMetadata` for OG tags, `togglePublic` and
> `getShareUrl` Server Actions, and the share toggle UI.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Page: /p/[slug] (Server Component)

**File:** `src/app/p/[slug]/page.tsx`

### generateMetadata

Builds OG meta tags for social preview unfurling. Runs server-side before the page renders.

```typescript
import type { Metadata } from 'next'
import { getPrdBySlug } from '@/lib/prd/sharing'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const prd = await getPrdBySlug(slug)

  if (!prd) {
    return { title: 'Not Found — Enhanced' }
  }

  const summaryBlock = prd.blocks.find((b) => b.block_type === 'executive_summary')
  const description = summaryBlock?.content
    ? stripEvidenceTags(summaryBlock.content).slice(0, 160)
    : 'Draft PRD created with Enhanced'

  return {
    title: `${prd.title} — Enhanced`,
    description,
    openGraph: {
      title: prd.title,
      description,
      siteName: 'Enhanced',
      type: 'article',
    },
  }
}

// Strip [Evidence], [Assumption], [To verify] text from OG description
function stripEvidenceTags(text: string): string {
  return text
    .replace(/\[Evidence\]/gi, '')
    .replace(/\[Assumption\]/gi, '')
    .replace(/\[To verify\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
```

### Page component

```typescript
import { notFound } from 'next/navigation'
import { getPrdBySlug } from '@/lib/prd/sharing'
import { PrdViewerServer } from '@/components/prd/prd-viewer-server'
import { PublicFooter } from '@/components/prd/public-footer'
import { trackPublicView } from '@/lib/analytics/posthog-server'

// REQUIRED: force-dynamic prevents Next.js from caching this page.
// Without it, toggling a PRD to private would still serve stale cached content.
// Immediate revocation depends on this setting.
export const dynamic = 'force-dynamic'

export default async function PublicPrdPage({ params }: PageProps) {
  const { slug } = await params
  const prd = await getPrdBySlug(slug)

  if (!prd) {
    notFound()
  }

  // Track view (fire-and-forget)
  trackPublicView(slug).catch(() => {})

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* PRD Header: title, score, recommendation */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold">{prd.title}</h1>
          {prd.confidence_score !== null && (
            <div className="flex items-center gap-3 mt-2">
              <ScoreBadge score={prd.confidence_score} />
              {prd.recommendation && (
                <RecommendationLabel recommendation={prd.recommendation} />
              )}
            </div>
          )}
        </header>

        {/* PRD blocks in sort order */}
        <PrdViewerServer blocks={prd.blocks} readOnly />

        {/* Footer */}
        <PublicFooter />
      </div>
    </main>
  )
}
```

**Note:** `PrdViewerServer` is a server-compatible version of `PrdViewer` that does not use
Zustand (no client-side store needed for read-only rendering). It receives blocks as props
and maps over them in sort order, rendering `PrdBlock` components with `readOnly=true`.

```typescript
// src/components/prd/prd-viewer-server.tsx

import { BLOCK_TYPES, BLOCK_HEADINGS } from '@/lib/prd/block-types'
import { PrdBlock } from './prd-block'
import type { EvidenceTag } from '@/stores/wizard-store'

interface Block {
  block_type: string
  content: string
  evidence_tags: EvidenceTag[]
}

interface PrdViewerServerProps {
  blocks: Block[]
  readOnly: boolean
}

export function PrdViewerServer({ blocks, readOnly }: PrdViewerServerProps) {
  const blockMap = new Map(blocks.map((b) => [b.block_type, b]))

  return (
    <div className="space-y-4">
      {BLOCK_TYPES.map((blockType) => {
        const block = blockMap.get(blockType)
        if (!block || !block.content) return null

        return (
          <PrdBlock
            key={blockType}
            blockType={blockType}
            heading={BLOCK_HEADINGS[blockType]}
            content={block.content}
            evidenceTags={block.evidence_tags ?? []}
            isJustUpdated={false}
            readOnly={readOnly}
          />
        )
      })}
    </div>
  )
}
```

### 404 page

**File:** `src/app/p/[slug]/not-found.tsx`

```typescript
import Link from 'next/link'

export default function PublicPrdNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-muted-foreground mb-6">
          Ce PRD n'existe pas ou n'est plus public.
        </p>
        <Link
          href="/"
          className="text-primary hover:underline"
        >
          Retour a Enhanced
        </Link>
      </div>
    </main>
  )
}
```

The same 404 page is shown whether the slug does not exist or the PRD is private. This is
intentional: revealing that a slug exists but is private would leak information (see
[`security.md`](security.md)).

---

## Data query: getPrdBySlug

**File:** `src/lib/prd/sharing.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { BLOCK_SORT_ORDER } from '@/lib/prd/block-types'

interface PrdWithBlocks {
  id: string
  title: string
  confidence_score: number | null
  recommendation: string | null
  blocks: {
    block_type: string
    content: string
    evidence_tags: { text: string; tag: string }[]
    sort_order: number
  }[]
}

export async function getPrdBySlug(slug: string): Promise<PrdWithBlocks | null> {
  const supabase = await createClient()

  // RLS policy "prds_select_public" allows SELECT when is_public = true
  // No auth required — the anon key is sufficient
  const { data: prd, error } = await supabase
    .from('prds')
    .select('id, title, confidence_score, recommendation')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single()

  if (error || !prd) return null

  const { data: blocks } = await supabase
    .from('prd_blocks')
    .select('block_type, content, evidence_tags, sort_order')
    .eq('prd_id', prd.id)
    .order('sort_order')

  return {
    ...prd,
    blocks: blocks ?? [],
  }
}
```

**Important:** The query explicitly filters `is_public = true` in addition to the RLS policy.
This is defense-in-depth: even if the RLS policy has a bug, the application layer enforces
the check.

---

## Server Action: togglePublic

**File:** `src/app/actions/sharing.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { trackEvent } from '@/lib/analytics/posthog-server'

interface ToggleResult {
  success: boolean
  isPublic?: boolean
  shareUrl?: string
  error?: string
}

export async function togglePublic(prdId: string): Promise<ToggleResult> {
  const supabase = await createClient()

  // 1. Authenticate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load PRD (verify ownership)
  const { data: prd, error: prdError } = await supabase
    .from('prds')
    .select('id, is_public, share_slug, session_id')
    .eq('id', prdId)
    .eq('user_id', user.id)
    .single()

  if (prdError || !prd) {
    return { success: false, error: 'PRD not found' }
  }

  // 3. Toggle
  const newIsPublic = !prd.is_public
  const slug = prd.share_slug ?? (newIsPublic ? nanoid(10) : null)

  const { error: updateError } = await supabase
    .from('prds')
    .update({
      is_public: newIsPublic,
      share_slug: slug,
    })
    .eq('id', prdId)

  if (updateError) {
    return { success: false, error: 'Failed to update PRD' }
  }

  // 4. Track event
  const eventName = newIsPublic ? 'prd_shared_publicly' : 'prd_unshared'
  await trackEvent(eventName, {
    session_id: prd.session_id,
    prd_id: prdId,
    slug,
  }).catch(() => {})

  // 5. Revalidate the public page (if it was cached)
  if (slug) {
    revalidatePath(`/p/${slug}`)
  }

  // 6. Return result
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enhanced.pm'
  const shareUrl = newIsPublic && slug ? `${baseUrl}/p/${slug}` : undefined

  return {
    success: true,
    isPublic: newIsPublic,
    shareUrl,
  }
}

export async function getShareUrl(prdId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: prd } = await supabase
    .from('prds')
    .select('share_slug, is_public')
    .eq('id', prdId)
    .eq('user_id', user.id)
    .single()

  if (!prd || !prd.is_public || !prd.share_slug) return null

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://enhanced.pm'
  return `${baseUrl}/p/${prd.share_slug}`
}
```

### Slug generation

```
nanoid(10) generates a 10-character string from the URL-safe alphabet:
A-Z, a-z, 0-9, _ and -

Examples: "xK9mN2pQ7w", "aBcDeF1234", "V7rT_p-2Kn"

Collision probability: 64^10 = 1.15 x 10^18 possible slugs.
At 1000 PRDs, collision probability is ~4.3 x 10^-13 (negligible).
```

---

## Client: Share toggle

**File:** `src/components/prd/share-toggle.tsx`

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { togglePublic } from '@/app/actions/sharing'
import { useWizardStore } from '@/stores/wizard-store'

export function ShareToggle() {
  const prdId = useWizardStore((s) => s.prdId)
  const [isPublic, setIsPublic] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    if (!prdId) return

    startTransition(async () => {
      const result = await togglePublic(prdId)
      if (result.success) {
        setIsPublic(result.isPublic ?? false)
        setShareUrl(result.shareUrl ?? null)
      }
    })
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="share-toggle" className="text-sm text-muted-foreground">
        Public
      </label>
      <Switch
        id="share-toggle"
        checked={isPublic}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label={isPublic ? 'Make PRD private' : 'Make PRD public'}
      />

      {isPublic && shareUrl && (
        <div className="flex items-center gap-2">
          <code className="text-xs bg-muted px-2 py-1 rounded truncate max-w-[200px]">
            {shareUrl}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            aria-label="Copy share link"
          >
            {copied ? 'Copie !' : 'Copier'}
          </Button>
        </div>
      )}
    </div>
  )
}
```

---

## Client: Public footer

**File:** `src/components/prd/public-footer.tsx`

```typescript
import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="mt-12 pt-6 border-t text-center">
      <p className="text-sm text-muted-foreground">
        Made with{' '}
        <Link
          href="/"
          className="font-medium text-foreground hover:underline"
        >
          Enhanced
        </Link>
        {' '}— enhanced.pm
      </p>
    </footer>
  )
}
```

---

## Score and recommendation display components

Used on the public page header (server-rendered):

```typescript
// Inline in /p/[slug]/page.tsx or extracted to shared components

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    : score >= 50
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${color}`}>
      {score}/100
    </span>
  )
}

function RecommendationLabel({ recommendation }: { recommendation: string }) {
  const labels: Record<string, string> = {
    build: 'Build',
    test_first: 'Test first',
    abandon: 'Abandon',
  }

  return (
    <span className="text-sm text-muted-foreground">
      Recommendation : {labels[recommendation] ?? recommendation}
    </span>
  )
}
```

---

## Environment variable

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_APP_URL` | `.env.local` + Vercel | Base URL for share links (`https://enhanced.pm` in production, `http://localhost:3000` in dev) |
