import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu, X, Stethoscope, LogOut, ChevronDown } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing',      href: '#pricing' },
  { label: 'Contact',      href: '#contact' },
]

const Navbar = () => {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout }              = useAuth()
  const navigate                      = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 pb-2">
      <nav className="nav-gradient rounded-pill shadow-nav max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
            <Stethoscope size={16} className="text-crimson-800" />
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">
            ClinicOS
          </span>
        </Link>

        {/* Desktop nav links — only show when not logged in */}
        {!user && (
          <ul className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <li key={link.label}>
                
                  href={link.href}
                  className="font-body text-sm font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-pill hover:bg-white/10 transition-all duration-200"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            // ── Logged in: show user profile dropdown ──────────────
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-pill hover:bg-white/10 transition-all"
              >
                <div className="w-7 h-7 bg-accent-yellow rounded-full flex items-center justify-center">
                  <span className="font-display font-bold text-crimson-800 text-xs">
                    {user.name.charAt(0)}
                  </span>
                </div>
                <span className="font-body text-sm text-white font-medium">{user.name}</span>
                <span className="font-body text-xs text-white/60 capitalize bg-white/10 px-2 py-0.5 rounded-pill">
                  {user.role}
                </span>
                <ChevronDown size={14} className="text-white/70" />
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-hero border border-cream-300 py-2 z-50">
                  <div className="px-4 py-2 border-b border-cream-200 mb-1">
                    <p className="font-body text-xs font-bold text-text-muted uppercase tracking-wider capitalize">
                      {user.role}
                    </p>
                    <p className="font-body text-sm font-medium text-text-primary">{user.name}</p>
                    {user.clinicName && (
                      <p className="font-body text-xs text-text-muted">{user.clinicName}</p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 font-body text-sm text-accent-coral hover:bg-accent-coral/5 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ── Not logged in: show Sign In + Get Started ───────────
            <>
              <Link
                to="/login"
                className="font-body text-sm font-semibold text-white/80 hover:text-white px-4 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link to="/signup" className="btn-cta text-xs py-2 px-5">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mt-2 nav-gradient rounded-3xl shadow-nav max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">

          {/* Nav links — only when not logged in */}
          {!user && NAV_LINKS.map(link => (
            
              key={link.label}
              href={link.href}
              className="font-body text-sm font-medium text-white/80 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}

          {user ? (
            // ── Logged in mobile ────────────────────────────────────
            <div className="border-t border-white/20 mt-2 pt-3">
              <div className="px-3 py-2 mb-2">
                <p className="font-body text-xs text-white/60 capitalize">{user.role}</p>
                <p className="font-body text-sm font-semibold text-white">{user.name}</p>
                {user.clinicName && (
                  <p className="font-body text-xs text-white/60">{user.clinicName}</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 font-body text-sm text-white/80 hover:text-white w-full"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            // ── Not logged in mobile ────────────────────────────────
            <div className="border-t border-white/20 mt-2 pt-2 flex gap-3">
              <Link
                to="/login"
                className="flex-1 text-center font-body text-sm font-semibold text-white/80 py-2"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="flex-1 btn-cta justify-center text-xs py-2"
                onClick={() => setMobileOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar