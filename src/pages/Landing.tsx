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
    </div>
  )
}
