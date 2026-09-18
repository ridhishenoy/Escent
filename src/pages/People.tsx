import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import FollowButton from '../components/social/FollowButton'
import { getProfile, listDiscoverablePeople } from '../lib/journal'
import { acceptFollowRequest, declineFollowRequest, getFollowRelation, getIncomingRequests } from '../lib/social'
import { useAuth } from '../store/auth'

export default function People() {
  const username = useAuth((state) => state.username)
  const [query, setQuery] = useState('')
  const [revision, setRevision] = useState(0)

  const incoming = useMemo(
    () => (username ? getIncomingRequests(username) : []),
    [username, revision],
  )

  const people = useMemo(() => {
    if (!username) {
      return []
    }

    const needle = query.trim().toLowerCase()
    return listDiscoverablePeople(username).filter((person) => {
      if (!needle) {
        return true
      }
      return (
        person.username.toLowerCase().includes(needle) || person.displayName.toLowerCase().includes(needle)
      )
    })
  }, [username, query, revision])

  if (!username) {
    return <Navigate to="/auth" replace />
  }

  function refresh() {
    setRevision((value) => value + 1)
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Find people</h1>
        <p className="text-[var(--color-muted)] mt-1">
          Send a follow request. If they accept, their posts show up on your feed.
        </p>
      </div>

      {incoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold">Follow requests</h2>
          {incoming.map((request) => {
            const person = getProfile(request.from)
            return (
              <article
                key={request.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4"
              >
                <Link to={`/${person.username}`} className="flex items-center gap-3 min-w-0">
                  {person.avatarDataUrl ? (
                    <img src={person.avatarDataUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="h-11 w-11 rounded-full bg-[var(--color-primary-soft)]" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{person.displayName}</p>
                    <p className="text-sm text-[var(--color-muted)]">@{person.username} wants to follow you</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      acceptFollowRequest(request.id)
                      refresh()
                    }}
                    className="rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      declineFollowRequest(request.id)
                      refresh()
                    }}
                    className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium"
                  >
                    Decline
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      ) : null}

      <label className="block text-sm font-medium">
        Search
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or username"
          className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <section className="space-y-3">
        {people.length === 0 ? (
          <p className="text-[var(--color-muted)]">No one matches that search.</p>
        ) : (
          people.map((person) => {
            const relation = getFollowRelation(username, person.username)
            return (
              <article
                key={person.username}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4"
              >
                <Link to={`/${person.username}`} className="flex items-center gap-3 min-w-0">
                  {person.avatarDataUrl ? (
                    <img src={person.avatarDataUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="h-11 w-11 rounded-full bg-[var(--color-primary-soft)]" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{person.displayName}</p>
                    <p className="text-sm text-[var(--color-muted)]">@{person.username}</p>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1">
                  <FollowButton viewer={username} target={person.username} onChange={refresh} />
                  {relation === 'following' ? (
                    <p className="text-xs text-[var(--color-muted)]">Their posts are on your feed</p>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
