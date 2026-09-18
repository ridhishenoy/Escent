import { useRef, type ChangeEvent } from 'react'
import { Camera } from 'lucide-react'

type AvatarUploaderProps = {
  name: string
  src: string | null
  editable: boolean
  onUpload: (file: File) => Promise<void> | void
}

export default function AvatarUploader({ name, src, editable, onUpload }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    await onUpload(file)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        className="relative h-28 w-28 rounded-full overflow-hidden border-2 border-[var(--color-border)] bg-[var(--color-primary-soft)] disabled:cursor-default"
        onClick={() => editable && inputRef.current?.click()}
        disabled={!editable}
        aria-label={editable ? 'Upload profile picture' : `${name}'s profile picture`}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[var(--color-primary)]">
            <Camera size={32} />
          </span>
        )}
        {editable ? (
          <span className="absolute inset-x-0 bottom-0 bg-[var(--color-primary)]/85 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            {src ? 'Change' : 'Upload'}
          </span>
        ) : null}
      </button>
      {editable ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleChange}
        />
      ) : null}
    </div>
  )
}
