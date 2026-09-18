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
}

export type JournalPost = {
  id: string
  subjectId: string
  title: string
  sections: PostSection[]
  imageDataUrl: string | null
  createdAt: string
}

export type Journal = {
  subjects: Subject[]
  posts: JournalPost[]
}

type StoredPost = Partial<JournalPost> & {
  body?: string
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
      }))
    : post.body?.trim()
      ? [{ id: createEntryId(), question: 'Notes', answer: post.body }]
      : []

  return {
    id: post.id || createEntryId(),
    subjectId: post.subjectId ?? '',
    title: post.title ?? '',
    sections,
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

export function addPost(username: string, post: Omit<JournalPost, 'id' | 'createdAt'>): Journal {
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
    }))
    .filter((section) => section.question || section.answer)

  if (!post.title.trim() && sections.length === 0 && !post.imageDataUrl) {
    throw new Error('Add a title or at least one question and answer.')
  }

  journal.posts.unshift({
    ...post,
    sections,
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
