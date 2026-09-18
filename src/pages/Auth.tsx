import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthError, authenticateUser, registerUser } from '../lib/accounts'
import { useAuth } from '../store/auth'

const inputClassName =
  'mt-1 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-[var(--color-foreground)] outline-none transition-shadow focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const isSignup = searchParams.get('signup') === 'true'
  const navigate = useNavigate()
  const currentUsername = useAuth((state) => state.username)
  const setUsername = useAuth((state) => state.setUsername)

  const [username, setUsernameField] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (currentUsername) {
      navigate(`/${currentUsername}`, { replace: true })
    }
  }, [currentUsername, navigate])

  useEffect(() => {
    setError('')
    setPassword('')
  }, [isSignup])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const savedUsername = isSignup
        ? await registerUser(username, password)
        : await authenticateUser(username, password)

      setUsername(savedUsername)
      navigate(`/${savedUsername}`)
    } catch (caught) {
      if (caught instanceof AuthError) {
        setError(caught.message)
        return
      }

      setError('Something went wrong. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const title = isSignup ? 'Create your space' : 'Welcome back'
  const submitLabel = isSignup ? 'Sign up' : 'Log in'
  const switchPrompt = isSignup ? 'Already have an account?' : 'New here?'
  const switchLabel = isSignup ? 'Log in' : 'Sign up'
  const switchTo = isSignup ? '/auth' : '/auth?signup=true'

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-border)]">
      <h2 className="text-2xl font-bold mb-2 text-center">{title}</h2>
      <p className="text-center text-[var(--color-muted)] mb-8">
        {isSignup
          ? 'Pick a username. Once someone has it, it’s theirs.'
          : 'Log in with your username and password.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <label className="block text-left text-sm font-medium">
          Username
          <input
            className={inputClassName}
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsernameField(event.target.value)}
            aria-invalid={Boolean(error)}
            required
          />
        </label>

        <label className="block text-left text-sm font-medium">
          Password
          <input
            className={inputClassName}
            type="password"
            name="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={isSignup ? 6 : undefined}
            required
          />
        </label>

        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 bg-[var(--color-primary)] text-white font-semibold py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {isSubmitting ? 'Working…' : submitLabel}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-muted)] mt-6">
        {switchPrompt}{' '}
        <Link to={switchTo} className="font-medium text-[var(--color-primary)] hover:opacity-80">
          {switchLabel}
        </Link>
      </p>
    </div>
  )
}
