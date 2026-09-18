import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getProfile } from '../lib/journal'

type AuthState = {
  username: string | null
  avatarUrl: string | null
  displayName: string | null
  signIn: (username: string) => void
  updateProfile: (patch: { avatarUrl?: string | null; displayName?: string }) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      username: null,
      avatarUrl: null,
      displayName: null,
      signIn: (username) => {
        const profile = getProfile(username)
        set({
          username,
          avatarUrl: profile.avatarDataUrl,
          displayName: profile.displayName,
        })
      },
      updateProfile: (patch) =>
        set((state) => ({
          avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : state.avatarUrl,
          displayName: patch.displayName !== undefined ? patch.displayName : state.displayName,
        })),
      logout: () => set({ username: null, avatarUrl: null, displayName: null }),
    }),
    { name: 'escent.session' },
  ),
)
