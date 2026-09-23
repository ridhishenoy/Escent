import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { SUBJECT_COLORS, type Subject } from '../../lib/journal'

type SubjectManagerProps = {
  subjects: Subject[]
  selectedId: string | null
  editable: boolean
  onSelect: (id: string | null) => void
  onAdd: (name: string, color: string) => void
  onRemove: (id: string) => void
}

export default function SubjectManager({
  subjects,
  selectedId,
  editable,
  onSelect,
  onAdd,
  onRemove,
}: SubjectManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      onAdd(name, color)
      setName('')
      setColor(SUBJECT_COLORS[(subjects.length + 1) % SUBJECT_COLORS.length])
      setIsOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add that subject.')
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-base sm:text-lg font-bold">Subjects</h2>
        {editable ? (
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:opacity-80"
          >
            <Plus size={16} />
            Add a subject
          </button>
        ) : null}
      </div>

      {isOpen && editable ? (
        <form onSubmit={handleAdd} className="mb-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3">
          <label className="flex-1 min-w-40 text-sm font-medium">
            Subject
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Physics, Poetry, LeetCode…"
              className="mt-1 w-full rounded-md border border-[var(--color-border)] px-3 py-2 outline-none focus:border-[var(--color-primary)]"
            />
          </label>
          <label className="text-sm font-medium">
            Color
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="mt-1 block h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-white"
            />
          </label>
          <button
            type="submit"
            className="h-10 w-full sm:w-auto rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white hover:opacity-90 touch-manipulation"
          >
            Add
          </button>
        </form>
      ) : null}

      {error ? (
        <p className="mb-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium border ${
            selectedId === null
              ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
              : 'bg-white text-[var(--color-foreground)] border-[var(--color-border)]'
          }`}
        >
          All
        </button>
        {subjects.map((subject) => (
          <span
            key={subject.id}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium ${
              selectedId === subject.id ? 'text-white' : 'bg-white'
            }`}
            style={
              selectedId === subject.id
                ? { backgroundColor: subject.color, borderColor: subject.color }
                : { borderColor: subject.color, color: subject.color }
            }
          >
            <button type="button" onClick={() => onSelect(subject.id)}>
              {subject.name}
            </button>
            {editable ? (
              <button
                type="button"
                aria-label={`Remove ${subject.name}`}
                onClick={() => onRemove(subject.id)}
                className="ml-1 opacity-80 hover:opacity-100"
              >
                <X size={14} />
              </button>
            ) : null}
          </span>
        ))}
      </div>

      {subjects.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          {editable
            ? 'Add a subject to start your journal — whatever you’re learning.'
            : 'No subjects yet.'}
        </p>
      ) : null}
    </section>
  )
}
