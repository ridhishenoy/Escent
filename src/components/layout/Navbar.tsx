import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold text-[var(--color-primary)]">
            Escent
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors">
            Login
          </Link>
          <Link to="/auth?signup=true" className="text-sm font-medium bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  )
}
