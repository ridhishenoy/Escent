import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Bookmark, BookmarkPlus, ChevronLeft, ChevronRight, Share2, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { answerPostQuestion, getProfile, type JournalPost, type Subject } from '../../lib/journal'
import PostDiscussion from './PostDiscussion'
import SaveToCollectionModal from './SaveToCollectionModal'

function ImageCarousel({ urls }: { urls: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  return (
    <div className="relative w-full group">
      <img src={urls[currentIndex]} alt="" className="w-full max-h-56 sm:max-h-80 object-cover" />

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => i - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {currentIndex < urls.length - 1 && (
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => i + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {urls.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 shadow-sm">
          {urls.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type PostCardProps = {
  post: JournalPost
  subject?: Subject
  editable: boolean
  onDelete: (id: string) => void
  ownerUsername?: string
  viewerUsername?: string | null
  onUpdated?: () => void
}

function SectionAsker({ username }: { username: string }) {
  const { data: asker } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfile(username),
    enabled: Boolean(username),
  })
  if (!asker) return null
  return (
    <p className="mt-1 text-xs text-[var(--color-muted)]">
      asked by{' '}
      <Link to={`/${asker.username}`} className="font-medium hover:text-[var(--color-primary)]">
        @{asker.username}
      </Link>
    </p>
  )
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
  const navigate = useNavigate()
  const showDiscussion = Boolean(ownerUsername && onUpdated)
  const isOwner = Boolean(ownerUsername && viewerUsername === ownerUsername)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const postUrl = `${window.location.origin}/${ownerUsername || ''}#post-${post.id}`
    const shareData = {
      title: post.title || 'Learning Journal Post on Rika',
      text: post.title
        ? `Read "${post.title}" on Rika by @${ownerUsername || 'learner'}`
        : `Check out this learning journal entry on Rika!`,
      url: postUrl,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(postUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Ignore
    }
  }

  function handleSaveClick() {
    if (!viewerUsername) {
      navigate('/auth')
      return
    }
    setIsSaveModalOpen(true)
  }

  return (
    <>
      <article
        id={`post-${post.id}`}
        className="rounded-2xl border border-[var(--color-border)] bg-white overflow-hidden shadow-sm h-full flex flex-col"
      >
        {post.imageUrls && post.imageUrls.length > 0 ? (
          <ImageCarousel urls={post.imageUrls} />
        ) : post.imageDataUrl ? (
          <img src={post.imageDataUrl} alt="" className="w-full max-h-56 sm:max-h-80 object-cover" />
        ) : null}
        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col">
          {/* Top meta tags */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {subject ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-2xs"
                  style={{ backgroundColor: subject.color || 'var(--color-primary)' }}
                >
                  {subject.name}
                </span>
              ) : null}

              {post.savedFrom ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary-soft)]/20 border border-[var(--color-border)]">
                  <Bookmark size={11} />
                  <span>
                    Saved from{' '}
                    <Link to={`/${post.savedFrom}`} className="font-bold hover:underline">
                      @{post.savedFrom}
                    </Link>
                  </span>
                </span>
              ) : null}
            </div>

            {editable ? (
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                className="rounded-md p-1.5 text-[var(--color-muted)] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                aria-label="Delete post"
                title="Delete post"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>

          {post.title ? (
            <h3 className="text-lg sm:text-xl font-bold leading-tight text-[var(--color-foreground)]">
              {post.title}
            </h3>
          ) : null}

          {/* Sections (Q&A) */}
          {post.sections.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 flex-1">
              {post.sections.map((section, index) => {
                return (
                  <section
                    key={section.id}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 sm:p-4 text-left"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] mb-1.5">
                      Question {index + 1}
                    </p>
                    {section.question ? (
                      <h4 className="font-semibold leading-snug">{section.question}</h4>
                    ) : (
                      <p className="text-sm text-[var(--color-muted)]">No question yet</p>
                    )}
                    {section.askedBy ? <SectionAsker username={section.askedBy} /> : null}
                    {section.answer ? (
                      <p className="mt-2 whitespace-pre-wrap leading-relaxed text-[var(--color-foreground)] text-sm sm:text-base">
                        {section.answer}
                      </p>
                    ) : isOwner && ownerUsername && onUpdated && section.askedBy ? (
                      <OwnerAnswerForm
                        ownerUsername={ownerUsername}
                        postId={post.id}
                        sectionId={section.id}
                        onUpdated={onUpdated}
                      />
                    ) : section.askedBy ? (
                      <p className="mt-2 text-xs sm:text-sm text-[var(--color-muted)] italic">
                        Waiting for answer from @{ownerUsername}…
                      </p>
                    ) : null}
                  </section>
                )
              })}
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* Action bar: Share, Save to Collection, Time */}
          <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-muted)] mt-auto">
            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Save to Collection */}
              <button
                type="button"
                onClick={handleSaveClick}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/20 transition-all cursor-pointer"
                title="Save to your collection under a subject"
              >
                <BookmarkPlus size={15} />
                <span>Save to Collection</span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-gray-100 transition-all cursor-pointer"
                title="Share this post"
              >
                <Share2 size={15} />
                <span>{copied ? 'Copied!' : 'Share'}</span>

                {copied && (
                  <span className="absolute -top-7 right-0 px-2 py-0.5 rounded bg-gray-900 text-white text-[10px] font-medium whitespace-nowrap shadow-xs">
                    Link copied!
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Discussion */}
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

      {/* Save to Collection Modal */}
      {viewerUsername ? (
        <SaveToCollectionModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          post={post}
          ownerUsername={ownerUsername}
          viewerUsername={viewerUsername}
          onSaved={() => onUpdated?.()}
        />
      ) : null}
    </>
  )
}

type OwnerAnswerFormProps = {
  ownerUsername: string
  postId: string
  sectionId: string
  onUpdated: () => void
}

function OwnerAnswerForm({ ownerUsername, postId, sectionId, onUpdated }: OwnerAnswerFormProps) {
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await answerPostQuestion(ownerUsername, postId, sectionId, answer)
      onUpdated()
      setAnswer('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save that answer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        className="w-full min-h-16 rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder="Write the answer."
        disabled={isSubmitting}
      />
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? 'Saving...' : 'Save answer'}
      </button>
    </form>
  )
}
