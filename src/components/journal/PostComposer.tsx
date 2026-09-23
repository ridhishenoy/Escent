import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Plus, Trash2 } from 'lucide-react'
import {
  createEntryId,
  fileToCompressedDataUrl,
  type JournalPost,
  type PostSection,
  type Subject,
} from '../../lib/journal'
import PostCard from './PostCard'

type PostComposerProps = {
  subjects: Subject[]
  defaultSubjectId: string | null
  onPublish: (post: Omit<JournalPost, 'id' | 'createdAt' | 'comments'>) => void | Promise<void>
}

const inputClass =
  'mt-1 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]'

function emptySection(): PostSection {
  return { id: createEntryId(), question: '', answer: '', askedBy: null }
}

export default function PostComposer({ subjects, defaultSubjectId, onPublish }: PostComposerProps) {
  const imageRef = useRef<HTMLInputElement>(null)
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [sections, setSections] = useState<PostSection[]>([emptySection()])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (defaultSubjectId) {
      setSubjectId(defaultSubjectId)
      return
    }

    if (!subjectId && subjects[0]) {
      setSubjectId(subjects[0].id)
    }
  }, [defaultSubjectId, subjectId, subjects])

  const selectedSubject = subjects.find((subject) => subject.id === subjectId) ?? subjects[0]
  const activeSubjectId = selectedSubject?.id ?? ''

  const draft: JournalPost = {
    id: 'preview',
    subjectId: activeSubjectId,
    title,
    sections,
    comments: [],
    imageDataUrl: imageUrls[0] ?? null,
    imageUrls,
    createdAt: new Date().toISOString(),
  }

  function updateSection(id: string, patch: Partial<PostSection>) {
    setSections((current) => current.map((section) => (section.id === id ? { ...section, ...patch } : section)))
  }

  function removeSection(id: string) {
    setSections((current) => (current.length === 1 ? current : current.filter((section) => section.id !== id)))
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    event.target.value = ''
    if (!files || files.length === 0) {
      return
    }

    try {
      const newUrls = await Promise.all(
        Array.from(files).map((file) => fileToCompressedDataUrl(file, 1200))
      )
      setImageUrls((current) => [...current, ...newUrls])
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add photos.')
    }
  }

  function removeImage(index: number) {
    setImageUrls((current) => current.filter((_, i) => i !== index))
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onPublish({
        subjectId: activeSubjectId,
        title: title.trim(),
        sections,
        imageDataUrl: imageUrls[0] ?? null,
        imageUrls,
      })
      setTitle('')
      setSections([emptySection()])
      setImageUrls([])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not publish that post.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (subjects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-4 sm:p-6 text-center text-sm sm:text-base text-[var(--color-muted)]">
        Add a subject above, then you can write a post.
      </p>
    )
  }

  return (
    <section className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <form
        onSubmit={handlePublish}
        className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5"
      >
        <h2 className="text-lg font-bold">New post</h2>

        <label className="block text-sm font-medium">
          Subject
          <select
            className={inputClass}
            value={activeSubjectId}
            onChange={(event) => setSubjectId(event.target.value)}
            disabled={isSubmitting}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Title
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What did you study?"
            disabled={isSubmitting}
          />
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Questions & answers</p>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setSections((current) => [...current, emptySection()])}
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:opacity-80 disabled:opacity-50"
            >
              <Plus size={16} />
              Add question
            </button>
          </div>

          {sections.map((section, index) => (
            <div key={section.id} className="rounded-xl border border-[var(--color-border)] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                  Question {index + 1}
                </p>
                {sections.length > 1 ? (
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => removeSection(section.id)}
                    className="rounded-md p-1 text-[var(--color-muted)] hover:text-rose-700 disabled:opacity-50"
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
              <label className="block text-sm font-medium">
                Question
                <input
                  className={inputClass}
                  value={section.question}
                  onChange={(event) => updateSection(section.id, { question: event.target.value })}
                  placeholder="What were you trying to figure out?"
                  disabled={isSubmitting}
                />
              </label>
              <label className="block text-sm font-medium">
                Answer
                <textarea
                  className={`${inputClass} min-h-24`}
                  value={section.answer}
                  onChange={(event) => updateSection(section.id, { answer: event.target.value })}
                  placeholder="Write the answer, the proof, or the aha."
                  disabled={isSubmitting}
                />
              </label>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative shrink-0">
                  <img src={url} alt="" className="h-20 w-20 object-cover rounded-md border border-[var(--color-border)]" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-[var(--color-border)] text-[var(--color-muted)] hover:text-rose-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => imageRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:border-[var(--color-primary)] disabled:opacity-50"
            >
              <ImagePlus size={16} />
              Add photos
            </button>
            <input ref={imageRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleImage} disabled={isSubmitting} />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setShowPreview((visible) => !visible)}
          className="w-full lg:hidden rounded-md border border-[var(--color-border)] py-2.5 text-sm font-medium hover:border-[var(--color-primary)] touch-manipulation"
        >
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[var(--color-primary)] py-3 sm:py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50 touch-manipulation"
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </form>

      <div className={showPreview ? 'block' : 'hidden lg:block'}>
        <p className="mb-3 text-sm font-medium text-[var(--color-muted)]">Live preview</p>
        <PostCard post={draft} subject={selectedSubject} editable={false} onDelete={() => undefined} />
      </div>
    </section>
  )
}
