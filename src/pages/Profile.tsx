import { useMemo, useState } from 'react'
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
  type Journal,
  type JournalPost,
  type UserProfile,
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
  const [profile, setProfile] = useState<UserProfile>(() => getProfile(username))
  const [journal, setJournal] = useState<Journal>(() => getJournal(username))
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [photoError, setPhotoError] = useState('')
  const [revision, setRevision] = useState(0)

  const relation = useMemo(
    () => (currentUsername ? getFollowRelation(currentUsername, username) : 'none'),
    [currentUsername, username, revision],
  )
  const canSeePosts = isOwner || relation === 'following'

  const visiblePosts = useMemo(() => {
    if (!selectedSubjectId) {
      return journal.posts
    }
    return journal.posts.filter((post) => post.subjectId === selectedSubjectId)
  }, [journal.posts, selectedSubjectId])

  async function handleAvatar(file: File) {
    setPhotoError('')
    try {
      const avatarDataUrl = await fileToCompressedDataUrl(file, 480)
      const next = saveProfile({ ...profile, avatarDataUrl })
      setProfile(next)
      if (isOwner) {
        onSessionProfile({ avatarUrl: avatarDataUrl })
      }
    } catch (caught) {
      setPhotoError(caught instanceof Error ? caught.message : 'Could not upload that photo.')
    }
  }

  function handleDisplayNameBlur() {
    const nextName = displayName.trim() || username
    setDisplayName(nextName)
    const next = saveProfile({ ...profile, displayName: nextName })
    setProfile(next)
    onSessionProfile({ displayName: nextName })
  }

  function handleAddSubject(name: string, color: string) {
    const next = addSubject(username, name, color)
    setJournal(next)
    if (!selectedSubjectId && next.subjects[0]) {
      setSelectedSubjectId(next.subjects[0].id)
    }
  }

  function handleRemoveSubject(id: string) {
    const next = removeSubject(username, id)
    setJournal(next)
    if (selectedSubjectId === id) {
      setSelectedSubjectId(null)
    }
  }

  function handlePublish(post: Omit<JournalPost, 'id' | 'createdAt' | 'comments'>) {
    const next = addPost(username, post)
    setJournal(next)
  }

  function handleDeletePost(id: string) {
    setJournal(removePost(username, id))
  }

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <AvatarUploader
            name={profile.displayName}
            src={profile.avatarDataUrl}
            editable={isOwner}
            onUpload={handleAvatar}
          />
          <div className="flex-1 text-center sm:text-left w-full">
            {isOwner ? (
              <>
                <p className="text-sm font-medium text-[var(--color-primary)] mb-2">Profile setup</p>
                <label className="block text-sm font-medium mb-3">
                  Display name
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    onBlur={handleDisplayNameBlur}
                    className="mt-1 w-full max-w-md rounded-md border border-[var(--color-border)] px-3 py-2 outline-none focus:border-[var(--color-primary)]"
                  />
                </label>
                <h1 className="text-3xl font-extrabold tracking-tight">Your learning space</h1>
                <p className="mt-2 text-[var(--color-muted)]">
                  Upload a picture, add a subject, and post what you’re learning — styled however you want.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight">{profile.displayName}</h1>
                <p className="text-[var(--color-muted)] mb-4">@{username}</p>
                {currentUsername ? (
                  <FollowButton
                    viewer={currentUsername}
                    target={username}
                    onChange={() => setRevision((value) => value + 1)}
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
          <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-6 text-[var(--color-muted)]">
            Follow {profile.displayName} and wait for them to accept. Then their posts show here and on your feed.
          </p>
        ) : visiblePosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-white p-6 text-[var(--color-muted)]">
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
                onUpdated={setJournal}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
