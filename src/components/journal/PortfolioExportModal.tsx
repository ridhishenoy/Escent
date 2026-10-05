import { useState } from 'react'
import { Copy, Check, Printer, X, Award } from 'lucide-react'
import type { JournalPost, Subject } from '../../lib/journal'
import MarkdownViewer from './MarkdownViewer'

type PortfolioExportModalProps = {
  isOpen: boolean
  onClose: () => void
  subject: Subject
  posts: JournalPost[]
  ownerDisplayName: string
  ownerUsername: string
}

export default function PortfolioExportModal({
  isOpen,
  onClose,
  subject,
  posts,
  ownerDisplayName,
  ownerUsername,
}: PortfolioExportModalProps) {
  const [copied, setCopied] = useState(false)
  const [exportDate] = useState(() => new Date().toLocaleDateString())

  if (!isOpen) return null

  function generateMarkdown(): string {
    let md = `# Learning Portfolio: ${subject.name}\n`
    md += `**Learner:** ${ownerDisplayName} (@${ownerUsername})\n`
    md += `**Date:** ${new Date().toLocaleDateString()}\n\n`
    md += `---\n\n`

    posts.forEach((post, i) => {
      md += `## ${i + 1}. ${post.title || 'Untitled Post'}\n`
      if (post.keyTakeaway) {
        md += `> 💡 **Key Takeaway:** ${post.keyTakeaway}\n\n`
      }
      if (post.studyMinutes) {
        md += `*Study Duration:* ${post.studyMinutes} minutes\n\n`
      }
      post.sections.forEach((s, idx) => {
        md += `### Q${idx + 1}: ${s.question}\n`
        md += `${s.answer || '*(Pending answer)*'}\n\n`
      })
      md += `---\n\n`
    })

    return md
  }

  async function handleCopyMarkdown() {
    try {
      await navigator.clipboard.writeText(generateMarkdown())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Ignore
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[var(--color-border)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--color-primary-soft)]/20 text-[var(--color-primary)]">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">Export Learning Portfolio</h3>
              <p className="text-xs text-[var(--color-muted)]">Subject: {subject.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-white text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Portfolio Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 print:p-0 print:space-y-4" id="printable-portfolio">
          {/* Portfolio Header */}
          <div className="border-b border-gray-200 pb-5">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="size-3.5 rounded-full"
                style={{ backgroundColor: subject.color || 'var(--color-primary)' }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                Learning Portfolio
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-foreground)] tracking-tight">
              {subject.name}
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Curated by <span className="font-semibold text-[var(--color-foreground)]">{ownerDisplayName}</span> (@{ownerUsername}) &bull; {posts.length} entries &bull; Exported {exportDate}
            </p>
          </div>

          {/* Posts List */}
          {posts.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)] italic">No posts in this subject yet.</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post, idx) => (
                <article key={post.id} className="p-4 sm:p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--color-muted)]">ENTRY #{idx + 1}</span>
                    {post.studyMinutes ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200/80 text-gray-700">
                        ⏱️ {post.studyMinutes} mins
                      </span>
                    ) : null}
                  </div>

                  <h3 className="text-lg font-bold text-[var(--color-foreground)]">{post.title}</h3>

                  {post.keyTakeaway ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-2">
                      <span className="shrink-0 text-base">💡</span>
                      <div>
                        <span className="font-bold">Key Takeaway: </span>
                        <span>{post.keyTakeaway}</span>
                      </div>
                    </div>
                  ) : null}

                  {post.sections.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {post.sections.map((s, qIdx) => (
                        <div key={s.id} className="p-3 rounded-xl bg-white border border-gray-100 text-xs sm:text-sm space-y-1">
                          <p className="font-bold text-[var(--color-primary)]">Q{qIdx + 1}: {s.question}</p>
                          <div className="text-gray-700 pl-2 border-l-2 border-[var(--color-primary-soft)]">
                            <MarkdownViewer content={s.answer || 'No answer recorded yet.'} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
