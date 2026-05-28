"use client";

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface Props {
  children: string;
}

export function MessageMarkdown({ children }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-0.5 pl-5 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-0.5 pl-5 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-6">{children}</li>,
        code: ({ children }) => (
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[13px] last:mb-0">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:no-underline"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-2 border-l-2 border-foreground/20 pl-3 italic text-muted-foreground last:mb-0">
            {children}
          </blockquote>
        ),
        h1: ({ children }) => (
          <h1 className="mb-2 text-base font-semibold last:mb-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 text-base font-semibold last:mb-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 text-sm font-semibold last:mb-0">{children}</h3>
        ),
        hr: () => <hr className="my-3 border-border" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
