import { useQuery } from '@tanstack/react-query'
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
    default:
      return ''
  }
}

export default function FollowButton({ viewer, target, onChange }: FollowButtonProps) {
  const { data: relation, refetch, isLoading } = useQuery({
    queryKey: ['relation', viewer, target],
    queryFn: () => getFollowRelation(viewer, target),
    enabled: Boolean(viewer && target),
  })

  if (!relation || relation === 'self') {
    return null
  }

  async function handlePrimary() {
    switch (relation) {
      case 'none':
      case 'pending_in':
        await sendFollowRequest(viewer, target, false)
        break
      case 'pending_out':
        await cancelFollowRequest(viewer, target)
        break
      case 'following':
        await unfollow(viewer, target)
        break
      case 'self':
        break
      default:
        break
    }
    await refetch()
    onChange?.()
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handlePrimary}
      className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
        relation === 'none' || relation === 'pending_in'
          ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
          : 'border border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]'
      }`}
    >
      {isLoading ? '...' : actionLabel(relation)}
    </button>
  )
}
