import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { visitAPI } from '../../services/api'
import {
  Save, CheckCircle, ChevronLeft, Plus, X,
  Clock, User, History, AlertCircle
} from 'lucide-react'
import PatientHistoryPanel from '../../components/doctor/PatientHistoryPanel'

// ── Tag Chip Input ────────────────────────────────────────────────
function TagInput({ tags = [], onChange, placeholder }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border border-cream-300 rounded-2xl bg-cream-50 focus-within:border-crimson-400 focus-within:ring-2 focus-within:ring-crimson-100 transition-all min-h-[44px]">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 bg-crimson-100 text-crimson-600 font-body text-xs font-semibold px-2.5 py-1 rounded-pill">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter(t => t !== tag))}>
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-24 bg-transparent outline-none font-body text-sm text-text-primary placeholder:text-text-muted px-1"
      />
    </div>
  )
}

// ── Prescription Row ──────────────────────────────────────────────
function PrescriptionRow({ rx, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start">
      <input
        value={rx.name}
        onChange={e => onChange({ ...rx, name: e.target.value })}
        placeholder="Medicine name"
        className="col-span-4 px-3 py-2 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
      />
      <input
        value={rx.dose}
        onChange={e => onChange({ ...rx, dose: e.target.value })}
        placeholder="Dose (e.g. 500mg)"
        className="col-span-2 px-3 py-2 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
      />
      <input
        value={rx.frequency}
        onChange={e => onChange({ ...rx, frequency: e.target.value })}
        placeholder="Frequency"
        className="col-span-2 px-3 py-2 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
      />
      <input
        value={rx.duration}
        onChange={e => onChange({ ...rx, duration: e.target.value })}
        placeholder="Duration"
        className="col-span-2 px-3 py-2 rounded-xl border border-cream-300 bg-cream-50 font-body text-sm focus:outline-none focus:border-crimson-400 transition-all"
      />
      <button
        type="button"
        onClick={onRemove}
        className="col-span-1 w-8 h-8 mt-1 rounded-xl bg-accent-coral/10 text-accent-coral hover:bg-accent-coral/20 flex items-center justify-center transition-all"
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── Label ─────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <label className="font-body text-xs font-bold uppercase tracking-wider text-text-muted block mb-2">
      {children}
    </label>
  )
}

// ── Input ─────────────────────────────────────────────────────────
function Input({ ...props }) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2.5 rounded-2xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 focus:ring-2 focus:ring-crimson-100 transition-all"
    />
  )
}

function Textarea({ ...props }) {
  return (
    <textarea
      {...props}
      rows={3}
      className="w-full px-3 py-2.5 rounded-2xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 focus:ring-2 focus:ring-crimson-100 transition-all resize-none"
    />
  )
}

