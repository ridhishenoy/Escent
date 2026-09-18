import { listUsernames } from './accounts'

const PROFILES_KEY = 'escent.profiles'
const JOURNALS_KEY = 'escent.journals'

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
}

export type JournalPost = {
  id: string
  subjectId: string
  title: string
  sections: PostSection[]
  comments: PostComment[]
  imageDataUrl: string | null
  createdAt: string
}

export type Journal = {
  subjects: Subject[]
  posts: JournalPost[]
}

type StoredPost = Partial<Omit<JournalPost, 'sections' | 'comments'>> & {
  body?: string
  sections?: Array<Partial<PostSection>>
  comments?: Array<Partial<PostComment> & { body?: string; authorUsername: string }>
}

export const SUBJECT_COLORS = ['#ec4899', '#db2777', '#f472b6', '#fb7185', '#c084fc', '#f43f5e', '#e11d48', '#9d174d']

export function createEntryId(): string {
  return crypto.randomUUID()
}

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function readProfiles(): Record<string, UserProfile> {
  return readJson(PROFILES_KEY, {})
}

function writeProfiles(profiles: Record<string, UserProfile>): void {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

function readJournals(): Record<string, Journal> {
  return readJson(JOURNALS_KEY, {})
}

function writeJournals(journals: Record<string, Journal>): void {
  localStorage.setItem(JOURNALS_KEY, JSON.stringify(journals))
}

export function getProfile(username: string): UserProfile {
  return (
    readProfiles()[username] ?? {
      username,
      displayName: username,
      avatarDataUrl: null,
    }
  )
}

export function listProfiles(): UserProfile[] {
  return Object.values(readProfiles())
}

export function listJournalOwners(): string[] {
  return Object.keys(readJournals())
}

export function listDiscoverablePeople(exclude?: string): UserProfile[] {
  const names = new Set([...listUsernames(), ...listProfiles().map((profile) => profile.username), ...listJournalOwners()])
  if (exclude) {
    names.delete(exclude)
  }

  return [...names]
    .map((username) => getProfile(username))
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
}

export function saveProfile(profile: UserProfile): UserProfile {
  const profiles = readProfiles()
  profiles[profile.username] = profile
  writeProfiles(profiles)
  return profile
}

function normalizePost(post: StoredPost): JournalPost {
  const sections = Array.isArray(post.sections)
    ? post.sections.map((section) => ({
        id: section.id || createEntryId(),
        question: section.question ?? '',
        answer: section.answer ?? '',
        askedBy: section.askedBy ?? null,
      }))
    : post.body?.trim()
      ? [{ id: createEntryId(), question: 'Notes', answer: post.body, askedBy: null }]
      : []

  const comments = Array.isArray(post.comments)
    ? post.comments
        .filter((comment) => Boolean(comment.authorUsername && comment.body?.trim()))
        .map((comment) => ({
          id: comment.id || createEntryId(),
          authorUsername: comment.authorUsername,
          body: (comment.body ?? '').trim(),
          createdAt: comment.createdAt || new Date().toISOString(),
        }))
    : []

  return {
    id: post.id || createEntryId(),
    subjectId: post.subjectId ?? '',
    title: post.title ?? '',
    sections,
    comments,
    imageDataUrl: post.imageDataUrl ?? null,
    createdAt: post.createdAt ?? new Date().toISOString(),
  }
}

export function getJournal(username: string): Journal {
  const stored = readJournals()[username] ?? { subjects: [], posts: [] }
  return {
    subjects: stored.subjects ?? [],
    posts: (stored.posts as StoredPost[]).map(normalizePost),
  }
}

function saveJournal(username: string, journal: Journal): Journal {
  const journals = readJournals()
  journals[username] = journal
  writeJournals(journals)
  return journal
}

export function replaceJournal(username: string, journal: Journal): Journal {
  return saveJournal(username, journal)
}

export function addSubject(username: string, name: string, color: string): Journal {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('Give the subject a name.')
  }

  const journal = getJournal(username)
  const taken = journal.subjects.some((subject) => subject.name.toLowerCase() === trimmed.toLowerCase())
  if (taken) {
    throw new Error('You already have that subject.')
  }

  journal.subjects.push({ id: createEntryId(), name: trimmed, color })
  return saveJournal(username, journal)
}

