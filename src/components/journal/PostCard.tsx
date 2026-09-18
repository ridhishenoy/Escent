import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import type { JournalPost, Subject } from '../../lib/journal'

type PostCardProps = {
  post: JournalPost
  subject?: Subject
  editable: boolean
  onDelete: (id: string) => void
}

export default function PostCard({ post, subject, editable, onDelete }: PostCardProps) {
  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm">
      {post.imageDataUrl ? (
        <img src={post.imageDataUrl} alt="" className="w-full max-h-80 object-cover" />
      ) : null}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {subject ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                {subject.name}
              </p>
            ) : null}
            {post.title ? <h3 className="text-xl font-bold leading-tight">{post.title}</h3> : null}
          </div>
          {editable ? (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded-md p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-background)]"
              aria-label="Delete post"
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>

        {post.sections.length > 0 ? (
          <div className="space-y-4">
            {post.sections.map((section, index) => (
              <section
                key={section.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-left"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] mb-2">
                  Question {index + 1}
                </p>
                {section.question ? (
                  <h4 className="font-semibold leading-snug">{section.question}</h4>
                ) : (
                  <p className="text-sm text-[var(--color-muted)]">No question yet</p>
                )}
                {section.answer ? (
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[var(--color-foreground)]">
                    {section.answer}
                  </p>
                ) : null}
              </section>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-[var(--color-muted)]">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>
    </article>
  )
}
