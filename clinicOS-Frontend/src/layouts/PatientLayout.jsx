import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Stethoscope, Home, Activity,
  FileText, Receipt, LogOut
} from 'lucide-react'

const NAV = [
  { to: '/patient',         label: 'Home',    icon: Home,     end: true },
  { to: '/patient/queue',   label: 'Queue',   icon: Activity },
  { to: '/patient/history', label: 'History', icon: FileText },
  { to: '/patient/bills',   label: 'Bills',   icon: Receipt },
]

export default function PatientLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col max-w-lg mx-auto">

      {/* Topbar */}
      <header className="nav-gradient px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
            <Stethoscope size={16} className="text-crimson-800" />
          </div>
          <span className="font-display font-bold text-white text-lg">ClinicOS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-body text-sm text-white/80">{user?.name?.split(' ')[0]}</span>
          <button
            onClick={handleLogout}
            className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <LogOut size={14} className="text-white" />
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-5 pb-24">
        <Outlet />
      </main>

      {/* Bottom nav bar — mobile style */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-cream-200 flex z-30">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center gap-1 py-3 font-body text-xs font-semibold transition-all
              ${isActive ? 'text-crimson-500' : 'text-text-muted hover:text-text-body'}
            `}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} className={isActive ? 'text-crimson-500' : 'text-text-muted'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
