import { useRef, useState, useMemo, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Plus, Trash2, Lightbulb, Clock, Code } from 'lucide-react'
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
  'mt-1 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] text-sm'

function emptySection(): PostSection {
  return { id: createEntryId(), question: '', answer: '', askedBy: null }
}

export default function PostComposer({ subjects, defaultSubjectId, onPublish }: PostComposerProps) {
  const imageRef = useRef<HTMLInputElement>(null)
  const [chosenSubjectId, setChosenSubjectId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [keyTakeaway, setKeyTakeaway] = useState('')
  const [studyMinutes, setStudyMinutes] = useState<number | ''>('')
  const [sections, setSections] = useState<PostSection[]>([emptySection()])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeSubjectId = chosenSubjectId ?? defaultSubjectId ?? subjects[0]?.id ?? ''
  const selectedSubject = subjects.find((subject) => subject.id === activeSubjectId) ?? subjects[0]

  const draft: JournalPost = useMemo(() => ({
    id: 'preview',
    subjectId: activeSubjectId,
    title,
    keyTakeaway: keyTakeaway || null,
    studyMinutes: studyMinutes !== '' ? Number(studyMinutes) : null,
    sections,
    comments: [],
    imageDataUrl: imageUrls[0] ?? null,
    imageUrls,
    createdAt: '2026-10-05T12:00:00.000Z',
  }), [activeSubjectId, title, keyTakeaway, studyMinutes, sections, imageUrls])

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
        keyTakeaway: keyTakeaway.trim() || null,
        studyMinutes: studyMinutes !== '' ? Number(studyMinutes) : null,
        sections,
        imageDataUrl: imageUrls[0] ?? null,
        imageUrls,
      })
      setTitle('')
      setKeyTakeaway('')
      setStudyMinutes('')
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">New learning entry</h2>
          <span className="text-[11px] text-[var(--color-muted)] flex items-center gap-1">
            <Code size={13} /> Supports Markdown & Code
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            Subject
            <select
              className={inputClass}
              value={activeSubjectId}
              onChange={(event) => setChosenSubjectId(event.target.value)}
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
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-[var(--color-muted)]" /> Study Time (Minutes)
            </span>
            <input
              type="number"
              min={1}
              max={1440}
              className={inputClass}
              value={studyMinutes}
              onChange={(event) => setStudyMinutes(event.target.value ? Number(event.target.value) : '')}
              placeholder="e.g. 45"
              disabled={isSubmitting}
            />
          </label>
        </div>

        <label className="block text-sm font-medium">
          Title
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What concept, algorithm, or topic did you study?"
            disabled={isSubmitting}
            required
          />
        </label>

        {/* Key Takeaway / Aha Moment */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wide">
            <Lightbulb size={14} className="text-amber-600" />
            Key Takeaway / "Aha!" Moment <span className="text-amber-700/60 font-normal lowercase">(optional)</span>
          </label>
          <input
            className="w-full px-3 py-1.5 rounded-lg border border-amber-200 bg-white text-xs sm:text-sm text-amber-950 outline-none focus:border-amber-400"
            value={keyTakeaway}
            onChange={(e) => setKeyTakeaway(e.target.value)}
            placeholder="The core insight, quick rule of thumb, or common mistake to avoid"
            disabled={isSubmitting}
          />
        </div>

        {/* Q&A Sections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Questions & Findings (Q&A)</p>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setSections((current) => [...current, emptySection()])}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:opacity-80 disabled:opacity-50 cursor-pointer"
            >
              <Plus size={15} />
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
                    className="rounded-md p-1 text-[var(--color-muted)] hover:text-rose-700 disabled:opacity-50 cursor-pointer"
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
                  placeholder="What were you trying to solve or understand?"
                  disabled={isSubmitting}
                />
              </label>
              <label className="block text-sm font-medium">
                Answer & Explanation (Markdown / Code blocks supported)
                <textarea
                  className={`${inputClass} min-h-24 font-mono text-xs sm:text-sm`}
                  value={section.answer}
                  onChange={(event) => updateSection(section.id, { answer: event.target.value })}
                  placeholder="Write the explanation, mathematical proof, or code snippet (use ```js, ```py, etc.)."
                  disabled={isSubmitting}
                />
              </label>
            </div>
          ))}
        </div>

        {/* Photos */}
        <div className="space-y-3">
          {imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative shrink-0">
                  <img src={url} alt="" className="h-20 w-20 object-cover rounded-md border border-[var(--color-border)]" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-[var(--color-border)] text-[var(--color-muted)] hover:text-rose-700 cursor-pointer">
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
              className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:border-[var(--color-primary)] disabled:opacity-50 cursor-pointer"
            >
              <ImagePlus size={16} />
              Add photos / diagrams
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
          className="w-full lg:hidden rounded-md border border-[var(--color-border)] py-2.5 text-sm font-medium hover:border-[var(--color-primary)] touch-manipulation cursor-pointer"
        >
          {showPreview ? 'Hide preview' : 'Show preview'}
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-[var(--color-primary)] py-3 sm:py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-50 touch-manipulation cursor-pointer"
        >
          {isSubmitting ? 'Publishing...' : 'Publish to Journal'}
        </button>
      </form>

      <div className={showPreview ? 'block' : 'hidden lg:block'}>
        <p className="mb-3 text-sm font-medium text-[var(--color-muted)]">Live preview</p>
        <PostCard post={draft} subject={selectedSubject} editable={false} onDelete={() => undefined} />
      </div>
    </section>
  )
}
