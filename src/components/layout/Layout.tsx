import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../store/auth'
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
