import { useState, type FormEvent } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { answerPostQuestion, getProfile, type Journal, type JournalPost, type Subject } from '../../lib/journal'
import PostDiscussion from './PostDiscussion'

type PostCardProps = {
  post: JournalPost
  subject?: Subject
  editable: boolean
  onDelete: (id: string) => void
  ownerUsername?: string
  viewerUsername?: string | null
  onUpdated?: (journal: Journal) => void
}

export default function PostCard({
  post,
  subject,
  editable,
  onDelete,
  ownerUsername,
  viewerUsername,
  onUpdated,
}: PostCardProps) {
  const showDiscussion = Boolean(ownerUsername && onUpdated)
  const isOwner = Boolean(ownerUsername && viewerUsername === ownerUsername)

  return (
    <article className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm h-full flex flex-col">
      {post.imageDataUrl ? (
        <img src={post.imageDataUrl} alt="" className="w-full max-h-80 object-cover" />
      ) : null}
      <div className="p-5 space-y-4 flex-1 flex flex-col">
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
          <div className="space-y-4 flex-1">
            {post.sections.map((section, index) => {
              const asker = section.askedBy ? getProfile(section.askedBy) : null
              return (
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
                  {asker ? (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      asked by{' '}
                      <Link to={`/${asker.username}`} className="font-medium hover:text-[var(--color-primary)]">
                        @{asker.username}
                      </Link>
                    </p>
                  ) : null}
                  {section.answer ? (
                    <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[var(--color-foreground)]">
                      {section.answer}
                    </p>
                  ) : isOwner && ownerUsername && onUpdated && asker ? (
                    <OwnerAnswerForm
                      ownerUsername={ownerUsername}
                      postId={post.id}
                      sectionId={section.id}
                      onUpdated={onUpdated}
                    />
                  ) : asker ? (
                    <p className="mt-2 text-sm text-[var(--color-muted)]">Waiting for an answer.</p>
                  ) : null}
                </section>
              )
            })}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <p className="text-xs text-[var(--color-muted)] mt-auto">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>

        {showDiscussion && ownerUsername && onUpdated ? (
          <PostDiscussion
            post={post}
            ownerUsername={ownerUsername}
            viewerUsername={viewerUsername ?? null}
            onUpdated={onUpdated}
          />
        ) : null}
      </div>
    </article>
  )
}

type OwnerAnswerFormProps = {
  ownerUsername: string
  postId: string
  sectionId: string
  onUpdated: (journal: Journal) => void
}

function OwnerAnswerForm({ ownerUsername, postId, sectionId, onUpdated }: OwnerAnswerFormProps) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      onUpdated(answerPostQuestion(ownerUsername, postId, sectionId, answer))
      setAnswer('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save that answer.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        className="w-full min-h-16 rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Write the answer."
      />
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
      >
        Save answer
      </button>
    </form>
  )
}
