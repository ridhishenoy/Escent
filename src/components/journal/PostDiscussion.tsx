import { useState, type FormEvent, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  addCommentToPost,
  addQuestionToPost,
  getProfile,
  removePostComment,
  type JournalPost,
} from '../../lib/journal'

type DiscussionMode = 'idle' | 'question' | 'comment'

type PostDiscussionProps = {
  post: JournalPost
  ownerUsername: string
  viewerUsername: string | null
  onUpdated: () => void
}

const inputClass =
  'w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]'

function CommentAuthor({ username }: { username: string }) {
  const { data: author } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfile(username),
    enabled: Boolean(username)
  })

  if (!author) return <span className="block h-7 w-7 rounded-full bg-[var(--color-primary-soft)]" />

  return (
    <>
      <Link to={`/${author.username}`} className="shrink-0">
        {author.avatarDataUrl ? (
          <img
            src={author.avatarDataUrl}
            alt=""
            className="h-7 w-7 rounded-full object-cover border border-[var(--color-border)]"
          />
        ) : (
          <span className="block h-7 w-7 rounded-full bg-[var(--color-primary-soft)]" />
        )}
      </Link>
      <div className="flex items-start justify-between gap-2">
        <Link to={`/${author.username}`} className="font-semibold hover:text-[var(--color-primary)]">
          {author.displayName}
        </Link>
      </div>
    </>
  )
}

export default function PostDiscussion({ post, ownerUsername, viewerUsername, onUpdated }: PostDiscussionProps) {
  const [mode, setMode] = useState<DiscussionMode>('idle')
  const [question, setQuestion] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canWrite = Boolean(viewerUsername)
  const commentCount = post.comments.length

  function handleError(caught: unknown) {
    setError(caught instanceof Error ? caught.message : 'Could not update that post.')
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!viewerUsername) {
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await addQuestionToPost(ownerUsername, post.id, viewerUsername, question)
      onUpdated()
      setQuestion('')
      setMode('idle')
    } catch (caught) {
      handleError(caught)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!viewerUsername) {
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await addCommentToPost(ownerUsername, post.id, viewerUsername, comment)
      onUpdated()
      setComment('')
      setMode('idle')
    } catch (caught) {
      handleError(caught)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!viewerUsername) {
      return
    }
    setError('')
    try {
      await removePostComment(ownerUsername, post.id, commentId, viewerUsername)
      onUpdated()
    } catch (caught) {
      handleError(caught)
    }
  }

  function toggleMode(next: DiscussionMode) {
    setError('')
    setMode((current) => (current === next ? 'idle' : next))
  }

  let composer: ReactNode = null
  switch (mode) {
    case 'idle':
      composer = null
      break
    case 'question':
      composer = (
        <form onSubmit={submitQuestion} className="space-y-2">
          <label className="block text-sm font-medium">
            Add a question
            <textarea
              className={`${inputClass} mt-1 min-h-20`}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What else should they explain?"
              disabled={isSubmitting}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post question'}
          </button>
        </form>
      )
      break
    case 'comment':
      composer = (
        <form onSubmit={submitComment} className="space-y-2">
          <label className="block text-sm font-medium">
            Comment
            <textarea
              className={`${inputClass} mt-1 min-h-20`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a thought, a correction, or a hi."
              disabled={isSubmitting}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post comment'}
          </button>
        </form>
      )
      break
    default: {
      const unexpected: never = mode
      composer = unexpected
      break
    }
  }

  return (
    <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
      {canWrite ? (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => toggleMode('question')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 sm:py-1.5 text-sm font-medium touch-manipulation ${
              mode === 'question'
                ? 'border-[var(--color-primary)] bg-[var(--color-background)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]'
            }`}
          >
            <Plus size={14} />
            Ask a question
          </button>
          <button
            type="button"
            onClick={() => toggleMode('comment')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2.5 sm:py-1.5 text-sm font-medium touch-manipulation ${
              mode === 'comment'
                ? 'border-[var(--color-primary)] bg-[var(--color-background)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]'
            }`}
          >
            <MessageCircle size={14} />
            Comment{commentCount > 0 ? ` (${commentCount})` : ''}
          </button>
        </div>
      ) : commentCount > 0 ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
        </p>
      ) : null}

      {composer}

      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {post.comments.length > 0 ? (
        <ul className="space-y-3">
          {post.comments.map((item) => {
            const canDelete = viewerUsername === ownerUsername || viewerUsername === item.authorUsername
            return (
              <li key={item.id} className="flex gap-2">
                <CommentAuthor username={item.authorUsername} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm leading-snug">
                      <span className="whitespace-pre-wrap">{item.body}</span>
                    </p>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(item.id)}
                        className="rounded-md p-1 text-[var(--color-muted)] hover:text-rose-700"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
