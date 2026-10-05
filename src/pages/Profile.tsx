import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Globe, Lock, Check } from 'lucide-react'
import AvatarUploader from '../components/journal/AvatarUploader'
import PostCard from '../components/journal/PostCard'
import PostComposer from '../components/journal/PostComposer'
import SubjectManager from '../components/journal/SubjectManager'
import FollowButton from '../components/social/FollowButton'
import {
  addPost,
  addSubject,
  fileToCompressedDataUrl,
  getJournal,
  getProfile,
  removePost,
  removeSubject,
  saveProfile,
  type JournalPost,
} from '../lib/journal'
import { getFollowRelation } from '../lib/social'
import { useAuth } from '../store/auth'

export default function Profile() {
  const { username } = useParams()
  const currentUsername = useAuth((state) => state.username)
  const updateSessionProfile = useAuth((state) => state.updateProfile)

  if (!username) {
    return <Navigate to="/" replace />
  }

  return (
    <ProfileSpace
      key={username}
      username={username}
      isOwner={currentUsername === username}
      onSessionProfile={updateSessionProfile}
    />
  )
}

type ProfileSpaceProps = {
  username: string
  isOwner: boolean
  onSessionProfile: (patch: { avatarUrl?: string | null; displayName?: string }) => void
}

function ProfileSpace({ username, isOwner, onSessionProfile }: ProfileSpaceProps) {
  const currentUsername = useAuth((state) => state.username)
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')

  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const { data: profile, refetch: refetchProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getProfile(username),
    enabled: Boolean(username),
  })

  const [displayName, setDisplayName] = useState(profile?.displayName || username)
  const [isPrivate, setIsPrivate] = useState<boolean>(Boolean(profile?.isPrivate))

  useEffect(() => {
    if (profile) {
      if (profile.displayName) setDisplayName(profile.displayName)
      setIsPrivate(Boolean(profile.isPrivate))
    }
  }, [profile])

  const { data: journal, refetch: refetchJournal, isLoading: isJournalLoading } = useQuery({
    queryKey: ['journal', username],
    queryFn: () => getJournal(username),
    enabled: Boolean(username),
  })

  const { data: relation = 'none', refetch: refetchRelation } = useQuery({
    queryKey: ['relation', currentUsername, username],
    queryFn: () => getFollowRelation(currentUsername!, username),
    enabled: Boolean(currentUsername && username),
  })

  // Public accounts allow anyone to see posts. Private accounts require being an accepted follower or owner.
  const canSeePosts = isOwner || !profile?.isPrivate || relation === 'following'

  const visiblePosts = useMemo(() => {
    if (!journal) return []
    if (!selectedSubjectId) return journal.posts
    return journal.posts.filter((post) => post.subjectId === selectedSubjectId)
  }, [journal, selectedSubjectId])

  async function handleAvatar(file: File) {
    if (!profile) return
    setPhotoError('')
    try {
      const avatarDataUrl = await fileToCompressedDataUrl(file, 480)
      await saveProfile({ ...profile, avatarDataUrl })
      refetchProfile()
      if (isOwner) {
        onSessionProfile({ avatarUrl: avatarDataUrl })
      }
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : 'Could not upload that photo.')
    }
  }

  async function handleSaveProfile() {
    if (!profile) return
    const nextName = displayName.trim() || username
    setDisplayName(nextName)
    await saveProfile({
      ...profile,
      displayName: nextName,
      isPrivate,
    })
    await refetchProfile()
    onSessionProfile({ displayName: nextName })
    setIsEditingProfile(false)
  }

  async function handleAddSubject(name: string, color: string) {
    await addSubject(username, name, color)
    await refetchJournal()
  }

  async function handleRemoveSubject(id: string) {
    await removeSubject(username, id)
    await refetchJournal()
    if (selectedSubjectId === id) {
      setSelectedSubjectId(null)
    }
  }

  async function handlePublish(post: Omit<JournalPost, 'id' | 'createdAt' | 'comments'>) {
    await addPost(username, post)
    await refetchJournal()
  }

  async function handleDeletePost(id: string) {
    await removePost(username, id)
    await refetchJournal()
  }

  if (isProfileLoading || isJournalLoading || !profile || !journal) {
    return <div className="p-8 text-[var(--color-muted)]">Loading profile...</div>
  }

  return (
    <div className="space-y-6 sm:space-y-10">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <AvatarUploader
            name={profile.displayName}
            src={profile.avatarDataUrl}
            editable={isOwner && isEditingProfile}
            onUpload={handleAvatar}
          />
          <div className="flex-1 text-center sm:text-left w-full">
            {isOwner ? (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 w-full">
                  {isEditingProfile ? (
                    <div className="space-y-4 max-w-lg mx-auto sm:mx-0">
                      <div>
                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">
                          Display Name
                        </label>
                        <input
                          value={displayName}
                          onChange={(event) => setDisplayName(event.target.value)}
                          placeholder="Your display name"
                          className="w-full text-lg sm:text-xl font-bold bg-white border border-[var(--color-border)] rounded-xl px-3 py-2 outline-none focus:border-[var(--color-primary)]"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                          Account Privacy
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setIsPrivate(false)}
                            className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              !isPrivate
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/15 shadow-xs'
                                : 'border-[var(--color-border)] hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="flex items-center gap-1.5 font-bold text-sm text-[var(--color-foreground)]">
                                <Globe size={16} className="text-[var(--color-primary)]" /> Public
                              </span>
                              {!isPrivate ? <Check size={16} className="text-[var(--color-primary)]" /> : null}
                            </div>
                            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                              Posts appear in everyone's Feed and profile is open to all learners.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsPrivate(true)}
                            className={`flex flex-col items-start p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              isPrivate
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/15 shadow-xs'
                                : 'border-[var(--color-border)] hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="flex items-center gap-1.5 font-bold text-sm text-[var(--color-foreground)]">
                                <Lock size={16} className="text-[var(--color-primary)]" /> Private
                              </span>
                              {isPrivate ? <Check size={16} className="text-[var(--color-primary)]" /> : null}
                            </div>
                            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                              Only approved followers can see your posts in their Feed and profile.
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">
                        {profile.displayName}
                      </h1>
                      <p className="text-[var(--color-muted)] mb-4">@{username}</p>
                      <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Your learning space</h2>
                      <p className="mt-1 text-sm sm:text-base text-[var(--color-muted)]">
                        {profile.isPrivate
                          ? 'Your account is private. Only approved followers can view your findings.'
                          : 'Your account is public. Anyone can discover your posts in their feed.'}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 self-center sm:self-start">
                  {isEditingProfile ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="px-4 py-2 text-sm font-semibold rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                      >
                        Save Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false)
                          if (profile) {
                            setDisplayName(profile.displayName)
                            setIsPrivate(Boolean(profile.isPrivate))
                          }
                        }}
                        className="px-3 py-2 text-sm font-semibold rounded-full border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 text-sm font-semibold rounded-full bg-[var(--color-primary-soft)]/40 text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/60 transition-colors cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1">{profile.displayName}</h1>
                <p className="text-[var(--color-muted)] mb-4">@{username}</p>
                {currentUsername ? (
                  <FollowButton
                    viewer={currentUsername}
                    target={username}
                    onChange={() => refetchRelation()}
                  />
                ) : null}
              </>
            )}
            {photoError ? (
              <p className="mt-3 text-sm text-rose-700" role="alert">
                {photoError}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Only owner can manage subjects or compose posts */}
      {canSeePosts && (
        <SubjectManager
          subjects={journal.subjects}
          selectedId={selectedSubjectId}
          editable={isOwner}
          onSelect={setSelectedSubjectId}
          onAdd={handleAddSubject}
          onRemove={handleRemoveSubject}
        />
      )}

      {isOwner ? (
        <PostComposer
          subjects={journal.subjects}
          defaultSubjectId={selectedSubjectId}
          onPublish={handlePublish}
        />
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Journal</h2>
        {!canSeePosts ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-white p-8 sm:p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
              <Lock size={22} />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-foreground)]">This Account is Private</h3>
            <p className="text-sm text-[var(--color-muted)] max-w-sm mx-auto">
              Follow @{username} and wait for them to accept your follow request to view their journal posts, questions, and learning findings.
            </p>
          </div>
        ) : visiblePosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-4 sm:p-6 text-sm sm:text-base text-[var(--color-muted)]">
            {isOwner ? 'Your findings will show up here once you publish.' : 'No posts yet.'}
          </p>
        ) : (
          <div className="space-y-4">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                subject={journal.subjects.find((subject) => subject.id === post.subjectId)}
                editable={isOwner}
                onDelete={handleDeletePost}
                ownerUsername={username}
                viewerUsername={currentUsername}
                onUpdated={() => refetchJournal()}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
