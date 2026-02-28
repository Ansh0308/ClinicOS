import React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Stethoscope } from 'lucide-react'

const Navbar = () => {
    const NavLinks=[{ label: 'Features',   href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing',    href: '#pricing' },
  { label: 'Contact',    href: '#contact' },]
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    
    <header className="sticky top-0 z-50 px-4 pt-4 pb-2">
         <nav className="nav-gradient rounded-pill shadow-nav max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
            <Stethoscope size={16} className="text-crimson-800" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">
            ClinicOS
          </span>
          </Link>
          <ul className="hidden md:flex items-center gap-1">
             {NavLinks.map(link => (
            <li key={link.label}>
              
                <a href={link.href}
                className="font-body text-sm font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-pill hover:bg-white/10 transition-all duration-200"
              >
                {link.label}
              </a>
            </li>
          ))}
          </ul>
           <div className="hidden md:flex items-center gap-2">
            <button className="font-body text-sm font-semibold text-white/80 hover:text-white px-4 py-2 transition-colors">
            Sign In
          </button>
          <button className="btn-cta text-xs py-2 px-5">
            Register
          </button>
           </div>
           <button
          className="md:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
         </nav>
        {mobileOpen && (
        <div className="md:hidden mt-2 nav-gradient rounded-3xl shadow-nav max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
          {NavLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              className="font-body text-sm font-medium text-white/80 hover:text-white px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-white/20 mt-2 pt-2 flex gap-3">
            <button className="flex-1 text-center font-body text-sm font-semibold text-white/80 py-2">Sign In</button>
            <button className="flex-1 btn-cta justify-center text-xs py-2">Get Started</button>
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
