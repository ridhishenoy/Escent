import { useMemo } from 'react'
import { Link, Navigate } from 'react-router-dom'
import PostCard from '../components/journal/PostCard'
import { getJournal, getProfile } from '../lib/journal'
import { getFollowing } from '../lib/social'
import { useAuth } from '../store/auth'

export default function Feed() {
  const username = useAuth((state) => state.username)

  const items = useMemo(() => {
    if (!username) {
      return []
    }

    return getFollowing(username)
      .flatMap((author) => {
        const journal = getJournal(author)
        const profile = getProfile(author)
        return journal.posts.map((post) => ({
          author: profile,
          post,
          subject: journal.subjects.find((subject) => subject.id === post.subjectId),
        }))
      })
      .sort((left, right) => right.post.createdAt.localeCompare(left.post.createdAt))
  }, [username])

  if (!username) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Feed</h1>
        <p className="text-[var(--color-muted)] mt-1">Findings from people you follow.</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-6 text-[var(--color-muted)]">
          Your feed is quiet. Find people and send a follow request — once they accept, their posts land here.
        </p>
      ) : (
        <div className="space-y-5">
          {items.map(({ author, post, subject }) => (
            <div key={`${author.username}-${post.id}`} className="space-y-2">
              <Link to={`/${author.username}`} className="flex items-center gap-3 px-1">
                {author.avatarDataUrl ? (
                  <img
                    src={author.avatarDataUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover border border-[var(--color-border)]"
                  />
                ) : (
                  <span className="h-9 w-9 rounded-full bg-[var(--color-primary-soft)]" />
                )}
                <div>
                  <p className="text-sm font-semibold leading-tight">{author.displayName}</p>
                  <p className="text-xs text-[var(--color-muted)]">@{author.username}</p>
                </div>
              </Link>
              <PostCard post={post} subject={subject} editable={false} onDelete={() => undefined} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
