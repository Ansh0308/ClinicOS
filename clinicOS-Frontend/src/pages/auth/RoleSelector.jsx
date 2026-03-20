import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Stethoscope, UserRound, Building2, Clipboard } from 'lucide-react'

const ROLES = [
  {
    id:          'patient',
    icon:        UserRound,
    label:       'Patient',
    description: 'Book appointments, track your queue position, view prescriptions and bills',
    color:       'text-accent-teal',
    bg:          'bg-accent-teal/10',
    border:      'hover:border-accent-teal/50',
  },
  {
    id:          'admin',
    icon:        Building2,
    label:       'Clinic Admin',
    description: 'Register your clinic, manage doctors and staff, view analytics',
    color:       'text-crimson-500',
    bg:          'bg-crimson-100',
    border:      'hover:border-crimson-300',
  },
  {
    id:          'doctor',
    icon:        Stethoscope,
    label:       'Doctor',
    description: 'View your patient queue, record consultations, access full history',
    color:       'text-accent-lavender',
    bg:          'bg-accent-lavender/10',
    border:      'hover:border-accent-lavender/50',
  },
  {
    id:          'staff',
    icon:        Clipboard,
    label:       'Reception Staff',
    description: 'Register patients, issue tokens, manage the queue, create bills',
    color:       'text-accent-sky',
    bg:          'bg-accent-sky/10',
    border:      'hover:border-accent-sky/50',
  },
]

export default function RoleSelector() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  // Already logged in → go to their dashboard
  useEffect(() => {
    if (user) {
      const routes = { patient:'/patient', admin:'/admin', doctor:'/doctor', staff:'/reception' }
      navigate(routes[user.role] || '/', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen hero-glow flex flex-col items-center justify-center p-4 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <p className="font-body text-xs font-bold uppercase tracking-widest text-crimson-500 mb-3">
          Welcome to ClinicOS
        </p>
        <h1 className="font-display font-bold text-4xl md:text-5xl text-text-primary mb-3">
          Who are you?
        </h1>
        <p className="font-body text-text-muted text-base">
          Choose your role to create the right account
        </p>
      </div>

      {/* Role cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
        {ROLES.map(({ id, icon: Icon, label, description, color, bg, border }) => (
          <button
            key={id}
            onClick={() => navigate(`/signup/${id}`)}
            className={`card text-left hover:-translate-y-1 transition-all duration-200 border-2 border-transparent ${border} group`}
          >
            <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4`}>
              <Icon size={22} className={color} />
            </div>
            <h3 className="font-display font-bold text-xl text-text-primary mb-1">{label}</h3>
            <p className="font-body text-sm text-text-muted leading-relaxed">{description}</p>
          </button>
        ))}
      </div>

      {/* Already have account */}
      <p className="font-body text-sm text-text-muted mt-8">
        Already have an account?{' '}
        <button onClick={() => navigate('/login')} className="text-crimson-500 font-semibold hover:text-crimson-700">
          Sign in
        </button>
      </p>
    </div>
  )
}