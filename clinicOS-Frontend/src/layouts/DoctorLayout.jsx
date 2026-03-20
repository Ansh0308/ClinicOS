import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Stethoscope, List, Users, LogOut } from 'lucide-react'

const NAV = [
  { to: '/doctor',          label: 'My Queue',  icon: List,  end: true },
  { to: '/doctor/patients', label: 'Patients',  icon: Users },
]

export default function DoctorLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">

      {/* Topbar */}
      <header className="nav-gradient px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
            <Stethoscope size={16} className="text-crimson-800" />
          </div>
          <div>
            <span className="font-display font-bold text-white text-lg">ClinicOS</span>
            <span className="font-body text-white/60 text-xs ml-2">Doctor</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-pill font-body text-sm font-medium transition-all
                ${isActive ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}
              `}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-accent-yellow rounded-full flex items-center justify-center">
              <span className="font-display font-bold text-crimson-800 text-xs">
                {user?.name?.charAt(0)}
              </span>
            </div>
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

      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
