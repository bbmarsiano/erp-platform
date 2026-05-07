import { Route, Routes } from 'react-router-dom'
import BackupDashboard from './pages/BackupDashboard'
import Jobs from './pages/Jobs'
import Policies from './pages/Policies'
import Restore from './pages/Restore'

export default function BackupRouter() {
  return (
    <Routes>
      <Route index element={<BackupDashboard />} />
      <Route path="policies" element={<Policies />} />
      <Route path="jobs" element={<Jobs />} />
      <Route path="restore" element={<Restore />} />
    </Routes>
  )
}

