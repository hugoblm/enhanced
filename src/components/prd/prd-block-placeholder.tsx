import {
  BLOCK_HEADINGS,
  BLOCK_PLACEHOLDERS,
  type BlockType,
} from "@/lib/prd/constants";

interface Props {
  blockType: BlockType;
}

export function PrdBlockPlaceholder({ blockType }: Props) {
  const heading = BLOCK_HEADINGS[blockType];
  const placeholder = BLOCK_PLACEHOLDERS[blockType];
  const headingId = `prd-block-${blockType}`;

  return (
    <article
      data-state="empty"
      data-block-type={blockType}
      aria-labelledby={headingId}
      className="rounded-lg border border-dashed border-border bg-muted/30 p-4"
    >
      <h3 id={headingId} className="text-sm font-semibold text-muted-foreground">
        {heading}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">{placeholder}</p>
    </article>
  );
}
