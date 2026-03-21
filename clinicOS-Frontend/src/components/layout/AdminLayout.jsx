import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Stethoscope, LayoutDashboard, Users, UserCheck,
  Settings, LogOut, Menu, Copy, Check, MessageSquare, BarChart2
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin',          label: 'Overview',       icon: LayoutDashboard, end: true },
  { to: '/admin/analytics',label: 'Analytics',      icon: BarChart2 },
  { to: '/admin/requests', label: 'Join Requests',  icon: UserCheck },
  { to: '/admin/team',     label: 'Team',           icon: Users },
  { to: '/admin/messages', label: 'Messages',       icon: MessageSquare },
  { to: '/admin/settings', label: 'Settings',       icon: Settings },
]

function SidebarContent({ user, copied, copyCode, handleLogout, closeSidebar }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-cream-200">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-crimson-800 rounded-full flex items-center justify-center">
            <Stethoscope size={16} className="text-accent-yellow" />
          </div>
          <span className="font-display font-bold text-xl text-text-primary">ClinicOS</span>
        </div>

        {/* Clinic name + code */}
        <div className="bg-cream-100 rounded-2xl p-3">
          <p className="font-body text-xs text-text-muted mb-0.5">Clinic</p>
          <p className="font-body font-bold text-sm text-text-primary truncate">
            {user?.clinicName || 'Your Clinic'}
          </p>
          {user?.clinicCode && (
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 mt-2 font-body text-xs text-crimson-600 hover:text-crimson-800 transition-colors"
            >
              <span className="font-bold tracking-wider">{user.clinicCode}</span>
              {copied ? <Check size={12} className="text-accent-teal" /> : <Copy size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: NavIcon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={closeSidebar}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-2.5 rounded-2xl font-body text-sm font-medium transition-all
              ${isActive
                ? 'bg-crimson-800 text-white shadow-btn'
                : 'text-text-body hover:bg-cream-100 hover:text-text-primary'
              }
            `}
          >
            <NavIcon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-cream-200">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-white text-sm">
              {user?.name?.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-text-primary truncate">{user?.name}</p>
            <p className="font-body text-xs text-text-muted capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl font-body text-sm text-accent-coral hover:bg-accent-coral/5 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout }          = useAuth()
  const navigate                  = useNavigate()
  const [sidebarOpen, setSidebar] = useState(false)
  const [copied, setCopied]       = useState(false)

  const handleLogout = () => { logout(); navigate('/') }

  const copyCode = () => {
    navigator.clipboard.writeText(user?.clinicCode || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-cream-50 flex">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-cream-200 fixed h-full z-30">
        <SidebarContent
          user={user}
          copied={copied}
          copyCode={copyCode}
          handleLogout={handleLogout}
          closeSidebar={() => setSidebar(false)}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebar(false)} />
          <aside className="relative w-72 bg-white h-full z-50 flex flex-col">
            <SidebarContent
              user={user}
              copied={copied}
              copyCode={copyCode}
              handleLogout={handleLogout}
              closeSidebar={() => setSidebar(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

        {/* Mobile topbar */}
        <header className="md:hidden bg-white border-b border-cream-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebar(true)}>
            <Menu size={22} className="text-text-body" />
          </button>
          <span className="font-display font-bold text-lg text-text-primary">ClinicOS</span>
          <div className="w-8 h-8 bg-crimson-500 rounded-full flex items-center justify-center">
            <span className="font-display font-bold text-white text-sm">{user?.name?.charAt(0)}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
