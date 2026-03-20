import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { patientPortalAPI } from '../../services/api'
import {
  Activity, FileText, Receipt,
  Clock, ChevronRight, Stethoscope
} from 'lucide-react'

export default function PatientDashboard() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientPortalAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/2" />
        <div className="card h-40" />
        <div className="card h-32" />
      </div>
    )
  }

  const { activeToken, recentVisits, recentBills } = data || {}

  return (
    <div className="space-y-5">

      {/* Greeting */}
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">
          Hi, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="font-body text-sm text-text-muted">
          Welcome to your health dashboard
        </p>
      </div>

      {/* Active Token Card */}
      {activeToken ? (
        <div
          className="nav-gradient rounded-3xl p-5 cursor-pointer"
          onClick={() => navigate('/patient/queue')}
        >
          <p className="font-body text-xs text-white/60 uppercase tracking-wider mb-1">
            Active Queue Token
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-bold text-5xl text-white">
                T-{activeToken.tokenNumber}
              </p>
              <p className="font-body text-sm text-white/80 mt-1">
                {activeToken.clinic?.name}
              </p>
              {activeToken.doctor && (
                <p className="font-body text-xs text-white/60">
                  Dr. {activeToken.doctor.name}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className={`inline-block px-3 py-1.5 rounded-pill font-body text-xs font-bold mb-2
                ${activeToken.status === 'now'
                  ? 'bg-accent-yellow text-crimson-900 animate-pulse'
                  : 'bg-white/20 text-white'
                }`}>
                {activeToken.status === 'now'
                  ? '🎉 Your Turn!'
                  : activeToken.status === 'paused'
                  ? 'On Hold'
                  : activeToken.status === 'lab'
                  ? 'In Lab'
                  : `#${activeToken.queuePosition} in queue`
                }
              </div>
              {activeToken.estimatedWait > 0 && activeToken.status === 'waiting' && (
                <p className="font-body text-xs text-white/70 flex items-center gap-1 justify-end">
                  <Clock size={11} />
                  ~{activeToken.estimatedWait} min wait
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 mt-3 text-white/60 font-body text-xs">
            <span>Tap to track live queue</span>
            <ChevronRight size={12} />
          </div>
        </div>
      ) : (
        <div className="card border-2 border-dashed border-cream-300 text-center py-8">
          <Activity size={28} className="text-cream-400 mx-auto mb-2" />
          <p className="font-body font-semibold text-sm text-text-body mb-0.5">
            No active queue token
          </p>
          <p className="font-body text-xs text-text-muted">
            Visit a clinic to get a token
          </p>
        </div>
      )}

      {/* Recent Visits */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-sm font-bold text-text-secondary">
            Recent Visits
          </p>
          <button
            onClick={() => navigate('/patient/history')}
            className="font-body text-xs text-crimson-500 font-semibold hover:text-crimson-700"
          >
            View all
          </button>
        </div>

        {recentVisits?.length === 0 ? (
          <div className="card text-center py-6">
            <Stethoscope size={24} className="text-cream-400 mx-auto mb-2" />
            <p className="font-body text-sm text-text-muted">No visits yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentVisits?.map(visit => (
              <div
                key={visit.id}
                onClick={() => navigate('/patient/history')}
                className="card flex items-center gap-3 cursor-pointer hover:shadow-hero transition-shadow py-3"
              >
                <div className="w-10 h-10 bg-crimson-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={16} className="text-crimson-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-text-primary truncate">
                    {visit.complaint || 'Consultation'}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {visit.doctor?.name} · {new Date(visit.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                </div>
                <ChevronRight size={14} className="text-text-muted flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Bills */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-sm font-bold text-text-secondary">
            Recent Bills
          </p>
          <button
            onClick={() => navigate('/patient/bills')}
            className="font-body text-xs text-crimson-500 font-semibold hover:text-crimson-700"
          >
            View all
          </button>
        </div>

        {recentBills?.length === 0 ? (
          <div className="card text-center py-6">
            <Receipt size={24} className="text-cream-400 mx-auto mb-2" />
            <p className="font-body text-sm text-text-muted">No bills yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentBills?.map(bill => (
              <div
                key={bill.id}
                onClick={() => navigate('/patient/bills')}
                className="card flex items-center gap-3 cursor-pointer hover:shadow-hero transition-shadow py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-sm text-text-primary">
                    {bill.clinic?.name}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {new Date(bill.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-body font-bold text-sm text-text-primary">
                    ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-pill
                    ${bill.status === 'paid'
                      ? 'bg-accent-teal/10 text-accent-teal'
                      : 'bg-accent-yellow/10 text-amber-600'
                    }`}>
                    {bill.status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
