import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Profile from '@/pages/Profile'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="auth" element={<Auth />} />
        <Route path=":username" element={<Profile />} />
      </Route>
    </Routes>
  )
}

export default App
