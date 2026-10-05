import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { BookOpen, Globe, Lock, Users } from 'lucide-react'
import FollowButton from '../components/social/FollowButton'
import { getJournal, getProfile, listDiscoverablePeople, type Subject } from '../lib/journal'
import { acceptFollowRequest, declineFollowRequest, getFollowRelation, getIncomingRequests } from '../lib/social'
import { useAuth } from '../store/auth'

type SubjectGroup = {
  name: string
  color: string
  learners: { username: string; displayName: string; avatarUrl: string | null }[]
}

export default function People() {
  const username = useAuth((state) => state.username)
  const [tab, setTab] = useState<'learners' | 'topics'>('learners')
  const [query, setQuery] = useState('')

  const { data: incoming = [], refetch: refetchIncoming } = useQuery({
    queryKey: ['incoming', username],
    queryFn: async () => {
      if (!username) return []
      const reqs = await getIncomingRequests(username)
      return Promise.all(
        reqs.map(async (req) => {
          const profile = await getProfile(req.from)
          return { req, profile }
        }),
      )
    },
    enabled: Boolean(username),
  })

  const { data: people = [], refetch: refetchPeople, isLoading: isPeopleLoading } = useQuery({
    queryKey: ['people', username, query],
    queryFn: async () => {
      if (!username) return []
      const list = await listDiscoverablePeople(username)
      const needle = query.trim().toLowerCase()
      const filtered = list.filter((person) => {
        if (!needle) return true
        return person.username.toLowerCase().includes(needle) || person.displayName.toLowerCase().includes(needle)
      })

      return Promise.all(
        filtered.map(async (person) => {
          const relation = await getFollowRelation(username, person.username)
          return { person, relation }
        }),
      )
    },
    enabled: Boolean(username),
  })

  // Topics exploration query
  const { data: topicGroups = [], isLoading: isTopicsLoading } = useQuery({
    queryKey: ['topics', username],
    queryFn: async () => {
      const allPeople = await listDiscoverablePeople()
      const groupsMap = new Map<string, SubjectGroup>()

      await Promise.all(
        allPeople.map(async (person) => {
          try {
            const j = await getJournal(person.username)
            j.subjects.forEach((sub: Subject) => {
              const key = sub.name.trim().toLowerCase()
              if (!groupsMap.has(key)) {
                groupsMap.set(key, {
                  name: sub.name.trim(),
                  color: sub.color || 'var(--color-primary)',
                  learners: [],
                })
              }
              const g = groupsMap.get(key)!
              if (!g.learners.some((l) => l.username === person.username)) {
                g.learners.push({
                  username: person.username,
                  displayName: person.displayName,
                  avatarUrl: person.avatarDataUrl,
                })
              }
            })
          } catch {
            // Ignore individual fetch errors
          }
        })
      )

      return Array.from(groupsMap.values()).sort((a, b) => b.learners.length - a.learners.length)
    },
    enabled: Boolean(username),
  })

  if (!username) {
    return <Navigate to="/auth" replace />
  }

  function refresh() {
    refetchIncoming()
    refetchPeople()
  }

  const filteredTopics = topicGroups.filter((t) => {
    if (!query.trim()) return true
    const needle = query.trim().toLowerCase()
    return t.name.toLowerCase().includes(needle)
  })

  return (
    <div className="space-y-6 sm:space-y-8 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Explore & Connect</h1>
          <p className="text-sm sm:text-base text-[var(--color-muted)] mt-1">
            Discover learners and explore topics people are actively studying.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[var(--color-border)] rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('learners')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'learners'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <Users size={14} />
            <span>Learners</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('topics')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              tab === 'topics'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            <BookOpen size={14} />
            <span>Topics ({topicGroups.length})</span>
          </button>
        </div>
      </div>

      {/* Follow requests */}
      {incoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Follow requests</h2>
          {incoming.map(({ req: request, profile: person }) => (
            <article
              key={request.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4"
            >
              <Link to={`/${person.username}`} className="flex items-center gap-3 min-w-0">
                {person.avatarDataUrl ? (
                  <img src={person.avatarDataUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="h-11 w-11 shrink-0 rounded-full bg-[var(--color-primary-soft)]" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold truncate">{person.displayName}</p>
                  <p className="text-sm text-[var(--color-muted)]">@{person.username} wants to follow you</p>
                </div>
              </Link>
              <div className="flex items-center gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    await acceptFollowRequest(request.id)
                    refresh()
                  }}
                  className="flex-1 sm:flex-none rounded-md bg-[var(--color-primary)] px-3 py-2.5 sm:py-1.5 text-sm font-semibold text-white hover:opacity-90 touch-manipulation cursor-pointer"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await declineFollowRequest(request.id)
                    refresh()
                  }}
                  className="flex-1 sm:flex-none rounded-md border border-[var(--color-border)] px-3 py-2.5 sm:py-1.5 text-sm font-medium touch-manipulation cursor-pointer"
                >
                  Decline
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {/* Search Input */}
      <label className="block text-sm font-medium">
        {tab === 'learners' ? 'Search Learners' : 'Search Topics'}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tab === 'learners' ? 'Name or @username' : 'e.g. Physics, React, Machine Learning…'}
          className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)] text-sm"
        />
      </label>

      {/* Learners List View */}
      {tab === 'learners' && (
        <section className="space-y-3">
          {isPeopleLoading ? (
            <p className="text-[var(--color-muted)]">Searching learners...</p>
          ) : people.length === 0 ? (
            <p className="text-[var(--color-muted)] p-6 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-white">
              No learners match that search.
            </p>
          ) : (
            people.map(({ person, relation }) => (
              <article
                key={person.username}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4"
              >
                <Link to={`/${person.username}`} className="flex items-center gap-3 min-w-0">
                  {person.avatarDataUrl ? (
                    <img src={person.avatarDataUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="h-11 w-11 shrink-0 rounded-full bg-[var(--color-primary-soft)]" />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold truncate">{person.displayName}</p>
                      {person.isPrivate ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          <Globe size={10} /> Public
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-muted)]">@{person.username}</p>
                  </div>
                </Link>
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 sm:shrink-0">
                  <FollowButton viewer={username} target={person.username} onChange={refresh} />
                  {relation === 'following' ? (
                    <p className="text-xs text-[var(--color-muted)]">Their posts are on your feed</p>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* Topics / Subjects Exploration View */}
      {tab === 'topics' && (
        <section className="space-y-3">
          {isTopicsLoading ? (
            <p className="text-[var(--color-muted)]">Loading topics from journals...</p>
          ) : filteredTopics.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-[var(--color-border)] rounded-xl bg-white space-y-2">
              <p className="text-sm font-semibold">No topics found</p>
              <p className="text-xs text-[var(--color-muted)]">
                Create subjects in your journal to start grouping learning topics!
              </p>
            </div>
          ) : (
            filteredTopics.map((topic) => (
              <article
                key={topic.name}
                className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-3.5 rounded-full shrink-0" style={{ backgroundColor: topic.color }} />
                    <h3 className="font-bold text-base sm:text-lg text-[var(--color-foreground)]">{topic.name}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {topic.learners.length} {topic.learners.length === 1 ? 'learner' : 'learners'}
                  </span>
                </div>

                <div className="pt-1">
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                    Learners studying this:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {topic.learners.map((learner) => (
                      <Link
                        key={learner.username}
                        to={`/${learner.username}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-primary)] transition-colors text-xs font-medium"
                      >
                        {learner.avatarUrl ? (
                          <img src={learner.avatarUrl} alt="" className="size-4 rounded-full object-cover" />
                        ) : (
                          <span className="size-4 rounded-full bg-[var(--color-primary-soft)]" />
                        )}
                        <span>{learner.displayName}</span>
                        <span className="text-[var(--color-muted)] text-[10px]">@{learner.username}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  )
}
