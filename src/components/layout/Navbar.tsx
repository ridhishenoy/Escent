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
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)] sticky top-0 z-10 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center min-w-0">
          <Link to={username ? '/feed' : '/'} className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">
            Escent
          </Link>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
          {username ? (
            <>
              <Link
                to={`/${username}`}
                className="hidden sm:flex items-center gap-2 text-sm font-medium hover:text-[var(--color-primary)] transition-colors min-w-0"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-[var(--color-border)]" />
                ) : null}
                <span className="truncate">@{username}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium px-2 py-1.5 sm:px-0 hover:text-[var(--color-primary)] transition-colors touch-manipulation"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className="text-sm font-medium px-2 py-1.5 hover:text-[var(--color-primary)] transition-colors touch-manipulation"
              >
                Login
              </Link>
              <Link
                to="/auth?signup=true"
                className="text-sm font-medium bg-[var(--color-primary)] text-white px-3 sm:px-4 py-2 rounded-md hover:opacity-90 transition-opacity touch-manipulation"
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
