import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center py-20">
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
        Document what you <span className="text-[var(--color-primary)]">learn.</span>
      </h1>
      <p className="text-xl md:text-2xl text-[var(--color-muted)] max-w-2xl mb-10">
        Instagram? (kinda) but for something more productive. A social learning journal for everything you study, solve, question and discover.
        Build your personal learning space.
      </p>
      
      <div className="flex gap-4">
        <Link to="/auth?signup=true" className="px-8 py-4 bg-[var(--color-primary)] text-white text-lg font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
          Start posting
        </Link>
      </div>

      {/* Decorative mockup placeholder */}
      <div className="mt-20 relative w-full max-w-4xl mx-auto">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-soft)] opacity-30 blur-xl"></div>
        <div className="relative bg-[var(--color-card)] rounded-xl shadow-2xl border border-[var(--color-border)] p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--color-border)]">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary-soft)]"></div>
            <div className="text-left">
              <h3 className="text-xl font-bold">Ridhi Shenoy</h3>
              <p className="text-[var(--color-muted)]">@ridhi • Information Science student</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-4 bg-[var(--color-background)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--color-background)] rounded w-1/2"></div>
            <div className="h-4 bg-[var(--color-background)] rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
