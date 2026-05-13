import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Copy, Check, Save } from 'lucide-react'
import { adminAPI } from '../../services/api'
import { Field, inputCls, ErrorAlert } from '../auth/PatientSignup'

const schema = z.object({
  name:      z.string().min(2, 'Clinic name required'),
  address:   z.string().optional(),
  phone:     z.string().optional(),
  specialty: z.string().optional(),
})

export default function ClinicSettings() {
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [apiError, setApiError] = useState('')
  const [copied, setCopied]     = useState(false)
  const [clinicCode, setClinicCode] = useState('')

  const [tabValue, setTabValue] = useState(0)
  const [integrationsSaved, setIntegrationsSaved] = useState(false)
  const [integrationsSaving, setIntegrationsSaving] = useState(false)

  const { register: regClinic, handleSubmit: handleClinicSubmit, formState: { errors: clinicErrs }, reset: resetClinic } = useForm({
    resolver: zodResolver(schema)
  })

  const { register: regInt, handleSubmit: handleIntSubmit, reset: resetInt } = useForm()

  useEffect(() => {
    adminAPI.getClinic()
      .then(res => {
        const c = res.data.data.clinic
        setClinicCode(c.clinicCode)
        resetClinic({
          name:      c.name      || '',
          address:   c.address   || '',
          phone:     c.phone     || '',
          specialty: c.specialty || '',
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
      
    adminAPI.getIntegrations()
      .then(res => {
        const s = res.data.data.settings
        resetInt({
          razorpayKeyId: s.razorpayKeyId || '',
          razorpayKeySecret: s.razorpayKeySecret || '',
          brevoApiKey: s.brevoApiKey || '',
        })
      })
      .catch(console.error)
  }, [])

  const onClinicSubmit = async (data) => {
    setSaving(true)
    setApiError('')
    try {
      await adminAPI.updateClinic(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const onIntSubmit = async (data) => {
    setIntegrationsSaving(true)
    setApiError('')
    try {
      await adminAPI.updateIntegrations(data)
      setIntegrationsSaved(true)
      setTimeout(() => setIntegrationsSaved(false), 3000)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save integrations. Try again.')
    } finally {
      setIntegrationsSaving(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(clinicCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-cream-200 rounded w-1/3" />
        <div className="card h-64" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl text-text-primary">Clinic Settings</h1>
        <p className="font-body text-text-muted mt-1">Update your clinic's information and integrations</p>
      </div>

      <div className="flex space-x-4 border-b border-cream-200 mb-6">
        <button
          className={`pb-2 px-2 font-body font-semibold ${tabValue === 0 ? 'text-crimson-700 border-b-2 border-crimson-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTabValue(0)}
        >
          General
        </button>
        <button
          className={`pb-2 px-2 font-body font-semibold ${tabValue === 1 ? 'text-crimson-700 border-b-2 border-crimson-700' : 'text-text-muted hover:text-text-primary'}`}
          onClick={() => setTabValue(1)}
        >
          Integrations
        </button>
      </div>

      {apiError && <div className="mb-4"><ErrorAlert message={apiError} /></div>}

      {tabValue === 0 && (
        <>
          {/* Clinic code box */}
          <div className="card bg-crimson-50 border-2 border-crimson-200 mb-6">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-crimson-500 mb-2">
              Clinic Join Code
            </p>
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-3xl text-crimson-800 tracking-widest">
                {clinicCode}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-crimson-800 text-white font-body text-sm font-semibold hover:bg-crimson-700 transition-all"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="font-body text-xs text-text-muted mt-2">
              Share this code with your doctors and staff when they sign up
            </p>
          </div>

          {/* Edit form */}
          <div className="card">
            <form onSubmit={handleClinicSubmit(onClinicSubmit)} className="space-y-4">
              <Field label="Clinic Name" error={clinicErrs.name?.message}>
                <input {...regClinic('name')} className={inputCls(clinicErrs.name)} />
              </Field>
              <Field label="Address" error={clinicErrs.address?.message}>
                <input {...regClinic('address')} placeholder="123, MG Road, Mumbai" className={inputCls(clinicErrs.address)} />
              </Field>
              <Field label="Phone Number" error={clinicErrs.phone?.message}>
                <input {...regClinic('phone')} type="tel" placeholder="0222345678" className={inputCls(clinicErrs.phone)} />
              </Field>
              <Field label="Specialty" error={clinicErrs.specialty?.message}>
                <input {...regClinic('specialty')} placeholder="General Practice, Pediatrics..." className={inputCls(clinicErrs.specialty)} />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary py-3 px-8 flex items-center gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saved ? (
                  <><Check size={16} /> Saved!</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {tabValue === 1 && (
        <div className="card">
          <h2 className="font-display font-bold text-xl text-text-primary mb-4">API Integrations</h2>
          <form onSubmit={handleIntSubmit(onIntSubmit)} className="space-y-4">
            <Field label="Razorpay Key ID">
              <input {...regInt('razorpayKeyId')} placeholder="rzp_test_..." className={inputCls()} />
            </Field>
            <Field label="Razorpay Key Secret">
              <input {...regInt('razorpayKeySecret')} type="password" placeholder="Enter new secret to update..." className={inputCls()} />
            </Field>
            <div className="border-t border-cream-200 my-4" />
            <Field label="Brevo API Key (Emails)">
              <input {...regInt('brevoApiKey')} type="password" placeholder="Enter new key to update..." className={inputCls()} />
            </Field>

            <button
              type="submit"
              disabled={integrationsSaving}
              className="btn-primary py-3 px-8 flex items-center gap-2 mt-4"
            >
              {integrationsSaving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : integrationsSaved ? (
                <><Check size={16} /> Saved!</>
              ) : (
                <><Save size={16} /> Save Integrations</>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}