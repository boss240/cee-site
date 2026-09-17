import ReactMarkdown from "react-markdown";

/**
 * Рендер Markdown для статей блогу. react-markdown не пропускає сирий HTML,
 * тож текст із адмінки безпечний. Стилі — через класи на елементах.
 */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="prose-cee">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h2 className="mt-10 text-2xl">{children}</h2>,
          h2: ({ children }) => <h2 className="mt-10 text-2xl">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-8 text-xl">{children}</h3>,
          p: ({ children }) => <p className="mt-4 text-[var(--color-fg-muted)]">{children}</p>,
          ul: ({ children }) => <ul className="mt-4 space-y-1.5 pl-5 text-[var(--color-fg-muted)]">{children}</ul>,
          ol: ({ children }) => <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[var(--color-fg-muted)]">{children}</ol>,
          li: ({ children }) => <li className="list-disc marker:text-[var(--color-brand)] [ol_&]:list-decimal">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-[var(--color-fg)]">{children}</strong>,
          a: ({ href, children }) => (
            <a href={href} className="text-[var(--color-brand-text)] underline underline-offset-2" rel="noreferrer">
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mt-6 border-l-2 border-[var(--color-brand)] pl-5 text-[var(--color-fg-muted)]">{children}</blockquote>
          ),
          hr: () => <hr className="my-8 border-[var(--color-line)]" />,
          code: ({ children }) => <code className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.9em]">{children}</code>,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
