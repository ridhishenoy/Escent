import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, X, Sparkles, BookOpen } from 'lucide-react'
import MarkdownViewer from './MarkdownViewer'

export type FlashcardItem = {
  id: string
  question: string
  answer: string
  askedBy?: string | null
  contextTitle?: string
}

type FlashcardModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  cards: FlashcardItem[]
}

export default function FlashcardModal(props: FlashcardModalProps) {
  if (!props.isOpen) return null
  return <FlashcardModalContent {...props} />
}

function FlashcardModalContent({ onClose, title, cards }: FlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set())
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set())
  const [isFinished, setIsFinished] = useState(false)

  const validCards = cards.filter((c) => c.question.trim() && c.answer.trim())

  if (validCards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="w-full max-w-md bg-white rounded-2xl p-6 text-center space-y-4 border border-[var(--color-border)] shadow-xl">
          <div className="size-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <BookOpen size={24} />
          </div>
          <h3 className="font-bold text-lg">No Answered Flashcards Yet</h3>
          <p className="text-sm text-[var(--color-muted)]">
            Flashcards require answered questions in this subject or post. Add answers to questions to practice active recall!
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const currentCard = validCards[currentIndex]

  function handleNext() {
    setIsFlipped(false)
    if (currentIndex < validCards.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setIsFinished(true)
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setIsFlipped(false)
      setCurrentIndex((prev) => prev - 1)
    }
  }

  function markMastered() {
    setMasteredIds((prev) => new Set([...prev, currentCard.id]))
    handleNext()
  }

  function markNeedsReview() {
    setReviewIds((prev) => new Set([...prev, currentCard.id]))
    handleNext()
  }

  function restartSession() {
    setCurrentIndex(0)
    setIsFlipped(false)
    setMasteredIds(new Set())
    setReviewIds(new Set())
    setIsFinished(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[var(--color-border)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-lg bg-[var(--color-primary-soft)]/20 text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{title}</h3>
              <p className="text-[11px] text-[var(--color-muted)]">Active Recall Flashcards</p>
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

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between overflow-y-auto">
          {isFinished ? (
            <div className="py-8 text-center space-y-4 my-auto">
              <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 size={36} />
              </div>
              <h4 className="text-xl font-extrabold text-[var(--color-foreground)]">Study Session Complete!</h4>
              <p className="text-sm text-[var(--color-muted)] max-w-xs mx-auto">
                You reviewed all {validCards.length} cards in this collection.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto pt-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-2xl font-black text-emerald-700">{masteredIds.size}</p>
                  <p className="text-xs font-semibold text-emerald-800">Mastered</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-2xl font-black text-amber-700">{reviewIds.size}</p>
                  <p className="text-xs font-semibold text-amber-800">Needs Review</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={restartSession}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw size={15} /> Practice Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Progress Bar & Counter */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between items-center text-xs font-semibold text-[var(--color-muted)]">
                  <span>
                    Card {currentIndex + 1} of {validCards.length}
                  </span>
                  <span>{Math.round(((currentIndex + 1) / validCards.length) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary)] transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / validCards.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Card Container (Click to flip) */}
              <div
                onClick={() => setIsFlipped((prev) => !prev)}
                className={`relative min-h-[220px] sm:min-h-[260px] p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  isFlipped
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/10 shadow-md'
                    : 'border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary-soft)] shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs font-bold uppercase tracking-wider">
                    <span className={isFlipped ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}>
                      {isFlipped ? 'Answer (Click to flip back)' : 'Question (Click to reveal answer)'}
                    </span>
                    {currentCard.contextTitle ? (
                      <span className="text-[var(--color-muted)] text-[10px] font-medium truncate max-w-[150px]">
                        {currentCard.contextTitle}
                      </span>
                    ) : null}
                  </div>

                  {isFlipped ? (
                    <div className="mt-2 text-[var(--color-foreground)] text-sm sm:text-base leading-relaxed">
                      <MarkdownViewer content={currentCard.answer} />
                    </div>
                  ) : (
                    <h4 className="text-base sm:text-xl font-bold leading-snug text-[var(--color-foreground)] mt-2">
                      {currentCard.question}
                    </h4>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--color-muted)] pt-4 border-t border-[var(--color-border)]/50">
                  <span>{isFlipped ? 'Tip: Review your answer' : 'Tap anywhere to reveal answer'}</span>
                  <span className="font-semibold text-[var(--color-primary)]">
                    {isFlipped ? 'Flip to Question' : 'Flip to Answer'}
                  </span>
                </div>
              </div>

              {/* Study Control Actions */}
              <div className="space-y-3 pt-5">
                {isFlipped ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={markNeedsReview}
                      className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs sm:text-sm font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Needs Review
                    </button>
                    <button
                      type="button"
                      onClick={markMastered}
                      className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      Mastered!
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-2.5 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                  >
                    Reveal Answer
                  </button>
                )}

                {/* Back / Skip navigation */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-foreground)] cursor-pointer"
                  >
                    Skip <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
