import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import type { JournalPost, Subject } from '../../lib/journal'
import { fontFamily, fontSize, fontWeight, textAlign } from '../../lib/postStyle'

type PostCardProps = {
  post: JournalPost
  subject?: Subject
  editable: boolean
  onDelete: (id: string) => void
}

export default function PostCard({ post, subject, editable, onDelete }: PostCardProps) {
  return (
    <article
      className="rounded-2xl border overflow-hidden shadow-sm"
      style={{
        backgroundColor: post.backgroundColor,
        color: post.textColor,
        borderColor: post.accentColor,
        fontFamily: fontFamily(post.font),
        fontSize: fontSize(post.size),
        fontWeight: fontWeight(post.weight),
        fontStyle: post.italic ? 'italic' : 'normal',
        textAlign: textAlign(post.align),
      }}
    >
      {post.imageDataUrl ? (
        <img src={post.imageDataUrl} alt="" className="w-full max-h-80 object-cover" />
      ) : null}
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            {subject ? (
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: post.accentColor }}>
                {subject.name}
              </p>
            ) : null}
            {post.title ? <h3 className="text-xl font-bold leading-tight">{post.title}</h3> : null}
          </div>
          {editable ? (
            <button
              type="button"
              onClick={() => onDelete(post.id)}
              className="rounded-md p-1.5 hover:bg-black/5"
              aria-label="Delete post"
              style={{ color: post.accentColor }}
            >
              <Trash2 size={16} />
            </button>
          ) : null}
        </div>
        {post.body ? <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p> : null}
        <p className="text-xs opacity-70">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>
      </div>
    </article>
  )
}
