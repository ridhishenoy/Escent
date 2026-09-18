import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/auth'

export default function Navbar() {
  const username = useAuth((state) => state.username)
  const avatarUrl = useAuth((state) => state.avatarUrl)
  const logout = useAuth((state) => state.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to={username ? `/${username}` : '/'} className="text-2xl font-bold text-[var(--color-primary)]">
            Escent
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          {username ? (
            <>
              <Link
                to={`/${username}`}
                className="flex items-center gap-2 text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-[var(--color-border)]" />
                ) : null}
                @{username}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium hover:text-[var(--color-primary)] transition-colors">
                Login
              </Link>
              <Link
                to="/auth?signup=true"
                className="text-sm font-medium bg-[var(--color-primary)] text-white px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
