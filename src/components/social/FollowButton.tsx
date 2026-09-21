import { cancelFollowRequest, getFollowRelation, sendFollowRequest, unfollow, type FollowRelation } from '../../lib/social'

type FollowButtonProps = {
  viewer: string
  target: string
  onChange?: () => void
}

function actionLabel(relation: FollowRelation): string {
  switch (relation) {
    case 'self':
      return ''
    case 'none':
    case 'pending_in':
      return 'Follow'
    case 'pending_out':
      return 'Requested'
    case 'following':
      return 'Following'
    default: {
      const unexpected: never = relation
      return unexpected
    }
  }
}

export default function FollowButton({ viewer, target, onChange }: FollowButtonProps) {
  const relation = getFollowRelation(viewer, target)

  if (relation === 'self') {
    return null
  }

  function handlePrimary() {
    switch (relation) {
      case 'none':
      case 'pending_in':
        sendFollowRequest(viewer, target, false)
        break
      case 'pending_out':
        cancelFollowRequest(viewer, target)
        break
      case 'following':
        unfollow(viewer, target)
        break
      case 'self':
        break
      default: {
        const unexpected: never = relation
        return unexpected
      }
    }
    onChange?.()
  }

  return (
    <button
      type="button"
      onClick={handlePrimary}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
        relation === 'none' || relation === 'pending_in'
          ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
          : 'border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]'
      }`}
    >
      {actionLabel(relation)}
    </button>
  )
}
