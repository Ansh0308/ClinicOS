import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { patientAPI, tokenAPI, adminAPI, clinicAPI } from '../../services/api'
import ReceptionLayout from '../../layouts/ReceptionLayout'
import {
  Search, Plus, Phone, UserPlus, ChevronRight,
  Activity, CheckCircle, Pause, X, Users,
  Play, FlaskConical, AlertTriangle, IndianRupee
} from 'lucide-react'

const STATUS = {
  now:       { label: 'Now',       bg: 'bg-crimson-500',     text: 'text-white',        border: 'border-crimson-200', rowBg: 'bg-crimson-50'  },
  waiting:   { label: 'Waiting',   bg: 'bg-cream-200',       text: 'text-text-body',    border: 'border-cream-200',   rowBg: 'bg-white'       },
  paused:    { label: 'Hold',      bg: 'bg-accent-peach/30', text: 'text-accent-peach', border: 'border-cream-200',   rowBg: 'bg-white'       },
  lab:       { label: 'Lab',       bg: 'bg-accent-sky/20',   text: 'text-accent-sky',   border: 'border-accent-sky/30',rowBg:'bg-accent-sky/5' },
  served:    { label: 'Served',    bg: 'bg-accent-teal/20',  text: 'text-accent-teal',  border: 'border-cream-200',   rowBg: 'bg-white'       },
  cancelled: { label: 'Cancelled', bg: 'bg-cream-200',       text: 'text-text-muted',   border: 'border-cream-200',   rowBg: 'bg-white'       },
}

// ── Simple toast system ───────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  return { toasts, addToast }
}

