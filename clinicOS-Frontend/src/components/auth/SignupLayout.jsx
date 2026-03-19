import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Stethoscope } from 'lucide-react'

export default function SignupLayout({ children, showBack = true }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen hero-glow flex flex-col items-center justify-center p-4 py-12">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-crimson-800 rounded-full flex items-center justify-center">
          <Stethoscope size={20} className="text-accent-yellow" />
        </div>
        <span className="font-display font-bold text-3xl text-text-primary">ClinicOS</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md">

        {/* Back button */}
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text-muted hover:text-text-body font-body text-sm mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        <div className="card p-8">
          {children}
        </div>
      </div>
    </div>
  )
}