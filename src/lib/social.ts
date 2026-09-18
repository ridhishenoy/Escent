const SOCIAL_KEY = 'escent.social'

export type RequestStatus = 'pending' | 'accepted' | 'declined'

export type FollowRequest = {
  id: string
  from: string
  to: string
  status: RequestStatus
  createdAt: string
}

export type FollowRelation = 'self' | 'none' | 'pending_out' | 'pending_in' | 'following'

type SocialState = {
  requests: FollowRequest[]
}

function readSocial(): SocialState {
  const raw = localStorage.getItem(SOCIAL_KEY)
  if (!raw) {
    return { requests: [] }
  }

  try {
    const parsed = JSON.parse(raw) as SocialState
    return { requests: Array.isArray(parsed.requests) ? parsed.requests : [] }
  } catch {
    return { requests: [] }
  }
}

function writeSocial(state: SocialState): void {
  localStorage.setItem(SOCIAL_KEY, JSON.stringify(state))
}

function createId(): string {
  return crypto.randomUUID()
}

export function listRequests(): FollowRequest[] {
  return readSocial().requests
}

function upsertRequest(next: FollowRequest): FollowRequest {
  const state = readSocial()
  const index = state.requests.findIndex((request) => request.id === next.id)
  if (index >= 0) {
    state.requests[index] = next
  } else {
    state.requests.push(next)
  }
  writeSocial(state)
  return next
}

export function findPair(from: string, to: string): FollowRequest | undefined {
  return readSocial().requests.find((request) => request.from === from && request.to === to)
}

export function getFollowRelation(viewer: string, target: string): FollowRelation {
  if (viewer === target) {
    return 'self'
  }

  const outgoing = findPair(viewer, target)
  if (outgoing?.status === 'accepted') {
    return 'following'
  }
  if (outgoing?.status === 'pending') {
    return 'pending_out'
  }

  const incoming = findPair(target, viewer)
  if (incoming?.status === 'pending') {
    return 'pending_in'
  }

  return 'none'
}

export function getFollowing(username: string): string[] {
  return readSocial()
    .requests.filter((request) => request.from === username && request.status === 'accepted')
    .map((request) => request.to)
}

export function getIncomingRequests(username: string): FollowRequest[] {
  return readSocial().requests.filter((request) => request.to === username && request.status === 'pending')
}

export function sendFollowRequest(from: string, to: string, autoAccept = false): FollowRequest {
  if (from === to) {
    throw new Error('You already have you.')
  }

  const existing = findPair(from, to)
  if (existing?.status === 'accepted') {
    return existing
  }
  if (existing?.status === 'pending') {
    return existing
  }

  const request: FollowRequest = existing
    ? { ...existing, status: autoAccept ? 'accepted' : 'pending', createdAt: new Date().toISOString() }
    : {
        id: createId(),
        from,
        to,
        status: autoAccept ? 'accepted' : 'pending',
        createdAt: new Date().toISOString(),
      }

  return upsertRequest(request)
}

export function cancelFollowRequest(from: string, to: string): void {
  const existing = findPair(from, to)
  if (!existing || existing.status === 'accepted') {
    return
  }

  const state = readSocial()
  state.requests = state.requests.filter((request) => request.id !== existing.id)
  writeSocial(state)
}

export function unfollow(from: string, to: string): void {
  const existing = findPair(from, to)
  if (!existing) {
    return
  }

  const state = readSocial()
  state.requests = state.requests.filter((request) => request.id !== existing.id)
  writeSocial(state)
}

export function acceptFollowRequest(id: string): FollowRequest | null {
  const state = readSocial()
  const request = state.requests.find((item) => item.id === id)
  if (!request) {
    return null
  }
  request.status = 'accepted'
  writeSocial(state)
  return request
}

export function declineFollowRequest(id: string): void {
  const state = readSocial()
  const request = state.requests.find((item) => item.id === id)
  if (!request) {
    return
  }
  request.status = 'declined'
  writeSocial(state)
}

export function ensureAcceptedFollow(from: string, to: string): void {
  sendFollowRequest(from, to, true)
}

export function ensurePendingFollow(from: string, to: string): void {
  const existing = findPair(from, to)
  if (existing) {
    return
  }
  sendFollowRequest(from, to, false)
}
