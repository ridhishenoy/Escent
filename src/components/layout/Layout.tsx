import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../store/auth'
import BottomNav from './BottomNav'
import Navbar from './Navbar'

export default function Layout() {
  const username = useAuth((state) => state.username)
  const signIn = useAuth((state) => state.signIn)

  useEffect(() => {
    if (username) {
      signIn(username)
    }
  }, [username, signIn])

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <Navbar />
      <main
        className={
          username
            ? 'flex-1 max-w-7xl w-full mx-auto px-3 pt-3 pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pt-6 lg:px-8 lg:pt-8'
            : 'flex-1 max-w-7xl w-full mx-auto px-3 py-4 sm:p-6 lg:p-8'
        }
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
