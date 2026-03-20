import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { adminAPI } from '../../services/api'
import { Users, Stethoscope, UserCheck, Clock } from 'lucide-react'

export default function AdminOverview() {
  const { user }        = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getStats()
      .then(res => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const CARDS = [
    { label: 'Doctors',          value: stats?.doctors,         icon: Stethoscope, color: 'text-crimson-500',  bg: 'bg-crimson-100'    },
    { label: 'Staff',            value: stats?.staff,           icon: Users,       color: 'text-accent-teal',  bg: 'bg-accent-teal/10' },
    { label: 'Total Patients',   value: stats?.patients,        icon: UserCheck,   color: 'text-accent-sky',   bg: 'bg-accent-sky/10'  },
    { label: 'Pending Requests', value: stats?.pendingRequests, icon: Clock,       color: 'text-accent-yellow',bg: 'bg-accent-yellow/10'},
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-text-primary">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="font-body text-text-muted mt-1">
          Here's what's happening at {user?.clinicName}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            {loading ? (
              <div className="h-8 w-12 bg-cream-200 rounded-xl animate-pulse mb-1" />
            ) : (
              <p className={`font-display font-bold text-3xl mb-1 ${color}`}>{value ?? 0}</p>
            )}
            <p className="font-body text-sm text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Clinic code highlight */}
      {user?.clinicCode && (
        <div className="card border-2 border-crimson-200 bg-crimson-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-crimson-500 mb-1">
                Your Clinic Join Code
              </p>
              <p className="font-display font-bold text-3xl text-crimson-800 tracking-widest">
                {user.clinicCode}
              </p>
              <p className="font-body text-sm text-text-muted mt-1">
                Share this code with your doctors and staff so they can join your clinic
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(user.clinicCode)
              }}
              className="btn-primary py-2.5 px-6 text-sm flex-shrink-0"
            >
              Copy Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}