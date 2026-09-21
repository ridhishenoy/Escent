import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from 'react-router-dom'
import PostCard from '../components/journal/PostCard'
import { getJournal, getProfile } from '../lib/journal'
import { getFollowing } from '../lib/social'
import { useAuth } from '../store/auth'

export default function Feed() {
  const username = useAuth((state) => state.username)

  const { data: items = [], refetch, isLoading } = useQuery({
    queryKey: ['feed', username],
    queryFn: async () => {
      if (!username) return []
      const following = await getFollowing(username)
      const allPosts = await Promise.all(
        following.map(async (author) => {
          const journal = await getJournal(author)
          const profile = await getProfile(author)
          return journal.posts.map((post) => ({
            author: profile,
            post,
            subject: journal.subjects.find((subject) => subject.id === post.subjectId),
          }))
        })
      )
      return allPosts.flat().sort((left, right) => right.post.createdAt.localeCompare(left.post.createdAt))
    },
    enabled: Boolean(username)
  })

  if (!username) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Feed</h1>
        <p className="text-[var(--color-muted)] mt-1">Findings from people you follow.</p>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Loading feed...</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-6 text-[var(--color-muted)]">
          Your feed is quiet. Find people and send a follow request — once they accept, their posts land here.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
          {items.map(({ author, post, subject }) => (
            <div key={`${author.username}-${post.id}`} className="flex flex-col gap-2 min-w-0 h-full">
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
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{author.displayName}</p>
                  <p className="text-xs text-[var(--color-muted)] truncate">@{author.username}</p>
                </div>
              </Link>
              <div className="flex-1">
                <PostCard
                  post={post}
                  subject={subject}
                  editable={false}
                  onDelete={() => undefined}
                  ownerUsername={author.username}
                  viewerUsername={username}
                  onUpdated={() => refetch()}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
