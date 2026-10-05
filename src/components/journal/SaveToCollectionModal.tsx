import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bookmark, FolderPlus, Plus, X, Check } from 'lucide-react'
import {
  addSubject,
  getJournal,
  savePostToCollection,
  SUBJECT_COLORS,
  type JournalPost,
  type Subject,
} from '../../lib/journal'

type SaveToCollectionModalProps = {
  isOpen: boolean
  onClose: () => void
  post: JournalPost
  ownerUsername?: string
  viewerUsername: string
  onSaved?: () => void
}

export default function SaveToCollectionModal({
  isOpen,
  onClose,
  post,
  ownerUsername,
  viewerUsername,
  onSaved,
}: SaveToCollectionModalProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectColor, setNewSubjectColor] = useState(SUBJECT_COLORS[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const { data: viewerJournal, refetch: refetchJournal, isLoading } = useQuery({
    queryKey: ['journal', viewerUsername],
    queryFn: () => getJournal(viewerUsername),
    enabled: isOpen && Boolean(viewerUsername),
  })

  if (!isOpen) return null

  const subjects: Subject[] = viewerJournal?.subjects || []

  async function handleCreateSubject(e: FormEvent) {
    e.preventDefault()
    const trimmed = newSubjectName.trim()
    if (!trimmed) {
      setError('Please enter a subject name.')
      return
    }
    setError('')
    try {
      await addSubject(viewerUsername, trimmed, newSubjectColor)
      const updated = await refetchJournal()
      const newSubject = updated.data?.subjects.find(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase()
      )
      if (newSubject) {
        setSelectedSubjectId(newSubject.id)
      }
      setIsCreatingNew(false)
      setNewSubjectName('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not add subject.')
    }
  }

  async function handleSave() {
    if (!selectedSubjectId) {
      setError('Please choose a subject to file this post under.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      await savePostToCollection(
        viewerUsername,
        selectedSubjectId,
        post,
        ownerUsername
      )
      setSuccessMessage('Post saved to your journal collection!')
      setTimeout(() => {
        onSaved?.()
        onClose()
      }, 1000)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save post.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--color-primary-soft)]/20 text-[var(--color-primary)]">
              <FolderPlus size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">Save to Collection</h3>
              <p className="text-xs text-[var(--color-muted)]">Add this post to your personal journal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Post Snippet */}
          <div className="p-3 bg-[var(--color-background)] rounded-xl border border-[var(--color-border)]">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-1">
              Saving Post {ownerUsername ? `by @${ownerUsername}` : ''}
            </p>
            <p className="text-sm font-bold text-[var(--color-foreground)] line-clamp-2">
              {post.title || 'Untitled Post'}
            </p>
            {post.sections.length > 0 && post.sections[0].question ? (
              <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-1 italic">
                "{post.sections[0].question}"
              </p>
            ) : null}
          </div>

          {successMessage ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
              <Check size={16} /> {successMessage}
            </div>
          ) : null}

          {error ? (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm">
              {error}
            </div>
          ) : null}

          {/* Subject selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
                Select Your Subject
              </label>
              {!isCreatingNew && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> New Subject
                </button>
              )}
            </div>

            {/* Create new subject form */}
            {isCreatingNew && (
              <form onSubmit={handleCreateSubject} className="p-3 border border-[var(--color-primary)] rounded-xl bg-white space-y-3">
                <p className="text-xs font-bold text-[var(--color-foreground)]">Create New Subject</p>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Neuroscience, Python, Philosophy"
                  className="w-full px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg outline-none focus:border-[var(--color-primary)]"
                  autoFocus
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-[var(--color-muted)] mr-1">Color:</span>
                  {SUBJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubjectColor(c)}
                      className={`size-5 rounded-full transition-transform ${
                        newSubjectColor === c ? 'scale-125 ring-2 ring-offset-1 ring-black' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false)
                      setNewSubjectName('')
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90"
                  >
                    Add & Select
                  </button>
                </div>
              </form>
            )}

            {isLoading ? (
              <p className="text-xs text-[var(--color-muted)] py-3">Loading your subjects...</p>
            ) : subjects.length === 0 ? (
              <div className="p-4 border border-dashed border-[var(--color-border)] rounded-xl text-center space-y-2">
                <p className="text-xs text-[var(--color-muted)]">
                  You don't have any subjects in your journal yet.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(true)}
                  className="px-3 py-1.5 bg-[var(--color-primary-soft)]/30 text-[var(--color-primary)] text-xs font-semibold rounded-lg hover:opacity-80"
                >
                  Create your first subject
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-0.5">
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/20 shadow-xs'
                          : 'border-[var(--color-border)] hover:border-gray-300 bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color }}
                        />
                        <span className="text-xs font-semibold truncate text-[var(--color-foreground)]">
                          {sub.name}
                        </span>
                      </span>
                      {isSelected ? (
                        <Check size={14} className="text-[var(--color-primary)] shrink-0 ml-1" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 sm:p-5 border-t border-[var(--color-border)] bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting || !selectedSubjectId}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] text-white text-xs sm:text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shadow-xs"
          >
            <Bookmark size={15} />
            <span>{isSubmitting ? 'Saving...' : 'Save to Journal'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
