# API — PDF Export

> Route Handler, PDF components, font registration, and response contract for the PDF Export
> feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Route Handler: `GET /api/export/[prdId]/pdf`

**File:** `src/app/api/export/[prdId]/pdf/route.ts`

Generates and returns a branded PDF for the specified PRD.

### Authentication

Requires an authenticated user who owns the PRD (enforced by RLS on `prds` table).

### Request

```
GET /api/export/{prdId}/pdf
```

**Path parameters:**
- `prdId` (UUID) — the PRD to export.

### Response

**200 OK:**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="enhanced-prd-{slug-or-title}.pdf"
Content-Length: {byte count}
```

Body: raw PDF binary data.

**401 Unauthorized:**

```json
{ "error": "Unauthorized" }
```

**404 Not Found:** PRD does not exist or user does not own it.

```json
{ "error": "PRD not found" }
```

**500 Internal Server Error:** PDF rendering failed.

```json
{ "error": "Failed to generate PDF" }
```

### Implementation

```typescript
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePrdPdf } from '@/lib/pdf/generate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prdId: string }> }
) {
  const { prdId } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Load PRD (RLS enforces ownership)
  const { data: prd, error: prdError } = await supabase
    .from('prds')
    .select('id, title, share_slug, confidence_score, recommendation, created_at')
    .eq('id', prdId)
    .single();

  if (prdError || !prd) {
    return NextResponse.json({ error: 'PRD not found' }, { status: 404 });
  }

  // Load all blocks, ordered by sort_order
  const { data: blocks, error: blocksError } = await supabase
    .from('prd_blocks')
    .select('id, block_type, content, sort_order, evidence_tags')
    .eq('prd_id', prdId)
    .order('sort_order', { ascending: true });

  if (blocksError) {
    console.error('[PDF Export] Failed to load blocks:', blocksError);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }

  // Generate PDF
  try {
    const pdfBuffer = await generatePrdPdf({
      prd: {
        title: prd.title,
        confidenceScore: prd.confidence_score,
        recommendation: prd.recommendation,
        createdAt: prd.created_at,
      },
      blocks: blocks ?? [],
    });

    // Build filename from slug or sanitized title
    const filename = prd.share_slug
      ? `enhanced-prd-${prd.share_slug}.pdf`
      : `enhanced-prd-${prd.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error('[PDF Export] Render failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
```

---

## PDF Generation Function

### `generatePrdPdf`

**File:** `src/lib/pdf/generate.ts`

Orchestrates PDF generation: registers fonts, builds the React PDF document tree, renders
to buffer.

```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { PrdDocument } from './prd-document';
import { registerFonts } from './fonts';

interface PrdData {
  title: string;
  confidenceScore: number | null;
  recommendation: string | null;
  createdAt: string;
}

interface BlockData {
  id: string;
  block_type: string;
  content: string;
  sort_order: number;
  evidence_tags: unknown; // JSONB
}

export async function generatePrdPdf(params: {
  prd: PrdData;
  blocks: BlockData[];
}): Promise<Buffer> {
  // Register Obra fonts (idempotent — safe to call multiple times)
  registerFonts();

  // Render the React PDF document to a buffer
  const buffer = await renderToBuffer(
    <PrdDocument prd={params.prd} blocks={params.blocks} />
  );

  return Buffer.from(buffer);
}
```

---

## React PDF Components

### `PrdDocument`

**File:** `src/lib/pdf/prd-document.tsx`

Top-level Document + Page wrapper.

```typescript
import { Document, Page } from '@react-pdf/renderer';
import { PrdHeader } from './prd-header';
import { PrdSection } from './prd-section';
import { PrdFooter } from './prd-footer';
import { styles } from './styles';

interface PrdDocumentProps {
  prd: PrdData;
  blocks: BlockData[];
}

export function PrdDocument({ prd, blocks }: PrdDocumentProps) {
  return (
    <Document
      title={prd.title}
      author="Enhanced"
      creator="Enhanced — enhanced.pm"
    >
      <Page size="A4" style={styles.page}>
        <PrdHeader
          title={prd.title}
          confidenceScore={prd.confidenceScore}
          recommendation={prd.recommendation}
          date={prd.createdAt}
        />

        {blocks.map((block) => (
          <PrdSection
            key={block.id}
            blockType={block.block_type}
            content={block.content}
          />
        ))}

        <PrdFooter />
      </Page>
    </Document>
  );
}
```

### `PrdHeader`

**File:** `src/lib/pdf/prd-header.tsx`

Header section with Enhanced branding, PRD title, date, and confidence score.

```typescript
import { View, Text, Image } from '@react-pdf/renderer';
import { styles } from './styles';

interface PrdHeaderProps {
  title: string;
  confidenceScore: number | null;
  recommendation: string | null;
  date: string;
}

export function PrdHeader({ title, confidenceScore, recommendation, date }: PrdHeaderProps) {
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.header}>
      {/* Enhanced logo (base64 or public asset) */}
      <Image src="/enhanced-logo.png" style={styles.logo} />

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{formattedDate}</Text>

      {confidenceScore !== null && (
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceScore}>{confidenceScore}%</Text>
          <Text style={styles.confidenceLabel}>Confiance</Text>
        </View>
      )}

      {recommendation && (
        <Text style={styles.recommendation}>{recommendation}</Text>
      )}
    </View>
  );
}
```

### `PrdSection`

**File:** `src/lib/pdf/prd-section.tsx`

Renders a single PRD block: section heading + markdown content with evidence tags.

```typescript
import { View, Text } from '@react-pdf/renderer';
import { styles } from './styles';
import { EvidenceBadge } from './evidence-badge';
import { parseMarkdownToPdf } from './markdown';
import { BLOCK_TYPE_LABELS } from './constants';

interface PrdSectionProps {
  blockType: string;
  content: string;
}

export function PrdSection({ blockType, content }: PrdSectionProps) {
  const heading = BLOCK_TYPE_LABELS[blockType] ?? blockType;

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      <View style={styles.sectionContent}>
        {parseMarkdownToPdf(content)}
      </View>
    </View>
  );
}
```

**`wrap={false}`** prevents a section heading from being orphaned at the bottom of a page.
If the section doesn't fit, @react-pdf/renderer moves it to the next page.

### `EvidenceBadge`

**File:** `src/lib/pdf/evidence-badge.tsx`

Colored inline badge for evidence tags.

```typescript
import { Text, View } from '@react-pdf/renderer';
import { styles } from './styles';

type EvidenceType = 'Evidence' | 'Assumption' | 'To verify';

const BADGE_COLORS: Record<EvidenceType, { bg: string; text: string }> = {
  'Evidence':   { bg: '#dcfce7', text: '#166534' }, // green
  'Assumption': { bg: '#fef3c7', text: '#92400e' }, // amber
  'To verify':  { bg: '#dbeafe', text: '#1e40af' }, // blue
};

interface EvidenceBadgeProps {
  type: EvidenceType;
}

export function EvidenceBadge({ type }: EvidenceBadgeProps) {
  const colors = BADGE_COLORS[type];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {type}
      </Text>
    </View>
  );
}
```

### `PrdFooter`

**File:** `src/lib/pdf/prd-footer.tsx`

Footer with branding and page numbers.

```typescript
import { Text, View } from '@react-pdf/renderer';
import { styles } from './styles';

export function PrdFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerBranding}>
        Generated with Enhanced — enhanced.pm
      </Text>
      <Text
        style={styles.footerPageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}
```

**`fixed`** makes the footer appear on every page.

---

## Styles

**File:** `src/lib/pdf/styles.ts`

StyleSheet using Obra design tokens adapted for @react-pdf/renderer.

```typescript
import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Cantarell',
    fontSize: 10,
    color: '#0A0A0A',
    paddingTop: 56,    // ~20mm
    paddingBottom: 56,
    paddingLeft: 56,
    paddingRight: 56,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 16,
  },
  logo: {
    width: 120,
    height: 30,
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Kedebideri',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 9,
    color: '#737373',
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceScore: {
    fontFamily: 'Kedebideri',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A0A0A',
    marginRight: 8,
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#737373',
  },
  recommendation: {
    fontFamily: 'Kedebideri',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A0A0A',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: 'Kedebideri',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#0A0A0A',
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#262626',
  },
  paragraph: {
    marginBottom: 6,
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 12,
  },
  listBullet: {
    width: 12,
    fontSize: 10,
  },
  listText: {
    flex: 1,
    fontSize: 10,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
  },
  footerBranding: {
    fontSize: 8,
    color: '#A3A3A3',
  },
  footerPageNumber: {
    fontSize: 8,
    color: '#A3A3A3',
  },
});
```

---

## Font Registration

**File:** `src/lib/pdf/fonts.ts`

Registers Kedebideri and Cantarell fonts from base64-encoded source data.

```typescript
import { Font } from '@react-pdf/renderer';

// Font files must be base64-encoded and stored as constants or imported from assets.
// Alternative: load from a public URL (e.g., /fonts/kedebideri.ttf) — but Vercel
// serverless functions may not have access to the public directory at runtime.

import { KEDEBIDERI_REGULAR_BASE64 } from './font-data/kedebideri';
import { CANTARELL_REGULAR_BASE64, CANTARELL_BOLD_BASE64, CANTARELL_ITALIC_BASE64 } from './font-data/cantarell';

let fontsRegistered = false;

export function registerFonts() {
  if (fontsRegistered) return;

  Font.register({
    family: 'Kedebideri',
    fonts: [
      {
        src: `data:font/truetype;base64,${KEDEBIDERI_REGULAR_BASE64}`,
        fontWeight: 'normal',
      },
      // Kedebideri bold — if available, register here. Otherwise, the renderer
      // will synthesize bold from the regular weight.
    ],
  });

  Font.register({
    family: 'Cantarell',
    fonts: [
      {
        src: `data:font/truetype;base64,${CANTARELL_REGULAR_BASE64}`,
        fontWeight: 'normal',
      },
      {
        src: `data:font/truetype;base64,${CANTARELL_BOLD_BASE64}`,
        fontWeight: 'bold',
      },
      {
        src: `data:font/truetype;base64,${CANTARELL_ITALIC_BASE64}`,
        fontStyle: 'italic',
      },
    ],
  });

  // Disable hyphenation (default hyphenation can break French words incorrectly)
  Font.registerHyphenationCallback((word) => [word]);

  fontsRegistered = true;
}
```

**Fallback strategy:** If Obra fonts fail to load (format incompatibility, missing files),
fall back to built-in fonts:

```typescript
// In styles.ts, use conditional font families:
// fontFamily: fontsAvailable ? 'Kedebideri' : 'Helvetica',
// fontFamily: fontsAvailable ? 'Cantarell' : 'Helvetica',
```

---

## Markdown Parser

**File:** `src/lib/pdf/markdown.ts`

Lightweight markdown-to-React-PDF-primitives parser. Handles the subset of markdown used
in PRD block content.

### Supported elements

| Markdown | PDF primitive |
|----------|---------------|
| `**bold**` | `<Text style={styles.bold}>bold</Text>` |
| `_italic_` or `*italic*` | `<Text style={styles.italic}>italic</Text>` |
| `- item` or `* item` | `<View style={styles.listItem}><Text>- </Text><Text>item</Text></View>` |
| `[Evidence]` | `<EvidenceBadge type="Evidence" />` |
| `[Assumption]` | `<EvidenceBadge type="Assumption" />` |
| `[To verify]` | `<EvidenceBadge type="To verify" />` |
| Plain paragraph | `<Text style={styles.paragraph}>text</Text>` |

### Unsupported elements (fall back to plain text)

- Tables
- Code blocks
- Images
- Links (rendered as plain text, not clickable)
- Headings (block headings are handled by `PrdSection`, not inline markdown)

### Implementation sketch

```typescript
import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { EvidenceBadge } from './evidence-badge';
import { styles } from './styles';

const EVIDENCE_TAG_REGEX = /\[(Evidence|Assumption|To verify)\]/g;

export function parseMarkdownToPdf(markdown: string): React.ReactNode[] {
  const lines = markdown.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    // List items
    if (/^[-*]\s/.test(line)) {
      const text = line.replace(/^[-*]\s/, '');
      elements.push(
        <View key={i} style={styles.listItem}>
          <Text style={styles.listBullet}>{'  •  '}</Text>
          <Text style={styles.listText}>{renderInline(text)}</Text>
        </View>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <Text key={i} style={styles.paragraph}>
        {renderInline(line)}
      </Text>
    );
  }

  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  // Split on evidence tags, bold, and italic markers
  // Process bold: **text**
  // Process italic: _text_ or *text* (single asterisk)
  // Process evidence tags: [Evidence], [Assumption], [To verify]

  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Evidence tag match
    const tagMatch = remaining.match(EVIDENCE_TAG_REGEX);
    if (tagMatch) {
      const tagIndex = remaining.indexOf(tagMatch[0]);
      if (tagIndex > 0) {
        parts.push(processFormatting(remaining.slice(0, tagIndex), key++));
      }
      const tagType = tagMatch[0].slice(1, -1) as 'Evidence' | 'Assumption' | 'To verify';
      parts.push(<EvidenceBadge key={key++} type={tagType} />);
      remaining = remaining.slice(tagIndex + tagMatch[0].length);
      continue;
    }

    // No more special elements — process remaining text for bold/italic
    parts.push(processFormatting(remaining, key++));
    break;
  }

  return parts;
}

function processFormatting(text: string, key: number): React.ReactNode {
  // Simplified: handle **bold** and _italic_
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /_(.+?)_/g;

  // For V1: return text with bold segments wrapped
  // Full implementation would recursively parse formatting
  if (boldRegex.test(text)) {
    return (
      <Text key={key}>
        {text.split(boldRegex).map((part, i) =>
          i % 2 === 1
            ? <Text key={i} style={styles.bold}>{part}</Text>
            : part
        )}
      </Text>
    );
  }

  return <Text key={key}>{text}</Text>;
}
```

---

## Block Type Labels

Block type labels are defined in the shared constants file `src/lib/prd/constants.ts` (see architecture.md section 3). All features MUST import from this file rather than defining their own mapping.

**File:** `src/lib/prd/constants.ts`

Canonical mapping:

```typescript
export const BLOCK_TYPE_LABELS: Record<string, string> = {
  first_use_case:     "Cas d'usage principal",
  problem_context:    "Contexte du probleme",
  data_signals:       "Signaux data",
  risk_value:         "Risque — Valeur",
  risk_usability:     "Risque — Utilisabilite",
  risk_feasibility:   "Risque — Faisabilite",
  risk_viability:     "Risque — Viabilite business",
  confidence_score:   "Score de confiance",
  success_criteria:   "Criteres de succes",
  kill_criteria:      "Kill criteria",
  next_steps:         "Prochaines etapes",
  executive_summary:  "Resume executif",
};
```

---

## Client-Side Download Flow

The "Export PDF" button in the PRD panel header triggers the download via a standard fetch
request. No custom download library needed.

**In the PRD panel header component:**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface ExportPdfButtonProps {
  prdId: string;
  disabled?: boolean; // true when no blocks exist
}

export function ExportPdfButton({ prdId, disabled }: ExportPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/export/${prdId}/pdf`);

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || 'Export failed');
      }

      // Trigger browser download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const filename = response.headers
        .get('Content-Disposition')
        ?.match(/filename="(.+)"/)?.[1] ?? 'enhanced-prd.pdf';

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Impossible de generer le PDF. Reessayez.');
      console.error('[ExportPdfButton]', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={disabled || isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        Export PDF
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </>
  );
}
```
