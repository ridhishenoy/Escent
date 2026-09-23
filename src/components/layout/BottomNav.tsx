import { House, Search, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../store/auth'

export default function BottomNav() {
  const username = useAuth((state) => state.username)
  const avatarUrl = useAuth((state) => state.avatarUrl)

  if (!username) {
    return null
  }

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-0.5 min-h-[3.5rem] py-2 text-[11px] sm:text-xs font-medium touch-manipulation ${
      isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
    }`

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-[var(--color-border)] bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)]">
      <div className="max-w-7xl mx-auto grid grid-cols-3">
        <NavLink to="/feed" className={tabClass}>
          <House size={22} strokeWidth={2} />
          Feed
        </NavLink>
        <NavLink to="/people" className={tabClass}>
          <Search size={22} strokeWidth={2} />
          Find
        </NavLink>
        <NavLink to={`/${username}`} end className={tabClass}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-[22px] w-[22px] rounded-full object-cover ring-1 ring-[var(--color-border)]" />
          ) : (
            <User size={22} strokeWidth={2} />
          )}
          You
        </NavLink>
      </div>
    </nav>
  )
}
