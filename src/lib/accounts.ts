const USERS_KEY = 'escent.accounts'

const RESERVED_USERNAMES = new Set(['auth', 'login', 'signup', 'logout', 'setup', 'journal'])

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

type StoredUser = {
  username: string
  passwordHash: string
  salt: string
  createdAt: string
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function createSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return bytesToHex(bytes.buffer)
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  )
  return bytesToHex(derived)
}

function readUsers(): Record<string, StoredUser> {
  const raw = localStorage.getItem(USERS_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, StoredUser>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeUsers(users: Record<string, StoredUser>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
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

export function isUsernameTaken(username: string): boolean {
  const normalized = normalizeUsername(username)
  return Boolean(readUsers()[normalized])
}

export async function registerUser(username: string, password: string): Promise<string> {
  const normalized = validateUsername(username)

  if (!password) {
    throw new AuthError('Choose a password.')
  }

  if (password.length < 6) {
    throw new AuthError('Password must be at least 6 characters.')
  }

  const users = readUsers()
  if (users[normalized]) {
    throw new AuthError('That username is taken. Try another.')
  }

  const salt = createSalt()
  const passwordHash = await hashPassword(password, salt)

  users[normalized] = {
    username: normalized,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  }
  writeUsers(users)

  return normalized
}

export async function authenticateUser(username: string, password: string): Promise<string> {
  const normalized = normalizeUsername(username)

  if (!normalized || !password) {
    throw new AuthError('Enter your username and password.')
  }

  const user = readUsers()[normalized]
  if (!user) {
    throw new AuthError('Username or password is wrong.')
  }

  const passwordHash = await hashPassword(password, user.salt)
  if (passwordHash !== user.passwordHash) {
    throw new AuthError('Username or password is wrong.')
  }

  return user.username
}