// ── Main Component ────────────────────────────────────────────────
export default function ConsultationForm() {
  const { tokenId }  = useParams()
  const { state }    = useLocation()
  const navigate     = useNavigate()

  const patient = state?.patient
  const token   = state?.token

  // ── Form state ─────────────────────────────────────────────────
  const [visitId, setVisitId]             = useState(null)
  const [isComplete, setIsComplete]       = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const [saving, setSaving]               = useState(false)
  const [savedAt, setSavedAt]             = useState(null)
  const [completing, setCompleting]       = useState(false)
  const [saveError, setSaveError]         = useState('')
  const [visitLoading, setVisitLoading]   = useState(true)
  const [visitError, setVisitError]       = useState(null)

  const [complaint, setComplaint]         = useState('')
  const [complaintTags, setComplaintTags] = useState([])
  const [diagnosis, setDiagnosis]         = useState('')
  const [notes, setNotes]                 = useState('')
  const [followUpDate, setFollowUpDate]   = useState('')

  const [vitals, setVitals] = useState({
    bp: '', temp: '', weight: '', height: '',
  })

  const [prescriptions, setPrescriptions] = useState([
    { id: Date.now(), name: '', dose: '', frequency: '', duration: '' }
  ])

  const [testsOrdered, setTestsOrdered] = useState([])

  // ── Create visit on mount ──────────────────────────────────────
  useEffect(() => {
    if (!patient?.id) return

    visitAPI.create({ patientId: patient.id, tokenId })
      .then(res => {
        setVisitId(res.data.data.visit.id)
        setVisitLoading(false)
      })
      .catch(err => {
        console.error('create visit error:', err)
        setVisitError(err.response?.data?.error || 'Failed to initialize consultation')
        setVisitLoading(false)
      })
  }, [patient?.id, tokenId])

  // ── Autosave every 30 seconds ──────────────────────────────────
  const getFormData = useCallback(() => ({
    complaint,
    complaintTags,
    vitals,
    diagnosis,
    notes,
    prescriptions: prescriptions.filter(rx => rx.name),
    testsOrdered,
    followUpDate: followUpDate || null,
  }), [complaint, complaintTags, vitals, diagnosis, notes, prescriptions, testsOrdered, followUpDate])

  useEffect(() => {
    if (!visitId || isComplete) return

    const interval = setInterval(async () => {
      setSaving(true)
      setSaveError('')
      try {
        await visitAPI.update(visitId, getFormData())
        setSavedAt(new Date())
      } catch (err) {
        setSaveError('Autosave failed')
      } finally {
        setSaving(false)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [visitId, isComplete, getFormData])

  // ── Manual save ────────────────────────────────────────────────
  const handleManualSave = async () => {
    if (!visitId) return
    setSaving(true)
    setSaveError('')
    try {
      await visitAPI.update(visitId, getFormData())
      setSavedAt(new Date())
    } catch (err) {
      setSaveError('Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Complete consultation ──────────────────────────────────────
  const handleComplete = async () => {
    if (!visitId) return
    if (!window.confirm('Complete this consultation? This cannot be undone.')) return

    setCompleting(true)
    try {
      // Save first
      await visitAPI.update(visitId, getFormData())
      // Then complete
      await visitAPI.complete(visitId)
      setIsComplete(true)
      setTimeout(() => navigate('/doctor'), 1500)
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to complete')
    } finally {
      setCompleting(false)
    }
  }

  // ── Prescription helpers ───────────────────────────────────────
  const addRx  = () => setPrescriptions(p => [...p, { id: Date.now(), name:'', dose:'', frequency:'', duration:'' }])
  const updateRx = (id, data) => setPrescriptions(p => p.map(rx => rx.id === id ? { ...rx, ...data } : rx))
  const removeRx = (id) => setPrescriptions(p => p.filter(rx => rx.id !== id))

  if (!patient) {
    return (
      <div className="text-center py-20">
        <p className="font-body text-text-muted">No patient data. Go back to queue.</p>
        <button onClick={() => navigate('/doctor')} className="btn-primary mt-4">
          Back to Queue
        </button>
      </div>
    )
  }

  if (visitLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="w-8 h-8 border-4 border-crimson-200 border-t-crimson-500 rounded-full animate-spin mb-4" />
        <p className="font-body text-text-muted">Initializing consultation...</p>
      </div>
    )
  }

  if (visitError) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} className="text-accent-coral mx-auto mb-4" />
        <p className="font-body text-lg font-bold text-text-primary mb-2">Failed to start consultation</p>
        <p className="font-body text-sm text-text-muted mb-6">{visitError}</p>
        <button onClick={() => navigate('/doctor')} className="btn-primary flex items-center gap-2 mx-auto">
          <ChevronLeft size={16} /> Back to Queue
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor')}
            className="w-9 h-9 rounded-xl bg-white border border-cream-300 flex items-center justify-center hover:bg-cream-100 transition-all"
          >
            <ChevronLeft size={18} className="text-text-body" />
          </button>
          <div>
            <h1 className="font-display font-bold text-2xl text-text-primary">
              {patient?.name || 'Patient'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-body text-xs text-text-muted">{patient?.phone}</span>
              {token && (
                <span className="font-display font-bold text-xs text-white bg-crimson-500 px-2 py-0.5 rounded-pill">
                  T-{token.tokenNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View history */}
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-cream-300 bg-white font-body text-sm font-semibold text-text-body hover:bg-cream-100 transition-all"
          >
            <History size={15} />
            History
          </button>

          {/* Save status */}
          <div className="flex items-center gap-2">
            {saveError && (
              <span className="font-body text-xs text-accent-coral flex items-center gap-1">
                <AlertCircle size={12} /> {saveError}
              </span>
            )}
            {savedAt && !saveError && (
              <span className="font-body text-xs text-text-muted flex items-center gap-1">
                <Clock size={11} />
                Saved {savedAt.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
              </span>
            )}
            <button
              onClick={handleManualSave}
              disabled={saving || isComplete}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-cream-300 bg-white font-body text-sm font-semibold text-text-body hover:bg-cream-100 transition-all disabled:opacity-50"
            >
              {saving
                ? <span className="w-3.5 h-3.5 border-2 border-text-muted/30 border-t-text-muted rounded-full animate-spin" />
                : <Save size={14} />
              }
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Completed banner */}
      {isComplete && (
        <div className="bg-accent-teal/10 border border-accent-teal/30 rounded-2xl p-4 mb-5 flex items-center gap-2">
          <CheckCircle size={18} className="text-accent-teal" />
          <p className="font-body text-sm font-semibold text-accent-teal">
            Consultation completed. Redirecting to queue...
          </p>
        </div>
      )}

      <div className="space-y-4">

        {/* ── Complaint ─────────────────────────────────────────── */}
        <div className="card">
          <Label>Chief Complaint</Label>
          <Textarea
            value={complaint}
            onChange={e => setComplaint(e.target.value)}
            placeholder="Describe the patient's main complaint..."
            disabled={isComplete}
          />
          <div className="mt-3">
            <Label>Complaint Tags</Label>
            <TagInput
              tags={complaintTags}
              onChange={setComplaintTags}
              placeholder="Type tag and press Enter (e.g. fever, cough)"
            />
          </div>
        </div>

        {/* ── Vitals ────────────────────────────────────────────── */}
        <div className="card">
          <Label>Vitals <span className="font-body text-xs normal-case text-text-muted font-normal">(all optional)</span></Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'bp',     label: 'BP',          placeholder: '120/80 mmHg' },
              { key: 'temp',   label: 'Temperature',  placeholder: '98.6 °F' },
              { key: 'weight', label: 'Weight',       placeholder: '70 kg' },
              { key: 'height', label: 'Height',       placeholder: '170 cm' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <p className="font-body text-xs text-text-muted mb-1">{label}</p>
                <Input
                  value={vitals[key]}
                  onChange={e => setVitals(v => ({ ...v, [key]: e.target.value }))}
                  placeholder={placeholder}
                  disabled={isComplete}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Diagnosis ─────────────────────────────────────────── */}
        <div className="card">
          <Label>Diagnosis</Label>
          <Textarea
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="Diagnosis / Assessment..."
            disabled={isComplete}
          />
        </div>

        {/* ── Prescriptions ─────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <Label>Prescriptions</Label>
            {!isComplete && (
              <button
                type="button"
                onClick={addRx}
                className="flex items-center gap-1.5 font-body text-xs font-bold text-crimson-500 hover:text-crimson-700 transition-colors"
              >
                <Plus size={14} /> Add Medicine
              </button>
            )}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 mb-2 px-1">
            {['Medicine', 'Dose', 'Frequency', 'Duration', ''].map((h, i) => (
              <p key={i} className={`font-body text-xs text-text-muted
                ${i === 0 ? 'col-span-4' : i === 4 ? 'col-span-1' : 'col-span-2'}`}>
                {h}
              </p>
            ))}
          </div>

          <div className="space-y-2">
            {prescriptions.map(rx => (
              <PrescriptionRow
                key={rx.id}
                rx={rx}
                onChange={data => updateRx(rx.id, data)}
                onRemove={() => removeRx(rx.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Tests Ordered ──────────────────────────────────────── */}
        <div className="card">
          <Label>Tests Ordered</Label>
          <TagInput
            tags={testsOrdered}
            onChange={setTestsOrdered}
            placeholder="Type test name and press Enter (e.g. CBC, X-Ray)"
          />
        </div>

        {/* ── Doctor Notes + Follow-up ───────────────────────────── */}
        <div className="card">
          <Label>Doctor Notes <span className="font-body text-xs normal-case text-text-muted font-normal">(private — not visible to patient)</span></Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes, observations..."
            disabled={isComplete}
          />
          <div className="mt-4">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              disabled={isComplete}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* ── Complete button ────────────────────────────────────── */}
        {!isComplete && (
          <div className="flex justify-end pb-8">
            <button
              onClick={handleComplete}
              disabled={completing || !visitId}
              className="flex items-center gap-2 px-8 py-3.5 rounded-pill bg-accent-teal text-white font-body font-bold text-sm shadow-btn hover:brightness-105 transition-all disabled:opacity-50"
            >
              {completing ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Complete Consultation
            </button>
          </div>
        )}
      </div>

      {/* History panel */}
      {showHistory && (
        <PatientHistoryPanel
          patientId={patient?.id}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}
