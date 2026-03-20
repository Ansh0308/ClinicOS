import { Stethoscope } from 'lucide-react'

const FOOTER_LINKS = {
  Product:  ['Features', 'Pricing', 'Changelog', 'Roadmap'],
  Company:  ['About', 'Blog', 'Careers', 'Press'],
  Support:  ['Documentation', 'Help Center', 'Contact', 'Status'],
  Legal:    ['Privacy Policy', 'Terms of Service', 'DPDP Compliance'],
}

export default function Footer() {
  return (
    <footer className="bg-crimson-900 text-white pt-16 pb-8">
      <div className="section-container">

        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent-yellow rounded-full flex items-center justify-center">
                <Stethoscope size={16} className="text-crimson-800" />
              </div>
              <span className="font-display font-bold text-xl">ClinicOS</span>
            </div>
            <p className="font-body text-sm text-white/60 leading-relaxed">
              Intelligent clinic management for modern India.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-body font-bold text-xs uppercase tracking-widest text-white/40 mb-4">
                {group}
              </h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="font-body text-sm text-white/60 hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-body text-xs text-white/40">
            © {new Date().getFullYear()} ClinicOS. All rights reserved.
          </p>
          <p className="font-body text-xs text-white/40">
            Made for Indian clinics · DPDP Compliant
          </p>
        </div>

      </div>
    </footer>
  )
}