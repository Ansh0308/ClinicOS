import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import { CheckCircle, XCircle, Clock, Stethoscope, Users } from 'lucide-react'

const ROLE_CONFIG = {
  doctor: { label: 'Doctor', icon: Stethoscope, color: 'text-crimson-500', bg: 'bg-crimson-100' },
  staff:  { label: 'Staff',  icon: Users,        color: 'text-accent-sky',  bg: 'bg-accent-sky/10' },
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'text-accent-yellow', bg: 'bg-accent-yellow/10' },
  approved: { label: 'Approved', color: 'text-accent-teal',   bg: 'bg-accent-teal/10'   },
  rejected: { label: 'Rejected', color: 'text-accent-coral',  bg: 'bg-accent-coral/10'  },
}

export default function JoinRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [acting, setActing]     = useState(null) // id of request being acted on

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = () => {
    adminAPI.getJoinRequests()
      .then(res => setRequests(res.data.data.requests))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleAction = async (id, action) => {
    setActing(id)
    try {
      await adminAPI.reviewRequest(id, action)
      // Update the row locally without full refetch
      setRequests(prev => prev.map(r =>
        r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r
      ))
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed')
    } finally {
      setActing(null)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-text-primary">Join Requests</h1>
        <p className="font-body text-text-muted mt-1">
          Approve or reject doctors and staff requesting to join your clinic
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cream-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-cream-200 rounded w-1/3" />
                  <div className="h-3 bg-cream-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="card text-center py-16">
          <Clock size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">No requests yet</p>
          <p className="font-body text-text-muted text-sm">
            When doctors or staff sign up with your clinic code, their requests will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const roleConfig   = ROLE_CONFIG[req.user?.role]   || ROLE_CONFIG.staff
            const statusConfig = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
            const Icon         = roleConfig.icon

            return (
              <div key={req.id} className="card flex flex-col md:flex-row md:items-center gap-4">

                {/* Avatar + role icon */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-crimson-500 rounded-2xl flex items-center justify-center">
                      <span className="font-display font-bold text-white text-lg">
                        {req.user?.name?.charAt(0)}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${roleConfig.bg} rounded-full flex items-center justify-center`}>
                      <Icon size={11} className={roleConfig.color} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body font-bold text-text-primary">{req.user?.name}</p>
                      <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-pill ${roleConfig.bg} ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                      <span className={`font-body text-xs font-bold px-2 py-0.5 rounded-pill ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="font-body text-sm text-text-muted">{req.user?.email}</p>
                    {req.user?.phone && (
                      <p className="font-body text-xs text-text-muted">{req.user.phone}</p>
                    )}
                    <p className="font-body text-xs text-text-muted mt-0.5">
                      Requested {new Date(req.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Action buttons — only show for pending */}
                {req.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={acting === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-accent-coral/30 text-accent-coral font-body text-sm font-semibold hover:bg-accent-coral/5 transition-all disabled:opacity-50"
                    >
                      <XCircle size={15} />
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={acting === req.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-accent-teal text-white font-body text-sm font-semibold hover:brightness-105 transition-all disabled:opacity-50 shadow-btn"
                    >
                      {acting === req.id ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={15} />
                      )}
                      Approve
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}