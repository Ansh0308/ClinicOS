import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { patientPortalAPI } from '../../services/api'
import { Activity, Clock, CheckCircle, FlaskConical, LogOut, Bell } from 'lucide-react'

const STATUS_UI = {
  waiting: {
    emoji: '⏳', label: 'Waiting',
    message: 'Please wait — we will notify you when your turn is near',
    color: 'text-text-body', bg: 'bg-cream-100',
  },
  now: {
    emoji: '🎉', label: 'Your Turn!',
    message: 'Please proceed to the consultation room now',
    color: 'text-accent-teal', bg: 'bg-accent-teal/10',
  },
  paused: {
    emoji: '⏸️', label: 'On Hold',
    message: 'Your token has been put on hold by the clinic',
    color: 'text-accent-peach', bg: 'bg-accent-peach/10',
  },
  lab: {
    emoji: '🔬', label: 'In Lab',
    message: 'Please proceed to the lab for your tests',
    color: 'text-accent-sky', bg: 'bg-accent-sky/10',
  },
}

export default function QueueTracker() {
  const navigate                    = useNavigate()
  const [tokenData, setTokenData]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [leaving, setLeaving]       = useState(false)
  const [notifyEnabled, setNotifyEnabled] = useState(true)

  const fetchToken = useCallback(async () => {
    try {
      const res = await patientPortalAPI.getActiveToken()
      setTokenData(res.data.data.token)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchToken()
    const interval = setInterval(fetchToken, 20000)
    return () => clearInterval(interval)
  }, [fetchToken])

  const handleLeaveQueue = async () => {
    if (!window.confirm('Are you sure you want to leave the queue? You will lose your position.')) return
    setLeaving(true)
    try {
      await patientPortalAPI.leaveQueue()
      setTokenData(null)
      navigate('/patient')
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to leave queue')
    } finally {
      setLeaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-6 h-6 border-2 border-crimson-300 border-t-crimson-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!tokenData) {
    return (
      <div className="text-center py-20">
        <Activity size={48} className="text-cream-300 mx-auto mb-4" />
        <h2 className="font-display font-bold text-2xl text-text-primary mb-2">No Active Token</h2>
        <p className="font-body text-sm text-text-muted">
          You don't have an active queue token today.
        </p>
      </div>
    )
  }

  const ui = STATUS_UI[tokenData.status] || STATUS_UI.waiting

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Live Queue</h1>
        <p className="font-body text-sm text-text-muted">
          {tokenData.clinic?.name}
          {tokenData.doctor && ` · Dr. ${tokenData.doctor.name}`}
        </p>
      </div>

      {/* Main token card */}
      <div className={`rounded-3xl p-6 text-center ${ui.bg} border-2 border-current/10`}>
        <p className="text-5xl mb-2">{ui.emoji}</p>
        <p className={`font-body text-sm font-bold uppercase tracking-widest mb-2 ${ui.color}`}>
          {ui.label}
        </p>
        <p className="font-display font-bold text-8xl text-text-primary mb-1">
          T-{tokenData.tokenNumber}
        </p>
        <p className="font-body text-sm text-text-muted">{ui.message}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-4">
          <p className="font-body text-xs text-text-muted mb-1 flex items-center justify-center gap-1">
            <Activity size={12} /> Position
          </p>
          <p className="font-display font-bold text-3xl text-crimson-500">
            {tokenData.status === 'now' ? '🎉' : `#${tokenData.livePosition || tokenData.queuePosition || '—'}`}
          </p>
        </div>
        <div className="card text-center py-4">
          <p className="font-body text-xs text-text-muted mb-1 flex items-center justify-center gap-1">
            <Clock size={12} /> Est. Wait
          </p>
          <p className="font-display font-bold text-3xl text-accent-teal">
            {tokenData.status === 'now'
              ? 'Now'
              : tokenData.estimatedWait > 0
              ? `${tokenData.estimatedWait}m`
              : '—'
            }
          </p>
        </div>
      </div>

      {/* Tokens ahead */}
      {tokenData.status === 'waiting' && tokenData.tokensAhead >= 0 && (
        <div className="card">
          <p className="font-body text-sm text-text-muted text-center mb-3">
            {tokenData.tokensAhead === 0
              ? '✨ You are next in line!'
              : tokenData.tokensAhead === 1
              ? '1 patient ahead of you'
              : `${tokenData.tokensAhead} patients ahead of you`
            }
          </p>
          <div className="flex gap-1.5 justify-center flex-wrap">
            {Array.from({ length: Math.min(tokenData.tokensAhead + 1, 10) }).map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full transition-all
                ${i < tokenData.tokensAhead ? 'bg-cream-300' : 'bg-crimson-500 scale-125'}`}
              />
            ))}
            {tokenData.tokensAhead > 9 && (
              <span className="font-body text-xs text-text-muted">+{tokenData.tokensAhead - 9} more</span>
            )}
          </div>
        </div>
      )}

      {/* Notify me toggle */}
      {tokenData.status === 'waiting' && (
        <div className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent-sky/10 rounded-xl flex items-center justify-center">
              <Bell size={16} className="text-accent-sky" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-text-primary">
                Notify me when 2 ahead
              </p>
              <p className="font-body text-xs text-text-muted">
                Get an email when you're almost up
              </p>
            </div>
          </div>
          <button
            onClick={() => setNotifyEnabled(!notifyEnabled)}
            className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0
              ${notifyEnabled ? 'bg-accent-teal' : 'bg-cream-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
              ${notifyEnabled ? 'left-5' : 'left-0.5'}`}
            />
          </button>
        </div>
      )}

      {/* Journey steps */}
      <div className="card">
        <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted mb-4">
          Your Journey
        </p>
        <div className="space-y-3">
          {[
            { icon: CheckCircle,  label: 'Token issued',          done: true },
            { icon: Clock,        label: 'Waiting in queue',       done: ['now','served','lab'].includes(tokenData.status), active: tokenData.status === 'waiting' },
            { icon: Activity,     label: 'Called by doctor',       done: tokenData.status === 'served', active: tokenData.status === 'now' },
            { icon: FlaskConical, label: 'Lab tests (if ordered)', done: false, active: tokenData.status === 'lab' },
            { icon: CheckCircle,  label: 'Consultation complete',  done: tokenData.status === 'served' },
          ].map(({ icon: Icon, label, done, active }) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                ${done   ? 'bg-accent-teal text-white' : ''}
                ${active ? 'bg-crimson-500 text-white animate-pulse' : ''}
                ${!done && !active ? 'bg-cream-200 text-text-muted' : ''}
              `}>
                <Icon size={13} />
              </div>
              <p className={`font-body text-sm
                ${done   ? 'text-accent-teal font-semibold line-through' : ''}
                ${active ? 'text-crimson-600 font-bold' : ''}
                ${!done && !active ? 'text-text-muted' : ''}
              `}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Leave queue — only when waiting or paused */}
      {['waiting', 'paused'].includes(tokenData.status) && (
        <button
          onClick={handleLeaveQueue}
          disabled={leaving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-accent-coral/30 text-accent-coral font-body text-sm font-semibold hover:bg-accent-coral/5 transition-all disabled:opacity-50"
        >
          {leaving
            ? <span className="w-4 h-4 border-2 border-accent-coral/30 border-t-accent-coral rounded-full animate-spin" />
            : <><LogOut size={15} /> Leave Queue</>
          }
        </button>
      )}

      {lastUpdated && (
        <p className="font-body text-xs text-text-muted text-center">
          Auto-updates every 20s · {lastUpdated.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
        </p>
      )}
    </div>
  )
}