export function removeSubject(username: string, subjectId: string): Journal {
  const journal = getJournal(username)
  journal.subjects = journal.subjects.filter((subject) => subject.id !== subjectId)
  journal.posts = journal.posts.filter((post) => post.subjectId !== subjectId)
  return saveJournal(username, journal)
}

export function addPost(username: string, post: Omit<JournalPost, 'id' | 'createdAt' | 'comments'>): Journal {
  const journal = getJournal(username)
  const subjectExists = journal.subjects.some((subject) => subject.id === post.subjectId)
  if (!subjectExists) {
    throw new Error('Pick a subject first.')
  }

  const sections = post.sections
    .map((section) => ({
      ...section,
      question: section.question.trim(),
      answer: section.answer.trim(),
      askedBy: section.askedBy ?? null,
    }))
    .filter((section) => section.question || section.answer)

  if (!post.title.trim() && sections.length === 0 && !post.imageDataUrl) {
    throw new Error('Add a title or at least one question and answer.')
  }

  journal.posts.unshift({
    ...post,
    sections,
    comments: [],
    id: createEntryId(),
    createdAt: new Date().toISOString(),
  })
  return saveJournal(username, journal)
}

export function removePost(username: string, postId: string): Journal {
  const journal = getJournal(username)
  journal.posts = journal.posts.filter((post) => post.id !== postId)
  return saveJournal(username, journal)
}

function updatePost(username: string, postId: string, updater: (post: JournalPost) => JournalPost): Journal {
  const journal = getJournal(username)
  const index = journal.posts.findIndex((post) => post.id === postId)
  if (index < 0) {
    throw new Error('That post is gone.')
  }

  journal.posts[index] = updater(journal.posts[index])
  return saveJournal(username, journal)
}

export function addQuestionToPost(ownerUsername: string, postId: string, askedBy: string, question: string): Journal {
  const trimmed = question.trim()
  if (!trimmed) {
    throw new Error('Write a question first.')
  }

  return updatePost(ownerUsername, postId, (post) => ({
    ...post,
    sections: [
      ...post.sections,
      {
        id: createEntryId(),
        question: trimmed,
        answer: '',
        askedBy,
      },
    ],
  }))
}

export function answerPostQuestion(ownerUsername: string, postId: string, sectionId: string, answer: string): Journal {
  const trimmed = answer.trim()
  if (!trimmed) {
    throw new Error('Write an answer first.')
  }

  return updatePost(ownerUsername, postId, (post) => ({
    ...post,
    sections: post.sections.map((section) => (section.id === sectionId ? { ...section, answer: trimmed } : section)),
  }))
}

export function addCommentToPost(ownerUsername: string, postId: string, authorUsername: string, body: string): Journal {
  const trimmed = body.trim()
  if (!trimmed) {
    throw new Error('Write a comment first.')
  }

  return updatePost(ownerUsername, postId, (post) => ({
    ...post,
    comments: [
      ...post.comments,
      {
        id: createEntryId(),
        authorUsername,
        body: trimmed,
        createdAt: new Date().toISOString(),
      },
    ],
  }))
}

export function removePostComment(
  ownerUsername: string,
  postId: string,
  commentId: string,
  requester: string,
): Journal {
  return updatePost(ownerUsername, postId, (post) => {
    const comment = post.comments.find((item) => item.id === commentId)
    if (!comment) {
      throw new Error('That comment is gone.')
    }
    if (requester !== ownerUsername && requester !== comment.authorUsername) {
      throw new Error('You cannot delete that comment.')
    }

    return {
      ...post,
      comments: post.comments.filter((item) => item.id !== commentId),
    }
  })
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
