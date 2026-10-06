import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100vh-4rem)] text-center py-10 sm:py-20 px-1">
      <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-3 sm:mb-4 leading-tight">
        Document what you <span className="text-[var(--color-primary)]">learn.</span>
      </h1>
      <p className="text-base sm:text-xl md:text-2xl font-extrabold tracking-tight mb-3 sm:mb-4 max-w-2xl leading-snug">
        Because your learning deserves a <span className="text-[var(--color-primary)]">feed</span> too.
      </p>
      <p className="text-base sm:text-lg text-[var(--color-muted)] max-w-xl mb-8 sm:mb-10 leading-relaxed">
        A dedicated social journal for everything you study, solve, and question. Learn in public, stay consistent, and build your personal knowledge space.
      </p>

      <div className="flex w-full max-w-xs sm:max-w-none sm:w-auto">
        <Link
          to="/auth"
          className="w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-[var(--color-primary)] text-white text-base sm:text-lg font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg sm:hover:shadow-xl sm:hover:-translate-y-1 touch-manipulation text-center"
        >
          Start your journal
        </Link>
      </div>
    </div>
  )
}
