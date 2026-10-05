import ReactMarkdown from 'react-markdown'

type MarkdownViewerProps = {
  content: string
  className?: string
}

export default function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  if (!content) return null

  return (
    <div className={`prose prose-sm max-w-none text-[var(--color-foreground)] leading-relaxed break-words ${className}`}>
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const isBlock = Boolean(className) || String(children).includes('\n')
            return isBlock ? (
              <pre className="my-2 p-3 rounded-lg bg-gray-900 text-gray-100 overflow-x-auto text-xs font-mono border border-gray-800">
                <code {...props}>{children}</code>
              </pre>
            ) : (
              <code className="px-1.5 py-0.5 rounded bg-[var(--color-primary-soft)]/20 text-[var(--color-primary)] font-mono text-xs" {...props}>
                {children}
              </code>
            )
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-3 border-[var(--color-primary)] pl-3 italic text-[var(--color-muted)] my-2">
                {children}
              </blockquote>
            )
          },
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-1.5">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-1.5">{children}</ol>
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
