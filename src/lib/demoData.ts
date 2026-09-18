import { createEntryId, replaceJournal, saveProfile, type Journal, type JournalPost, type Subject } from './journal'
import { ensureAcceptedFollow, ensurePendingFollow } from './social'

const DEMO_FLAG = 'escent.demoSeeded'
const DEMO_VERSION = 'v2'

export const DEMO_USERNAMES = ['maya_codes', 'arjun_notes', 'priya_learns'] as const

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function avatar(initials: string, background: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="64" fill="${background}"/>
    <text x="64" y="76" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="700" fill="#fff">${initials}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function post(
  subjectId: string,
  title: string,
  hours: number,
  sections: { question: string; answer: string }[],
): JournalPost {
  return {
    id: createEntryId(),
    subjectId,
    title,
    imageDataUrl: null,
    createdAt: hoursAgo(hours),
    sections: sections.map((section) => ({
      id: createEntryId(),
      question: section.question,
      answer: section.answer,
    })),
  }
}

function subject(name: string, color: string): Subject {
  return { id: createEntryId(), name, color }
}

function mayaJournal(): Journal {
  const structures = subject('Data Structures', '#ec4899')
  const systems = subject('Systems', '#db2777')
  return {
    subjects: [structures, systems],
    posts: [
      post(structures.id, 'Hash maps clicked today', 3, [
        {
          question: 'Why is lookup O(1) on average?',
          answer: 'A good hash spreads keys into buckets. If collisions stay rare, you jump straight to the slot.',
        },
        {
          question: 'When does it get slow?',
          answer: 'When too many keys land in the same bucket. Then it starts looking like a linked list.',
        },
      ]),
      post(systems.id, 'What is a process, actually?', 18, [
        {
          question: 'Process vs thread?',
          answer: 'A process is the whole program with its own memory. Threads share that memory and can step on each other.',
        },
      ]),
    ],
  }
}

function arjunJournal(): Journal {
  const mechanics = subject('Mechanics', '#c084fc')
  const quantum = subject('Quantum', '#f43f5e')
  return {
    subjects: [mechanics, quantum],
    posts: [
      post(mechanics.id, 'Newton still eating homework', 5, [
        {
          question: 'If forces are balanced, why isn’t everything frozen?',
          answer: 'Balanced forces mean no acceleration, not no motion. Constant velocity is still motion.',
        },
      ]),
      post(quantum.id, 'Double slit, but make it make sense', 26, [
        {
          question: 'What is actually waving?',
          answer: 'The probability. The particle isn’t a tiny marble in two places. The math is.',
        },
        {
          question: 'Why does measuring change it?',
          answer: 'Because the measurement couples the system to something messy. The superposition doesn’t survive that.',
        },
      ]),
    ],
  }
}

function priyaJournal(): Journal {
  const ui = subject('UI', '#f472b6')
  const js = subject('JavaScript', '#e11d48')
  return {
    subjects: [ui, js],
    posts: [
      post(ui.id, 'Flexbox finally behaved', 2, [
        {
          question: 'Why is my item not centering?',
          answer: 'I forgot the parent needed display flex. Aligning a child does nothing if the parent isn’t a flex container.',
        },
      ]),
      post(js.id, 'Closures in one paragraph', 9, [
        {
          question: 'What is a closure?',
          answer: 'A function that remembers the variables from the place it was born, even after that place is gone.',
        },
        {
          question: 'Why do we care?',
          answer: 'Callbacks, hooks, private state. Most of the “how does this still know that?” moments.',
        },
      ]),
    ],
  }
}

export function isDemoUser(username: string): boolean {
  return (DEMO_USERNAMES as readonly string[]).includes(username)
}

export function ensureDemoWorld(): void {
  if (localStorage.getItem(DEMO_FLAG) === DEMO_VERSION) {
    return
  }

  saveProfile({
    username: 'maya_codes',
    displayName: 'Maya Rao',
    avatarDataUrl: avatar('MR', '#ec4899'),
  })
  saveProfile({
    username: 'arjun_notes',
    displayName: 'Arjun Mehta',
    avatarDataUrl: avatar('AM', '#c084fc'),
  })
  saveProfile({
    username: 'priya_learns',
    displayName: 'Priya Shah',
    avatarDataUrl: avatar('PS', '#f43f5e'),
  })

  replaceJournal('maya_codes', mayaJournal())
  replaceJournal('arjun_notes', arjunJournal())
  replaceJournal('priya_learns', priyaJournal())

  ensureAcceptedFollow('maya_codes', 'arjun_notes')
  ensureAcceptedFollow('arjun_notes', 'priya_learns')
  ensureAcceptedFollow('priya_learns', 'maya_codes')

  localStorage.setItem(DEMO_FLAG, DEMO_VERSION)
}

export function welcomeDemoRequest(username: string): void {
  if (!username || isDemoUser(username)) {
    return
  }
  ensurePendingFollow('priya_learns', username)
}
