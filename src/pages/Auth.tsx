import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthError, signInWithGoogle } from '../lib/accounts'
import { useAuth } from '../store/auth'

export default function Auth() {
  const navigate = useNavigate()
  const currentUsername = useAuth((state) => state.username)
  const signIn = useAuth((state) => state.signIn)

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentUsername) {
      navigate('/feed')
    }
  }, [currentUsername, navigate])

  async function handleGoogleSignIn() {
    setError('')
    setIsSubmitting(true)
    try {
      const { username } = await signInWithGoogle()
      await signIn(username)
      navigate('/feed')
    } catch (caught) {
      console.error('Sign-in error:', caught)
      if (caught instanceof AuthError) {
        setError(caught.message)
        return
      }
      if (caught instanceof Error && caught.message) {
        try {
          const parsed = JSON.parse(caught.message)
          if (parsed && typeof parsed === 'object' && parsed.error) {
            setError(`Database error: ${parsed.error}`)
            return
          }
        } catch {
          // not JSON formatted
        }
        setError(caught.message)
        return
      }
      setError('Could not complete sign in with Google. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-4 sm:mt-12 lg:mt-20 p-6 sm:p-8 bg-[var(--color-card)] rounded-2xl shadow-sm border border-[var(--color-border)] text-center">
      <div className="inline-flex items-center justify-center size-12 rounded-full bg-[var(--color-primary-soft)]/30 text-[var(--color-primary)] font-bold text-xl mb-4">
        R
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Sign in to Rivise</h2>
      <p className="text-sm sm:text-base text-[var(--color-muted)] mb-8">
        Continue with your Google account to access your personal learning journal, document what you discover, and connect with other learners.
      </p>

      {error ? (
        <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 text-left" role="alert">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white border border-[var(--color-border)] rounded-xl font-semibold text-gray-800 shadow-xs hover:bg-gray-50 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
      >
        <svg className="size-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{isSubmitting ? 'Signing in…' : 'Sign in with Google'}</span>
      </button>

      <p className="mt-8 text-xs text-[var(--color-muted)] leading-relaxed">
        New to Rivise? A profile will automatically be created for your account when you sign in.
      </p>
    </div>
  )
}
