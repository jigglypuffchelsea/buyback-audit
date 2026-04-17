import { Routes, Route } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { QuickRecord } from './pages/QuickRecord'
import { Timeline } from './pages/Timeline'
import { Report } from './pages/Report'

export default function App() {
  return (
    <div className="app">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<QuickRecord />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
