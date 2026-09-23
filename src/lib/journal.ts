import { supabase } from './supabase'
import { getProfileId } from './social'

export type UserProfile = {
  username: string
  displayName: string
  avatarDataUrl: string | null
}

export type Subject = {
  id: string
  name: string
  color: string
}

export type PostSection = {
  id: string
  question: string
  answer: string
  askedBy: string | null
}

export type PostComment = {
  id: string
  authorUsername: string
  body: string
  createdAt: string
  parentId?: string | null
}

export type JournalPost = {
  id: string
  subjectId: string
  title: string
  sections: PostSection[]
  comments: PostComment[]
  imageDataUrl: string | null
  imageUrls: string[]
  createdAt: string
}

export type Journal = {
  subjects: Subject[]
  posts: JournalPost[]
}

export const SUBJECT_COLORS = ['#ec4899', '#db2777', '#f472b6', '#fb7185', '#c084fc', '#f43f5e', '#e11d48', '#9d174d']

export function createEntryId(): string {
  return crypto.randomUUID()
}

export async function getProfile(username: string): Promise<UserProfile> {
  const { data } = await supabase.from('profiles').select('*').eq('username', username).maybeSingle()
  return {
    username,
    displayName: data?.display_name || username,
    avatarDataUrl: data?.avatar_url || null,
  }
}

export async function listProfiles(): Promise<UserProfile[]> {
  const { data } = await supabase.from('profiles').select('*')
  return (data || []).map(row => ({
    username: row.username,
    displayName: row.display_name || row.username,
    avatarDataUrl: row.avatar_url || null,
  }))
}

export async function listJournalOwners(): Promise<string[]> {
  const { data } = await supabase.from('posts').select('profiles!inner(username)')
  const set = new Set((data || []).map((row: any) => row.profiles?.username).filter(Boolean))
  return Array.from(set)
}

export async function listDiscoverablePeople(exclude?: string): Promise<UserProfile[]> {
  const profiles = await listProfiles()
  const filtered = exclude ? profiles.filter(p => p.username !== exclude) : profiles
  return filtered.sort((left, right) => left.displayName.localeCompare(right.displayName))
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const { data: user } = await supabase.auth.getUser()
  if (!user.user) throw new Error('Not authenticated')

  await supabase.from('profiles').update({
    display_name: profile.displayName,
    avatar_url: profile.avatarDataUrl,
  }).eq('id', user.user.id)

  return profile
}

export async function getJournal(username: string): Promise<Journal> {
  const userId = await getProfileId(username)
  if (!userId) return { subjects: [], posts: [] }

  const { data: subjectsData } = await supabase.from('subjects').select('*').eq('user_id', userId)
  const { data: postsData } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false })

  if (!postsData || postsData.length === 0) {
    return {
      subjects: (subjectsData || []).map(s => ({ id: s.id, name: s.name, color: s.color })),
      posts: []
    }
  }

  const postIds = postsData.map(p => p.id)
  
  const { data: sectionsData } = await supabase.from('post_sections').select('*').in('post_id', postIds)
  const { data: commentsData } = await supabase.from('post_comments').select('*, profiles!inner(username)').in('post_id', postIds).order('created_at', { ascending: true })

  const subjects = (subjectsData || []).map(s => ({ id: s.id, name: s.name, color: s.color }))
  
  const posts = postsData.map(post => {
    const postSections = (sectionsData || []).filter(s => s.post_id === post.id).map(s => ({
      id: s.id,
      question: s.question,
      answer: s.answer || '',
      askedBy: s.asked_by
    }))

    const postComments = (commentsData || []).filter(c => c.post_id === post.id).map(c => ({
      id: c.id,
      authorUsername: c.profiles.username,
      body: c.body,
      createdAt: c.created_at,
      parentId: c.parent_id || null,
    }))

    return {
      id: post.id,
      subjectId: post.subject_id,
      title: post.title,
      imageDataUrl: post.image_url,
      imageUrls: post.image_urls || (post.image_url ? [post.image_url] : []),
      createdAt: post.created_at,
      sections: postSections,
      comments: postComments
    }
  })

  return { subjects, posts }
}

export async function addSubject(username: string, name: string, color: string): Promise<void> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Give the subject a name.')

  const userId = await getProfileId(username)
  if (!userId) throw new Error('User not found.')

  const { data: existing } = await supabase.from('subjects').select('id').eq('user_id', userId).ilike('name', trimmed).maybeSingle()
  if (existing) throw new Error('You already have that subject.')

  await supabase.from('subjects').insert({
    user_id: userId,
    name: trimmed,
    color,
  })
}

export async function removeSubject(_username: string, subjectId: string): Promise<void> {
  await supabase.from('subjects').delete().eq('id', subjectId)
}

export async function addPost(username: string, post: Omit<JournalPost, 'id' | 'createdAt' | 'comments'>): Promise<void> {
  const userId = await getProfileId(username)
  if (!userId) throw new Error('User not found.')

  const sections = post.sections
    .map((section) => ({
      ...section,
      question: section.question.trim(),
      answer: section.answer.trim(),
      askedBy: section.askedBy ?? null,
    }))
    .filter((section) => section.question || section.answer)

  if (!post.title.trim() && sections.length === 0 && !post.imageDataUrl && (!post.imageUrls || post.imageUrls.length === 0)) {
    throw new Error('Add a title, a question, or an image.')
  }

  const { data: insertedPost, error } = await supabase.from('posts').insert({
    user_id: userId,
    subject_id: post.subjectId,
    title: post.title,
    image_url: post.imageDataUrl,
    image_urls: post.imageUrls,
  }).select('id').single()

  if (error || !insertedPost) throw new Error('Could not create post.')

  if (sections.length > 0) {
    const sectionsToInsert = sections.map(s => ({
      post_id: insertedPost.id,
      question: s.question,
      answer: s.answer,
      asked_by: s.askedBy
    }))
    await supabase.from('post_sections').insert(sectionsToInsert)
  }
}

export async function removePost(_username: string, postId: string): Promise<void> {
  await supabase.from('posts').delete().eq('id', postId)
}

export async function addQuestionToPost(_ownerUsername: string, postId: string, askedBy: string, question: string): Promise<void> {
  const trimmed = question.trim()
  if (!trimmed) throw new Error('Write a question first.')

  await supabase.from('post_sections').insert({
    post_id: postId,
    question: trimmed,
    answer: '',
    asked_by: askedBy,
  })
}

export async function answerPostQuestion(_ownerUsername: string, _postId: string, sectionId: string, answer: string): Promise<void> {
  const trimmed = answer.trim()
  if (!trimmed) throw new Error('Write an answer first.')

  await supabase.from('post_sections').update({ answer: trimmed }).eq('id', sectionId)
}

export async function addCommentToPost(_ownerUsername: string, postId: string, authorUsername: string, body: string, parentId?: string | null): Promise<void> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error('Write a comment first.')

  const authorId = await getProfileId(authorUsername)
  if (!authorId) throw new Error('Author not found.')

  await supabase.from('post_comments').insert({
    post_id: postId,
    author_id: authorId,
    body: trimmed,
    parent_id: parentId || null
  })
}

export async function removePostComment(
  _ownerUsername: string,
  _postId: string,
  commentId: string,
  _requester: string,
): Promise<void> {
  await supabase.from('post_comments').delete().eq('id', commentId)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read that image.'))
    image.src = src
  })
}

export async function fileToCompressedDataUrl(file: File, maxEdge: number): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(objectUrl)
    const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Could not process that image.')
    }
    context.drawImage(image, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
