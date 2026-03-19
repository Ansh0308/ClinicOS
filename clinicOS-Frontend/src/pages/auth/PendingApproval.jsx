import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, LogOut, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'

export default function PendingApproval() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()

  // Poll every 30 seconds to check if admin approved
  useEffect(() => {
    if (!user) return

    // Already approved — redirect immediately
    if (user.status === 'approved') {
      navigate(user.role === 'doctor' ? '/doctor' : '/reception', { replace: true })
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await authAPI.getMe()
        const freshUser = res.data.data.user

        if (freshUser.status === 'approved') {
          // Update auth context with fresh user data
          const token = localStorage.getItem('clinicos_token')
          login(freshUser, token)
          navigate(freshUser.role === 'doctor' ? '/doctor' : '/reception', { replace: true })
        } else if (freshUser.status === 'rejected') {
          const token = localStorage.getItem('clinicos_token')
          login(freshUser, token) // update status in context
        }
      } catch (err) {
        console.error('Status check failed:', err)
      }
    }, 30000) // every 30 seconds

    return () => clearInterval(interval)
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!user) return null

  // ── Rejected state ─────────────────────────────────────────────
  if (user.status === 'rejected') {
    return (
      <div className="min-h-screen hero-glow flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center p-10">
          <div className="w-16 h-16 bg-accent-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-accent-coral" />
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary mb-2">Request Not Approved</h1>
          <p className="font-body text-text-muted mb-6">
            Your request to join <strong className="text-text-secondary">{user.clinicName || 'the clinic'}</strong> was not approved.
            Please contact your clinic admin for more information.
          </p>
          <button onClick={handleLogout} className="btn-primary w-full justify-center py-3">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // ── Pending state ──────────────────────────────────────────────
  return (
    <div className="min-h-screen hero-glow flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center p-10">

        {/* Animated clock icon */}
        <div className="w-16 h-16 bg-accent-yellow/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-accent-yellow animate-pulse" />
        </div>

        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">
          Awaiting Approval
        </h1>

        <p className="font-body text-text-muted mb-6">
          Your request to join{' '}
          <strong className="text-text-secondary">{user.clinicName || 'the clinic'}</strong>{' '}
          as a <strong className="text-text-secondary capitalize">{user.role}</strong> is under review.
          Your admin will approve your account shortly.
        </p>

        {/* Info box */}
        <div className="bg-cream-100 border border-cream-300 rounded-2xl p-4 mb-6 text-left">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-accent-teal" />
            <span className="font-body text-sm text-text-body">Email verified</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-accent-teal" />
            <span className="font-body text-sm text-text-body">Join request submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-accent-yellow" />
            <span className="font-body text-sm text-text-muted">Waiting for admin approval...</span>
          </div>
        </div>

        <p className="font-body text-xs text-text-muted mb-6">
          This page checks automatically every 30 seconds. You'll be redirected as soon as you're approved.
        </p>

        <button onClick={handleLogout} className="btn-ghost w-full justify-center py-2.5 border border-cream-300">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  )
}