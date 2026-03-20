import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { tokenAPI } from '../../services/api'
import { Activity, Users, Clock, ChevronRight } from 'lucide-react'

const STATUS_COLOR = {
  now:     'bg-crimson-500 text-white',
  waiting: 'bg-cream-200 text-text-body',
  paused:  'bg-accent-peach/20 text-accent-peach',
  lab:     'bg-accent-sky/20 text-accent-sky',
}

export default function DoctorQueue() {
  const { user }              = useAuth()
  const navigate              = useNavigate()
  const [tokens, setTokens]   = useState([])
  const [loading, setLoading] = useState(true)
  const [calling, setCalling] = useState(null)

  const fetchMyQueue = useCallback(async () => {
    try {
      const res = await tokenAPI.getAll()
      // Filter only this doctor's tokens
      const mine = res.data.data.tokens.filter(t =>
        t.doctorId === user?.id &&
        ['waiting', 'now', 'paused', 'lab'].includes(t.status)
      )
      setTokens(mine)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchMyQueue()
    const interval = setInterval(fetchMyQueue, 15000)
    return () => clearInterval(interval)
  }, [fetchMyQueue])

  const currentPatient = tokens.find(t => t.status === 'now')
  const nextPatient    = tokens.find(t => t.status === 'waiting')
  const waitingCount   = tokens.filter(t => t.status === 'waiting').length

  const handleCallNext = async () => {
    if (!nextPatient) return
    setCalling(nextPatient.id)
    try {
      // Mark current as served if exists
      if (currentPatient) {
        await tokenAPI.updateStatus(currentPatient.id, 'served')
      }
      await tokenAPI.updateStatus(nextPatient.id, 'now')
    } catch (err) {
      console.error(err)
    } finally {
      await fetchMyQueue() // Refresh queue always
      setCalling(null)
    }
  }

  const handleStartConsultation = (token) => {
    navigate(`/doctor/consult/${token.id}`, {
      state: {
        token,
        patient: token.patient,
      }
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-cream-200 rounded w-1/3 animate-pulse" />
        <div className="card h-48 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-3xl text-text-primary">My Queue</h1>
        <p className="font-body text-text-muted mt-1">
          {user?.clinicName} · {waitingCount} waiting
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Now Consulting', value: currentPatient ? 1 : 0, icon: Activity, color: 'text-crimson-500', bg: 'bg-crimson-100' },
          { label: 'Waiting',        value: waitingCount,           icon: Users,    color: 'text-accent-sky',  bg: 'bg-accent-sky/10' },
          { label: 'Avg Wait',       value: `${tokens[0]?.estimatedWait || 0}m`, icon: Clock, color: 'text-accent-teal', bg: 'bg-accent-teal/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card py-4 text-center">
            <div className={`w-10 h-10 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} className={color} />
            </div>
            <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
            <p className="font-body text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {tokens.length === 0 ? (
        <div className="card text-center py-16">
          <Users size={40} className="text-cream-400 mx-auto mb-3" />
          <p className="font-display font-bold text-xl text-text-primary mb-1">No patients yet</p>
          <p className="font-body text-sm text-text-muted">
            Patients will appear here when reception assigns them to you
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">

          {/* Current patient */}
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
              Now Consulting
            </p>
            {currentPatient ? (
              <div className="card border-2 border-crimson-200 bg-crimson-50">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 bg-crimson-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-white text-xl">
                      {(currentPatient.patient?.name || 'P').charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="font-display font-bold text-xs text-white bg-crimson-500 px-2 py-0.5 rounded-pill">
                      T-{currentPatient.tokenNumber}
                    </span>
                    <p className="font-body font-bold text-text-primary mt-1">
                      {currentPatient.patient?.name || 'Patient'}
                    </p>
                    <p className="font-body text-xs text-text-muted">
                      {currentPatient.patient?.phone}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleStartConsultation(currentPatient)}
                  className="btn-primary w-full justify-center py-3 text-sm"
                >
                  Open Consultation
                  <ChevronRight size={15} />
                </button>
              </div>
            ) : (
              <div className="card border border-dashed border-cream-300 text-center py-8">
                <p className="font-body text-sm text-text-muted">No patient currently consulting</p>
              </div>
            )}
          </div>

          {/* Next + queue list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-text-muted">
                Queue
              </p>
              {nextPatient && (
                <button
                  onClick={handleCallNext}
                  disabled={!!calling}
                  className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50"
                >
                  {calling ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Call Next'
                  )}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {tokens
                .filter(t => t.id !== currentPatient?.id)
                .map((token, index) => (
                  <div
                    key={token.id}
                    className="card py-3 flex items-center gap-3 hover:shadow-hero transition-shadow cursor-pointer"
                    onClick={() => token.status === 'now' && handleStartConsultation(token)}
                  >
                    <span className={`font-display font-bold text-xs px-2.5 py-1 rounded-pill flex-shrink-0 ${STATUS_COLOR[token.status] || STATUS_COLOR.waiting}`}>
                      T-{token.tokenNumber}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm text-text-primary truncate">
                        {token.patient?.name || token.patient?.phone || 'Patient'}
                      </p>
                      <p className="font-body text-xs text-text-muted capitalize">{token.status}</p>
                    </div>
                    {index === 0 && token.status === 'waiting' && (
                      <span className="font-body text-xs font-bold text-accent-yellow bg-accent-yellow/10 px-2 py-0.5 rounded-pill flex-shrink-0">
                        Next
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
