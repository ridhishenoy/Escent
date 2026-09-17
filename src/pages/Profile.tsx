import { useParams } from 'react-router-dom'

export default function Profile() {
  const { username } = useParams()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">@{username}'s Learning Space</h1>
      <p>This profile view will be driven by the user's custom theme settings.</p>
    </div>
  )
}
