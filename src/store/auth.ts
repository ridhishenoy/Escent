import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AuthState = {
  username: string | null
  setUsername: (username: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      username: null,
      setUsername: (username) => set({ username }),
      logout: () => set({ username: null }),
    }),
    { name: 'escent.session' },
  ),
)
