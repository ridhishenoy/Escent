import { supabase } from './supabase'

const RESERVED_USERNAMES = new Set(['auth', 'login', 'signup', 'logout', 'setup', 'journal', 'feed', 'people', 'find'])

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase()
}

export function validateUsername(username: string): string {
  const normalized = normalizeUsername(username)

  if (!normalized) {
    throw new AuthError('Choose a username.')
  }

  if (normalized.length < 3 || normalized.length > 20) {
    throw new AuthError('Username must be 3–20 characters.')
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    throw new AuthError('Use letters, numbers, and underscores only.')
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    throw new AuthError('That username is reserved. Try another.')
  }

  return normalized
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username)
  const { data, error } = await supabase.from('profiles').select('username').eq('username', normalized).single()
  return Boolean(data && !error)
}

export async function listUsernames(): Promise<string[]> {
  const { data } = await supabase.from('profiles').select('username')
  return (data || []).map((row) => row.username)
}

function emailForUsername(username: string): string {
  return `${username}@escent.local`
}

export async function registerUser(username: string, password: string): Promise<string> {
  const normalized = validateUsername(username)

  if (!password) {
    throw new AuthError('Choose a password.')
  }

  if (password.length < 6) {
    throw new AuthError('Password must be at least 6 characters.')
  }

  const taken = await isUsernameTaken(normalized)
  if (taken) {
    throw new AuthError('That username is taken. Try another.')
  }

  const email = emailForUsername(normalized)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    throw new AuthError(error.message)
  }

  const user = data.user
  if (!user) {
    throw new AuthError('Signup failed.')
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    username: normalized,
    display_name: normalized,
  })

  if (profileError) {
    // Attempt rollback/cleanup, but mostly just error out
    throw new AuthError('Failed to create profile: ' + profileError.message)
  }

  return normalized
}

export async function authenticateUser(username: string, password: string): Promise<string> {
  const normalized = normalizeUsername(username)

  if (!normalized || !password) {
    throw new AuthError('Enter your username and password.')
  }

  const email = emailForUsername(normalized)
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new AuthError('Username or password is wrong.')
  }

  return normalized
}
