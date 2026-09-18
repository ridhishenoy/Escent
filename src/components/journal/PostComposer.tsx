import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ImagePlus } from 'lucide-react'
import {
  DEFAULT_POST_STYLE,
  fileToCompressedDataUrl,
  type AlignChoice,
  type FontChoice,
  type JournalPost,
  type SizeChoice,
  type Subject,
  type WeightChoice,
} from '../../lib/journal'
import PostCard from './PostCard'

type PostComposerProps = {
  subjects: Subject[]
  defaultSubjectId: string | null
  onPublish: (post: Omit<JournalPost, 'id' | 'createdAt'>) => void
}

const inputClass =
  'mt-1 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]'

export default function PostComposer({ subjects, defaultSubjectId, onPublish }: PostComposerProps) {
  const imageRef = useRef<HTMLInputElement>(null)
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_POST_STYLE.backgroundColor)
  const [textColor, setTextColor] = useState(DEFAULT_POST_STYLE.textColor)
  const [accentColor, setAccentColor] = useState(DEFAULT_POST_STYLE.accentColor)
  const [font, setFont] = useState<FontChoice>(DEFAULT_POST_STYLE.font)
  const [size, setSize] = useState<SizeChoice>(DEFAULT_POST_STYLE.size)
  const [align, setAlign] = useState<AlignChoice>(DEFAULT_POST_STYLE.align)
  const [weight, setWeight] = useState<WeightChoice>(DEFAULT_POST_STYLE.weight)
  const [italic, setItalic] = useState(DEFAULT_POST_STYLE.italic)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

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
    body,
    backgroundColor,
    textColor,
    accentColor,
    font,
    size,
    align,
    weight,
    italic,
    imageDataUrl,
    createdAt: new Date().toISOString(),
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }

    try {
      setImageDataUrl(await fileToCompressedDataUrl(file, 1200))
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add that photo.')
    }
  }

  function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      onPublish({
        subjectId: activeSubjectId,
        title: title.trim(),
        body: body.trim(),
        backgroundColor,
        textColor,
        accentColor,
        font,
        size,
        align,
        weight,
        italic,
        imageDataUrl,
      })
      setTitle('')
      setBody('')
      setImageDataUrl(null)
      setItalic(false)
      setFont(DEFAULT_POST_STYLE.font)
      setSize(DEFAULT_POST_STYLE.size)
      setAlign(DEFAULT_POST_STYLE.align)
      setWeight(DEFAULT_POST_STYLE.weight)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not publish that post.')
    }
  }

  if (subjects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-6 text-center text-[var(--color-muted)]">
        Add a subject above, then you can write a post.
      </p>
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <form
        onSubmit={handlePublish}
        className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-5"
      >
        <h2 className="text-lg font-bold">New post</h2>

        <label className="block text-sm font-medium">
          Subject
          <select
            className={inputClass}
            value={activeSubjectId}
            onChange={(event) => setSubjectId(event.target.value)}
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
            placeholder="What did you figure out?"
          />
        </label>

        <label className="block text-sm font-medium">
          Post
          <textarea
            className={`${inputClass} min-h-32`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Notes, questions, the messy middle, the aha."
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => imageRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium hover:border-[var(--color-primary)]"
          >
            <ImagePlus size={16} />
            {imageDataUrl ? 'Change photo' : 'Add photo'}
          </button>
          {imageDataUrl ? (
            <button type="button" onClick={() => setImageDataUrl(null)} className="text-sm text-[var(--color-muted)]">
              Remove photo
            </button>
          ) : null}
          <input ref={imageRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="text-sm font-medium">
            Background
            <input
              type="color"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
              className="mt-1 block h-10 w-full cursor-pointer rounded border border-[var(--color-border)]"
            />
          </label>
          <label className="text-sm font-medium">
            Text
            <input
              type="color"
              value={textColor}
              onChange={(event) => setTextColor(event.target.value)}
              className="mt-1 block h-10 w-full cursor-pointer rounded border border-[var(--color-border)]"
            />
          </label>
          <label className="text-sm font-medium">
            Accent
            <input
              type="color"
              value={accentColor}
              onChange={(event) => setAccentColor(event.target.value)}
              className="mt-1 block h-10 w-full cursor-pointer rounded border border-[var(--color-border)]"
            />
          </label>
          <label className="text-sm font-medium">
            Font
            <select className={inputClass} value={font} onChange={(event) => setFont(event.target.value as FontChoice)}>
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="mono">Mono</option>
              <option value="cursive">Cursive</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Size
            <select className={inputClass} value={size} onChange={(event) => setSize(event.target.value as SizeChoice)}>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra large</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Weight
            <select
              className={inputClass}
              value={weight}
              onChange={(event) => setWeight(event.target.value as WeightChoice)}
            >
              <option value="normal">Regular</option>
              <option value="medium">Medium</option>
              <option value="bold">Bold</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium mr-1">Align</span>
          <button type="button" aria-label="Align left" onClick={() => setAlign('left')} className={alignButton(align === 'left')}>
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Align center"
            onClick={() => setAlign('center')}
            className={alignButton(align === 'center')}
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            aria-label="Align right"
            onClick={() => setAlign('right')}
            className={alignButton(align === 'right')}
          >
            <AlignRight size={16} />
          </button>
          <label className="ml-3 inline-flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={italic} onChange={(event) => setItalic(event.target.checked)} />
            Italic
          </label>
        </div>

        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-md bg-[var(--color-primary)] py-2.5 font-semibold text-white hover:opacity-90"
        >
          Publish
        </button>
      </form>

      <div>
        <p className="mb-3 text-sm font-medium text-[var(--color-muted)]">Live preview</p>
        <PostCard post={draft} subject={selectedSubject} editable={false} onDelete={() => undefined} />
      </div>
    </section>
  )
}

function alignButton(active: boolean): string {
  return `rounded-md border p-2 ${
    active
      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
      : 'border-[var(--color-border)] bg-white'
  }`
}
