import { supabase } from './supabase'

export type RequestStatus = 'pending' | 'accepted' | 'declined'

export type FollowRequest = {
  id: string
  from: string
  to: string
  status: RequestStatus
  createdAt: string
}

export type FollowRelation = 'self' | 'none' | 'pending_out' | 'pending_in' | 'following'

export async function getProfileId(username: string): Promise<string | null> {
  const { data } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle()
  return data?.id || null
}

export async function findPair(fromUsername: string, toUsername: string): Promise<FollowRequest | undefined> {
  const followerId = await getProfileId(fromUsername)
  const followingId = await getProfileId(toUsername)
  if (!followerId || !followingId) return undefined

  const { data, error } = await supabase
    .from('follows')
    .select('id, status, created_at')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (error || !data) return undefined

  return {
    id: data.id,
    from: fromUsername,
    to: toUsername,
    status: data.status as RequestStatus,
    createdAt: data.created_at,
  }
}

export async function getFollowRelation(viewer: string, target: string): Promise<FollowRelation> {
  if (viewer === target) return 'self'

  const outgoing = await findPair(viewer, target)
  if (outgoing?.status === 'accepted') return 'following'
  if (outgoing?.status === 'pending') return 'pending_out'

  const incoming = await findPair(target, viewer)
  if (incoming?.status === 'pending') return 'pending_in'

  return 'none'
}

export async function getFollowing(username: string): Promise<string[]> {
  const followerId = await getProfileId(username)
  if (!followerId) return []

  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(username)')
    .eq('follower_id', followerId)
    .eq('status', 'accepted')

  if (error || !data) return []
  return data.map((row: any) => row.profiles?.username).filter(Boolean)
}

export async function getIncomingRequests(username: string): Promise<FollowRequest[]> {
  const followingId = await getProfileId(username)
  if (!followingId) return []

  const { data, error } = await supabase
    .from('follows')
    .select('id, status, created_at, profiles!follows_follower_id_fkey(username)')
    .eq('following_id', followingId)
    .eq('status', 'pending')

  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    from: row.profiles?.username,
    to: username,
    status: row.status as RequestStatus,
    createdAt: row.created_at,
  }))
}

export async function sendFollowRequest(fromUsername: string, toUsername: string, autoAccept = false): Promise<void> {
  if (fromUsername === toUsername) throw new Error('You already have you.')

  const followerId = await getProfileId(fromUsername)
  const followingId = await getProfileId(toUsername)
  if (!followerId || !followingId) throw new Error('User not found.')

  const existing = await findPair(fromUsername, toUsername)
  if (existing) {
    if (existing.status !== (autoAccept ? 'accepted' : 'pending')) {
      await supabase.from('follows').update({ status: autoAccept ? 'accepted' : 'pending' }).eq('id', existing.id)
    }
    return
  }

  await supabase.from('follows').insert({
    follower_id: followerId,
    following_id: followingId,
    status: autoAccept ? 'accepted' : 'pending'
  })
}

export async function cancelFollowRequest(fromUsername: string, toUsername: string): Promise<void> {
  const existing = await findPair(fromUsername, toUsername)
  if (!existing || existing.status === 'accepted') return
  await supabase.from('follows').delete().eq('id', existing.id)
}

export async function unfollow(fromUsername: string, toUsername: string): Promise<void> {
  const existing = await findPair(fromUsername, toUsername)
  if (!existing) return
  await supabase.from('follows').delete().eq('id', existing.id)
}

export async function acceptFollowRequest(id: string): Promise<void> {
  await supabase.from('follows').update({ status: 'accepted' }).eq('id', id)
}

export async function declineFollowRequest(id: string): Promise<void> {
  await supabase.from('follows').delete().eq('id', id)
}
