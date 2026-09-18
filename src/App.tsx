import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Feed from '@/pages/Feed'
import People from '@/pages/People'
import Profile from '@/pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="auth" element={<Auth />} />
        <Route path="feed" element={<Feed />} />
        <Route path="people" element={<People />} />
        <Route path=":username" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
