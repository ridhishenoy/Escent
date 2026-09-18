const PROFILES_KEY = 'escent.profiles'
const JOURNALS_KEY = 'escent.journals'

export type FontChoice = 'sans' | 'serif' | 'mono' | 'cursive'
export type SizeChoice = 'sm' | 'md' | 'lg' | 'xl'
export type AlignChoice = 'left' | 'center' | 'right'
export type WeightChoice = 'normal' | 'medium' | 'bold'

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

export type JournalPost = {
  id: string
  subjectId: string
  title: string
  body: string
  backgroundColor: string
  textColor: string
  accentColor: string
  font: FontChoice
  size: SizeChoice
  align: AlignChoice
  weight: WeightChoice
  italic: boolean
  imageDataUrl: string | null
  createdAt: string
}

export type Journal = {
  subjects: Subject[]
  posts: JournalPost[]
}

export const SUBJECT_COLORS = ['#ec4899', '#db2777', '#f472b6', '#fb7185', '#c084fc', '#f43f5e', '#e11d48', '#9d174d']

export const DEFAULT_POST_STYLE = {
  backgroundColor: '#ffffff',
  textColor: '#4a1233',
  accentColor: '#ec4899',
  font: 'sans' as FontChoice,
  size: 'md' as SizeChoice,
  align: 'left' as AlignChoice,
  weight: 'normal' as WeightChoice,
  italic: false,
}

function createId(): string {
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

export function getJournal(username: string): Journal {
  return readJournals()[username] ?? { subjects: [], posts: [] }
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

  journal.subjects.push({ id: createId(), name: trimmed, color })
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

  if (!post.title.trim() && !post.body.trim() && !post.imageDataUrl) {
    throw new Error('Write something, or add a photo.')
  }

  journal.posts.unshift({
    ...post,
    id: createId(),
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
