import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { patientPortalAPI } from '../../services/api'
import { User, Bell, Check, AlertCircle } from 'lucide-react'

export default function PatientProfile() {
  const { user, login }         = useAuth()
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [err, setErr]           = useState('')

  const [form, setForm] = useState({
    name: '', dob: '', gender: '', optInMsg: true,
  })

  useEffect(() => {
    patientPortalAPI.getProfile()
      .then(res => {
        const { user: u, patient } = res.data.data
        setProfile({ user: u, patient })
        setForm({
          name:     u?.name     || '',
          dob:      patient?.dob    || '',
          gender:   patient?.gender || '',
          optInMsg: patient?.optInMsg !== false,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setErr('')
    try {
      await patientPortalAPI.updateProfile(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Update auth context name
      const token = localStorage.getItem('clinicos_token')
      login({ ...user, name: form.name }, token)
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-cream-200 rounded w-1/3" />
        <div className="card h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">My Profile</h1>
        <p className="font-body text-sm text-text-muted">Manage your personal details</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-crimson-500 rounded-3xl flex items-center justify-center">
          <span className="font-display font-bold text-white text-2xl">
            {form.name?.charAt(0) || user?.name?.charAt(0) || 'P'}
          </span>
        </div>
        <div>
          <p className="font-body font-bold text-text-primary">{form.name || user?.name}</p>
          <p className="font-body text-sm text-text-muted">{profile?.user?.email}</p>
        </div>
      </div>

      {/* Personal info */}
      <div className="card space-y-4">
        <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <User size={13} /> Personal Information
        </p>

        <div>
          <label className="font-body text-xs font-medium text-text-muted block mb-1">Full Name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Your full name"
            className="w-full px-3 py-2.5 rounded-2xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 focus:ring-2 focus:ring-crimson-100 transition-all"
          />
        </div>

        <div>
          <label className="font-body text-xs font-medium text-text-muted block mb-1">Date of Birth</label>
          <input
            type="date"
            value={form.dob}
            onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-2xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 transition-all"
          />
        </div>

        <div>
          <label className="font-body text-xs font-medium text-text-muted block mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-2xl border border-cream-300 bg-cream-50 font-body text-sm text-text-primary focus:outline-none focus:border-crimson-400 transition-all"
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="font-body text-xs font-medium text-text-muted block mb-1">Phone</label>
          <input
            value={profile?.patient?.phone || profile?.user?.phone || ''}
            readOnly
            className="w-full px-3 py-2.5 rounded-2xl border border-cream-200 bg-cream-100 font-body text-sm text-text-muted"
          />
        </div>

        {err && (
          <div className="flex items-center gap-2 text-accent-coral font-body text-sm">
            <AlertCircle size={14} />
            {err}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full justify-center py-3 text-sm"
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : saved
            ? <><Check size={15} /> Saved!</>
            : 'Save Changes'
          }
        </button>
      </div>

      {/* Notification preferences */}
      <div className="card space-y-3">
        <p className="font-body text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
          <Bell size={13} /> Notification Preferences
        </p>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="font-body text-sm font-semibold text-text-primary">
              WhatsApp &amp; SMS
            </p>
            <p className="font-body text-xs text-text-muted">
              Queue updates, appointment reminders, bill receipts
            </p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, optInMsg: !f.optInMsg }))}
            className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0
              ${form.optInMsg ? 'bg-accent-teal' : 'bg-cream-300'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
              ${form.optInMsg ? 'left-5' : 'left-0.5'}`}
            />
          </button>
        </div>

        <p className="font-body text-xs text-text-muted">
          Turning this off means you won't receive queue notifications or bill receipts via message.
        </p>
      </div>
    </div>
  )
}
