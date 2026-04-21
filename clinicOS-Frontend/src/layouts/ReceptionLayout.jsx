import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Stethoscope, LogOut } from 'lucide-react'

export default function ReceptionLayout({ children, stats, connected }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">

      {/* Topbar */}
      <header className="nav-gradient px-6 py-3 flex items-center justify-between shadow-nav sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
            <Stethoscope size={16} className="text-crimson-800" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-lg">ClinicOS</span>
            <span className="font-body text-white/60 text-xs ml-2">Reception</span>
          </div>
        </div>

        {/* Stats strip */}
        {stats && (
          <div className="hidden md:flex items-center gap-6">
            <Stat label="In Queue"    value={stats.inQueue}    />
            <Stat label="Served Today" value={stats.servedToday} />
            <Stat label="Avg Wait"    value={`${stats.avgWait || 0}m`} />
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-pill">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-accent-teal animate-pulse' : 'bg-accent-coral'}`} />
            <span className="font-body text-white/80 text-xs font-medium">
              {connected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-accent-teal rounded-full animate-pulse" />
            <span className="hidden md:block font-body text-sm text-white">{user?.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-body text-xs text-white/70 hover:text-white px-3 py-1.5 hover:bg-white/10 rounded-pill transition-all"
          >
            <LogOut size={14} />
            <span className="hidden md:block">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="font-display font-bold text-white text-xl leading-none">{value ?? '—'}</p>
      <p className="font-body text-white/60 text-xs mt-0.5">{label}</p>
    </div>
  )
}
