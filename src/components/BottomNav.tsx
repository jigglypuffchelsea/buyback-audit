import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/', label: '記錄', icon: '✏️' },
  { path: '/timeline', label: '時間軸', icon: '📋' },
  { path: '/report', label: '報告', icon: '📊' },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.path}
          className={`nav-tab ${location.pathname === tab.path ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
