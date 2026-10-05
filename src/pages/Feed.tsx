import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Globe, Lock } from 'lucide-react'
import PostCard from '../components/journal/PostCard'
import { getJournal, listProfiles, type UserProfile } from '../lib/journal'
import { getFollowing } from '../lib/social'
import { useAuth } from '../store/auth'

export default function Feed() {
  const username = useAuth((state) => state.username)
  const [filter, setFilter] = useState<'all' | 'following'>('all')

  const { data: following = [] } = useQuery({
    queryKey: ['following', username],
    queryFn: () => (username ? getFollowing(username) : []),
    enabled: Boolean(username),
  })

  const { data: items = [], refetch, isLoading } = useQuery({
    queryKey: ['feed', username, filter, following],
    queryFn: async () => {
      if (!username) return []
      const allProfiles = await listProfiles()

      // Determine which authors' posts can appear in the feed:
      // 1. All Public accounts: visible to everyone
      // 2. Private accounts: ONLY visible to their followers
      const eligibleAuthors: UserProfile[] = allProfiles.filter((p) => {
        if (p.username === username) return false
        const isFollowed = following.includes(p.username)
        if (filter === 'following') {
          return isFollowed
        }
        // 'all' view: public accounts + followed private accounts
        return !p.isPrivate || isFollowed
      })

      const allPosts = await Promise.all(
        eligibleAuthors.map(async (author) => {
          const journal = await getJournal(author.username)
          return journal.posts.map((post) => ({
            author,
            post,
            subject: journal.subjects.find((subject) => subject.id === post.subjectId),
          }))
        })
      )
      return allPosts.flat().sort((left, right) => right.post.createdAt.localeCompare(left.post.createdAt))
    },
    enabled: Boolean(username),
  })

  if (!username) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Feed</h1>
          <p className="text-sm sm:text-base text-[var(--color-muted)] mt-1">
            Discover findings from public learning journals and learners you follow.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white border border-[var(--color-border)] rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            All Visible
          </button>
          <button
            type="button"
            onClick={() => setFilter('following')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'following'
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}
          >
            Following ({following.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-muted)]">Loading feed...</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-6 sm:p-8 text-center space-y-3">
          <p className="text-base font-semibold text-[var(--color-foreground)]">
            {filter === 'following' ? 'No posts from people you follow yet' : 'Your feed is quiet'}
          </p>
          <p className="text-sm text-[var(--color-muted)] max-w-md mx-auto">
            {filter === 'following'
              ? 'Find public or private learners to follow. Once approved, their posts will appear here.'
              : 'Posts published by public accounts and accounts you follow will appear here.'}
          </p>
          <Link
            to="/people"
            className="inline-block mt-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Explore Learners
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {items.map(({ author, post, subject }) => (
            <div key={`${author.username}-${post.id}`} className="flex flex-col gap-2 min-w-0 h-full">
              <Link to={`/${author.username}`} className="flex items-center gap-3 px-1 hover:opacity-90 transition-opacity">
                {author.avatarDataUrl ? (
                  <img
                    src={author.avatarDataUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover border border-[var(--color-border)]"
                  />
                ) : (
                  <span className="h-9 w-9 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center font-bold text-xs text-[var(--color-primary)]">
                    {author.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold leading-tight truncate">{author.displayName}</p>
                    {author.isPrivate ? (
                      <span title="Private account (followed)">
                        <Lock size={12} className="text-[var(--color-muted)] shrink-0" />
                      </span>
                    ) : (
                      <span title="Public account">
                        <Globe size={12} className="text-[var(--color-muted)]/60 shrink-0" />
                      </span>
                    )}
                  </div>
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