function ToastContainer({ toasts }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`
          flex items-center gap-3 px-4 py-3 rounded-2xl shadow-hero border font-body text-sm font-medium
          animate-[slideUp_0.3s_ease] max-w-sm
          ${t.type === 'success' ? 'bg-white border-accent-teal/40 text-text-primary' : ''}
          ${t.type === 'error'   ? 'bg-white border-accent-coral/40 text-accent-coral' : ''}
          ${t.type === 'info'    ? 'bg-white border-accent-sky/40 text-text-primary'   : ''}
        `}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0
            ${t.type === 'success' ? 'bg-accent-teal'  : ''}
            ${t.type === 'error'   ? 'bg-accent-coral' : ''}
            ${t.type === 'info'    ? 'bg-accent-sky'   : ''}
          `} />
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default function ReceptionDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, addToast } = useToast()

  // ── State ─────────────────────────────────────────────────────
  const [phone, setPhone]                   = useState('')
  const [searching, setSearching]           = useState(false)
  const [patient, setPatient]               = useState(null)
  const [togglingOptIn, setTogglingOptIn]   = useState(false)
  const [searchDone, setSearchDone]         = useState(false)
  const [showNewForm, setShowNewForm]       = useState(false)
  const [newPatient, setNewPatient]         = useState({ name:'', gender:'', optInMsg: true })
  const [creatingPatient, setCreatingPatient] = useState(false)

  const [tokens, setTokens]                 = useState([])
  const [stats, setStats]                   = useState({ inQueue: 0, servedToday: 0 })
  const [loadingTokens, setLoadingTokens]   = useState(true)
  const [issuingToken, setIssuingToken]     = useState(false)

  const [doctors, setDoctors]               = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState('')

  // Queue controls
  const [queuePaused, setQueuePaused]       = useState(false)
  const [togglingPause, setTogglingPause]   = useState(false)

  // Emergency modal
  const [showEmergency, setShowEmergency]   = useState(false)
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [emergencyPatient, setEmergencyPatient] = useState(null)
  const [searchingEmergency, setSearchingEmergency] = useState(false)

  // ── Fetch queue ───────────────────────────────────────────────
  const fetchTokens = useCallback(async () => {
    try {
      const res = await tokenAPI.getAll()
      setTokens(res.data.data.tokens)
      setStats(res.data.data.stats)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingTokens(false)
    }
  }, [])

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await clinicAPI.getDoctors()
      setDoctors(res.data.data.doctors)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    fetchTokens()
    fetchDoctors()
    const interval = setInterval(fetchTokens, 15000)
    return () => clearInterval(interval)
  }, [fetchTokens, fetchDoctors])

  // ── Patient search ────────────────────────────────────────────
  const handleSearch = async () => {
    if (phone.length < 10) return
    setSearching(true)
    setPatient(null)
    setSearchDone(false)
    setShowNewForm(false)
    try {
      const res = await patientAPI.lookup(phone)
      const { found, patient: p } = res.data.data
      if (found) setPatient(p)
      setSearchDone(true)
    } catch (err) {
      addToast('Search failed. Try again.', 'error')
    } finally {
      setSearching(false)
    }
  }

  // ── Create patient ────────────────────────────────────────────
  const handleCreatePatient = async () => {
    setCreatingPatient(true)
    try {
      const res = await patientAPI.create({
        phone,
        name:     newPatient.name   || undefined,
        gender:   newPatient.gender || undefined,
        optInMsg: newPatient.optInMsg,
      })
      setPatient({ ...res.data.data.patient, visitCount: 0, hasActiveToken: false })
      setShowNewForm(false)
      setSearchDone(true)
      addToast('Patient registered successfully', 'success')
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to register patient', 'error')
    } finally {
      setCreatingPatient(false)
    }
  }

  // ── Toggle messaging opt-in ───────────────────────────────────
  const handleToggleOptIn = async () => {
    if (!patient) return
    setTogglingOptIn(true)
    try {
      const newStatus = !patient.optInMsg
      await patientAPI.updateOptIn(patient.id, newStatus)
      setPatient({ ...patient, optInMsg: newStatus })
      addToast(`Messaging ${newStatus ? 'enabled' : 'disabled'} for ${patient.name || 'patient'}`, 'success')
    } catch (err) {
      addToast('Failed to update messaging preference', 'error')
    } finally {
      setTogglingOptIn(false)
    }
  }

  // ── Issue token ───────────────────────────────────────────────
  const handleIssueToken = async () => {
    if (!patient) return
    setIssuingToken(true)
    try {
      const res = await tokenAPI.create({
        patientId: patient.id,
        doctorId:  selectedDoctor || undefined,
      })
      const t = res.data.data.token
      addToast(`Token T-${t.tokenNumber} issued for ${patient.name || phone}`, 'success')
      setPhone('')
      setPatient(null)
      setSearchDone(false)
      fetchTokens()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to issue token', 'error')
    } finally {
      setIssuingToken(false)
    }
  }

  // ── Token actions ─────────────────────────────────────────────
  const handleStatusChange = async (tokenId, newStatus) => {
    try {
      await tokenAPI.updateStatus(tokenId, newStatus)
      fetchTokens()
      const labels = { now:'Called', served:'Marked served', paused:'Put on hold', waiting:'Resumed', lab:'Sent to lab' }
      addToast(labels[newStatus] || 'Status updated', 'success')
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update', 'error')
    }
  }

  const handleCancel = async (tokenId) => {
    if (!window.confirm('Cancel this token?')) return
    try {
      await tokenAPI.cancel(tokenId)
      fetchTokens()
      addToast('Token cancelled', 'info')
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to cancel', 'error')
    }
  }

  // ── Queue pause / resume ──────────────────────────────────────
  const handleTogglePause = async () => {
    setTogglingPause(true)
    try {
      if (queuePaused) {
        await tokenAPI.resume()
        setQueuePaused(false)
        addToast('Queue resumed', 'success')
      } else {
        await tokenAPI.pause()
        setQueuePaused(true)
        addToast('Queue paused — no new tokens will be called', 'info')
      }
    } catch (err) {
      addToast('Failed to update queue status', 'error')
    } finally {
      setTogglingPause(false)
    }
  }

  // ── Emergency search ──────────────────────────────────────────
  const handleEmergencySearch = async () => {
    if (emergencyPhone.length < 10) return
    setSearchingEmergency(true)
    try {
      const res = await patientAPI.lookup(emergencyPhone)
      const { found, patient: p } = res.data.data
      setEmergencyPatient(found ? p : null)
      if (!found) addToast('Patient not found. Register them first.', 'error')
    } catch (err) {
      addToast('Search failed', 'error')
    } finally {
      setSearchingEmergency(false)
    }
  }

  const handleIssueEmergencyToken = async () => {
    if (!emergencyPatient) return
    try {
      const res = await tokenAPI.emergency({
        patientId: emergencyPatient.id,
        doctorId:  selectedDoctor || undefined,
      })
      const t = res.data.data.token
      addToast(`🚨 Emergency token T-${t.tokenNumber} issued — moved to front of queue`, 'success')
      setShowEmergency(false)
      setEmergencyPhone('')
      setEmergencyPatient(null)
      fetchTokens()
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to issue emergency token', 'error')
    }
  }

  // ── Separate tokens ───────────────────────────────────────────
  const activeTokens = tokens.filter(t => ['waiting','now','paused','lab'].includes(t.status))
  const doneTokens   = tokens.filter(t => ['served','cancelled'].includes(t.status))

  const handleCreateBill = (token) => {
    navigate(`/billing/${token.patient?.id}`, {
      state: {
        patient: token.patient,
        tokenId: token.id,
      }
    })
  }

  return (
    <>
      <ReceptionLayout stats={stats}>

        {/* Queue paused banner */}
        {queuePaused && (
          <div className="bg-accent-yellow/20 border border-accent-yellow/40 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pause size={16} className="text-amber-600" />
              <span className="font-body text-sm font-semibold text-amber-700">
                Queue is paused — patients are not being called
              </span>
            </div>
            <button
              onClick={handleTogglePause}
              className="font-body text-sm font-semibold text-amber-700 underline hover:no-underline"
            >
              Resume
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-5 max-w-7xl mx-auto">

          {/* ── LEFT: Patient Lookup ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h2 className="font-display font-bold text-xl text-text-primary mb-4">
                Patient Lookup
              </h2>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      const d = e.target.value.replace(/\D/g,'').slice(0,10)
                      setPhone(d)
                      if (searchDone) { setSearchDone(false); setPatient(null) }
                    }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="10-digit mobile number"
                    className="w-full pl-9 pr-3 py-3 rounded-2xl border border-cream-300 bg-cream-50 font-body text-sm focus:outline-none focus:border-crimson-400 focus:ring-2 focus:ring-crimson-100 focus:bg-white transition-all"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={phone.length < 10 || searching}
                  className="btn-primary px-4 py-3 text-xs disabled:opacity-50"
                >
                  {searching
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Search size={16} />
                  }
                </button>
              </div>

              {/* Found */}
              {searchDone && patient && (
                <div className="mt-4 bg-accent-teal/10 border border-accent-teal/30 rounded-2xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-crimson-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <span className="font-display font-bold text-white text-lg">
                        {(patient.name || phone).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-body font-bold text-text-primary">{patient.name || 'Patient'}</p>
                      <p className="font-body text-xs text-text-muted">{patient.phone}</p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {patient.gender && <span className="font-body text-xs text-text-muted capitalize">{patient.gender}</span>}
                        <span className="font-body text-xs text-text-muted">{patient.visitCount} visits</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Toggle messaging ─────────────────────────────────── */}
                  <div className="flex items-center justify-between bg-white/50 rounded-xl p-3 mb-3 border border-cream-200">
                    <div className="flex flex-col">
                      <span className="font-body text-sm font-semibold text-text-primary">Automated Messages</span>
                      <span className="font-body text-xs text-text-muted">Send queue and bill updates via WhatsApp/SMS/Email</span>
                    </div>
                    <button
                      onClick={handleToggleOptIn}
                      disabled={togglingOptIn}
                      className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${
                        patient.optInMsg ? 'bg-accent-teal' : 'bg-cream-300'
                      }`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        patient.optInMsg ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {patient.hasActiveToken ? (
                    <div className="space-y-2">
                      <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-3 text-center">
                        <p className="font-body text-sm font-semibold text-amber-700">
                          Already in queue — Token T-{patient.tokenNumber}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate(`/billing/${patient.id}`, { state: { patient } })}
                        className="w-full py-2.5 rounded-xl border border-cream-300 bg-white text-text-body hover:bg-cream-100 font-body text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                      >
                        Create Bill <ChevronRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {doctors.length > 0 && (
                        <div className="mb-3">
                          <select
                            value={selectedDoctor}
                            onChange={e => setSelectedDoctor(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
                          >
                            <option value="">Any available doctor</option>
                            {doctors.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={handleIssueToken}
                        disabled={issuingToken}
                        className="btn-primary w-full justify-center py-2.5 text-xs"
                      >
                        {issuingToken
                          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <><Plus size={14} /> Issue Token <ChevronRight size={14} /></>
                        }
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Not found */}
              {searchDone && !patient && !showNewForm && (
                <div className="mt-4 border border-dashed border-cream-300 rounded-2xl p-4 text-center">
                  <p className="font-body text-sm text-text-muted mb-3">
                    No patient found for <strong>{phone}</strong>
                  </p>
                  <button onClick={() => setShowNewForm(true)} className="btn-primary text-xs py-2 px-5">
                    <UserPlus size={14} /> Register New Patient
                  </button>
                </div>
              )}

              {/* New patient form */}
              {showNewForm && (
                <div className="mt-4 border border-crimson-200 bg-crimson-50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <p className="font-body text-sm font-bold text-text-secondary">New Patient</p>
                    <button onClick={() => setShowNewForm(false)}><X size={14} className="text-text-muted" /></button>
                  </div>
                  <input value={phone} readOnly className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-cream-100 font-body text-sm text-text-muted" />
                  <input
                    value={newPatient.name}
                    onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))}
                    placeholder="Name (optional)"
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
                  />
                  <select
                    value={newPatient.gender}
                    onChange={e => setNewPatient(p => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-cream-300 bg-white font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
                  >
                    <option value="">Gender (optional)</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPatient.optInMsg}
                      onChange={e => setNewPatient(p => ({ ...p, optInMsg: e.target.checked }))}
                      className="mt-0.5 accent-crimson-500"
                    />
                    <span className="font-body text-xs text-text-body">
                      Patient consents to data storage and WhatsApp/SMS notifications
                      <span className="text-accent-coral"> *</span>
                    </span>
                  </label>
                  <button
                    onClick={handleCreatePatient}
                    disabled={creatingPatient || !newPatient.optInMsg}
                    className="btn-primary w-full justify-center py-2.5 text-xs disabled:opacity-50"
                  >
                    {creatingPatient
                      ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><UserPlus size={14} /> Create &amp; Continue</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* Queue controls */}
            <div className="card space-y-2">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                Queue Controls
              </p>

              {/* Emergency token button */}
              <button
                onClick={() => setShowEmergency(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-accent-coral/30 bg-accent-coral/5 hover:bg-accent-coral/10 transition-all group"
              >
                <div className="w-8 h-8 bg-accent-coral/10 rounded-xl flex items-center justify-center group-hover:bg-accent-coral/20 transition-all">
                  <AlertTriangle size={16} className="text-accent-coral" />
                </div>
                <div className="text-left">
                  <p className="font-body text-sm font-bold text-accent-coral">Emergency Token</p>
                  <p className="font-body text-xs text-text-muted">Skip to front of queue</p>
                </div>
              </button>

              {/* Pause/Resume queue */}
              <button
                onClick={handleTogglePause}
                disabled={togglingPause}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all group
                  ${queuePaused
                    ? 'border-accent-teal/30 bg-accent-teal/5 hover:bg-accent-teal/10'
                    : 'border-cream-300 bg-cream-50 hover:bg-cream-100'
                  }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                  ${queuePaused ? 'bg-accent-teal/10' : 'bg-cream-200'}`}>
                  {queuePaused
                    ? <Play size={16} className="text-accent-teal" />
                    : <Pause size={16} className="text-text-muted" />
                  }
                </div>
                <div className="text-left">
                  <p className={`font-body text-sm font-bold ${queuePaused ? 'text-accent-teal' : 'text-text-body'}`}>
                    {queuePaused ? 'Resume Queue' : 'Pause Queue'}
                  </p>
                  <p className="font-body text-xs text-text-muted">
                    {queuePaused ? 'Queue is currently paused' : 'Temporarily stop calling patients'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* ── RIGHT: Live Queue ────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-text-primary">Live Queue</h2>
                  <p className="font-body text-xs text-text-muted">{user?.clinicName} · Today</p>
                </div>
                <div className="flex items-center gap-1.5 bg-accent-teal/10 px-3 py-1.5 rounded-pill">
                  <span className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-pulse" />
                  <span className="font-body text-xs font-bold text-accent-teal">
                    {activeTokens.length} active
                  </span>
                </div>
              </div>

              {loadingTokens ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-cream-100 rounded-2xl animate-pulse" />)}
                </div>
              ) : activeTokens.length === 0 && doneTokens.length === 0 ? (
                <div className="text-center py-16">
                  <Users size={36} className="text-cream-400 mx-auto mb-2" />
                  <p className="font-display font-bold text-lg text-text-primary mb-1">Queue is clear</p>
                  <p className="font-body text-sm text-text-muted">Use the lookup panel to register and issue tokens</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                  {activeTokens.map(token => (
                    <TokenRow
                      key={token.id}
                      token={token}
                      onStatusChange={handleStatusChange}
                      onCancel={handleCancel}
                    />
                  ))}

                  {activeTokens.length > 0 && doneTokens.length > 0 && (
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex-1 h-px bg-cream-200" />
                      <span className="font-body text-xs text-text-muted">Completed today</span>
                      <div className="flex-1 h-px bg-cream-200" />
                    </div>
                  )}

                  {doneTokens.slice(0,5).map(token => (
                    <TokenRow key={token.id} token={token} onStatusChange={handleStatusChange} onCancel={handleCancel} done onCreateBill={token.status === 'served' ? handleCreateBill : null} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </ReceptionLayout>

      {/* ── Emergency Token Modal ─────────────────────────────── */}
      {showEmergency && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="card max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-xl text-accent-coral">Emergency Token</h3>
              <button onClick={() => { setShowEmergency(false); setEmergencyPhone(''); setEmergencyPatient(null) }}>
                <X size={18} className="text-text-muted" />
              </button>
            </div>
            <p className="font-body text-sm text-text-muted mb-4">
              This patient will be moved to the <strong className="text-text-body">front of the queue</strong>. All other tokens shift back.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="tel"
                value={emergencyPhone}
                onChange={e => {
                  setEmergencyPhone(e.target.value.replace(/\D/g,'').slice(0,10))
                  setEmergencyPatient(null)
                }}
                placeholder="Patient mobile number"
                className="flex-1 px-3 py-2.5 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
              />
              <button
                onClick={handleEmergencySearch}
                disabled={emergencyPhone.length < 10 || searchingEmergency}
                className="btn-primary px-3 py-2.5 text-xs disabled:opacity-50"
              >
                {searchingEmergency
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Search size={14} />
                }
              </button>
            </div>

            {emergencyPatient && (
              <div className="bg-accent-coral/10 border border-accent-coral/30 rounded-xl p-3 mb-4">
                <p className="font-body font-bold text-text-primary">{emergencyPatient.name || emergencyPhone}</p>
                <p className="font-body text-xs text-text-muted">{emergencyPatient.phone}</p>
              </div>
            )}

            <button
              onClick={handleIssueEmergencyToken}
              disabled={!emergencyPatient}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-coral text-white font-body font-bold text-sm disabled:opacity-40 hover:brightness-105 transition-all"
            >
              <AlertTriangle size={15} />
              Issue Emergency Token
            </button>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}

// ── Token Row ─────────────────────────────────────────────────────────────────
function TokenRow({ token, onStatusChange, onCancel, done = false, onCreateBill }) {
  const config = STATUS[token.status] || STATUS.waiting

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-all
      ${done ? 'opacity-50' : ''} ${config.rowBg} ${config.border}`}
    >
      <span className={`font-display font-bold text-sm px-3 py-1 rounded-pill flex-shrink-0 ${config.bg} ${config.text}`}>
        T-{token.tokenNumber}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm text-text-primary truncate">
          {token.patient?.name || token.patient?.phone || 'Patient'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="font-body text-xs text-text-muted">{config.label}</span>
          {token.estimatedWait > 0 && token.status === 'waiting' && (
            <span className="font-body text-xs text-text-muted">· ~{token.estimatedWait}m wait</span>
          )}
          {token.doctor && (
            <span className="font-body text-xs text-text-muted">· {token.doctor.name}</span>
          )}
        </div>
      </div>

      {!done && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {token.status === 'waiting' && (
            <Btn icon={Activity}     onClick={() => onStatusChange(token.id, 'now')}     title="Call now"      cls="text-crimson-500 hover:bg-crimson-100" />
          )}
          {token.status === 'now' && (
            <Btn icon={CheckCircle}  onClick={() => onStatusChange(token.id, 'served')}  title="Mark served"   cls="text-accent-teal hover:bg-accent-teal/10" />
          )}
          {['waiting','now'].includes(token.status) && (
            <Btn icon={FlaskConical} onClick={() => onStatusChange(token.id, 'lab')}     title="Send to lab"   cls="text-accent-sky hover:bg-accent-sky/10" />
          )}
          {['waiting','now'].includes(token.status) && (
            <Btn icon={Pause}        onClick={() => onStatusChange(token.id, 'paused')}  title="Hold"          cls="text-text-muted hover:bg-cream-200" />
          )}
          {token.status === 'paused' && (
            <Btn icon={Play}         onClick={() => onStatusChange(token.id, 'waiting')} title="Resume"        cls="text-crimson-500 hover:bg-crimson-100" />
          )}
          {token.status === 'lab' && (
            <Btn icon={Activity}     onClick={() => onStatusChange(token.id, 'waiting')} title="Back to queue" cls="text-crimson-500 hover:bg-crimson-100" />
          )}
          <Btn icon={X}              onClick={() => onCancel(token.id)}                  title="Cancel"        cls="text-accent-coral hover:bg-accent-coral/10" />
        </div>
      )}

      {/* ── Served token: show Create Bill button ─────────────── */}
      {token.status === 'served' && onCreateBill && (
        <button
          onClick={() => onCreateBill(token)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-teal text-white font-body text-xs font-bold hover:brightness-105 transition-all flex-shrink-0"
        >
          <IndianRupee size={12} />
          Bill
        </button>
      )}
    </div>
  )
}

function Btn({ icon: Icon, onClick, title, cls }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${cls}`}>
      <Icon size={13} />
    </button>
  )
}
