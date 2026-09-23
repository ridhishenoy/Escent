import { useQuery } from '@tanstack/react-query'
import { useState, useMemo, useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
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

  useEffect(() => {
    if (profile?.displayName) {
      setDisplayName(profile.displayName)
    }
  }, [profile?.displayName])

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

  const canSeePosts = isOwner || relation === 'following'

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

  async function handleDisplayNameBlur() {
    if (!profile) return
    const nextName = displayName.trim() || username
    setDisplayName(nextName)
    await saveProfile({ ...profile, displayName: nextName })
    refetchProfile()
    onSessionProfile({ displayName: nextName })
  }

  async function handleAddSubject(name: string, color: string) {
    await addSubject(username, name, color)
    await refetchJournal()
    if (!selectedSubjectId) {
      // Small delay or refetch then select the new subject might be needed
    }
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
                <div className="flex-1">
                  {isEditingProfile ? (
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      onBlur={handleDisplayNameBlur}
                      placeholder="Display name"
                      className="w-full max-w-md text-2xl sm:text-3xl font-extrabold tracking-tight bg-transparent border-b-2 border-dashed border-[var(--color-border)] focus:border-solid focus:border-[var(--color-primary)] outline-none py-1 mb-2"
                      autoFocus
                    />
                  ) : (
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                      {profile.displayName}
                    </h1>
                  )}
                  <p className="text-[var(--color-muted)] mb-6">@{username}</p>
                  
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Your learning space</h2>
                  <p className="mt-2 text-sm sm:text-base text-[var(--color-muted)]">
                    Upload a picture, add a subject, and post what you’re learning — styled however you want.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="self-center sm:self-start px-4 py-2 text-sm font-semibold rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] hover:opacity-80 transition-opacity"
                >
                  {isEditingProfile ? 'Save Profile' : 'Edit Profile'}
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{profile.displayName}</h1>
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

      <SubjectManager
        subjects={journal.subjects}
        selectedId={selectedSubjectId}
        editable={isOwner}
        onSelect={setSelectedSubjectId}
        onAdd={handleAddSubject}
        onRemove={handleRemoveSubject}
      />

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
          <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-4 sm:p-6 text-sm sm:text-base text-[var(--color-muted)]">
            Follow {profile.displayName} and wait for them to accept. Then their posts show here and on your feed.
          </p>
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
