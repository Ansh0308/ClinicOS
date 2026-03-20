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

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    adminAPI.getClinic()
      .then(res => {
        const c = res.data.data.clinic
        setClinicCode(c.clinicCode)
        reset({
          name:      c.name      || '',
          address:   c.address   || '',
          phone:     c.phone     || '',
          specialty: c.specialty || '',
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const onSubmit = async (data) => {
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
        <p className="font-body text-text-muted mt-1">Update your clinic's information</p>
      </div>

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Clinic Name" error={errors.name?.message}>
            <input {...register('name')} className={inputCls(errors.name)} />
          </Field>
          <Field label="Address" error={errors.address?.message}>
            <input {...register('address')} placeholder="123, MG Road, Mumbai" className={inputCls(errors.address)} />
          </Field>
          <Field label="Phone Number" error={errors.phone?.message}>
            <input {...register('phone')} type="tel" placeholder="0222345678" className={inputCls(errors.phone)} />
          </Field>
          <Field label="Specialty" error={errors.specialty?.message}>
            <input {...register('specialty')} placeholder="General Practice, Pediatrics..." className={inputCls(errors.specialty)} />
          </Field>

          {apiError && <ErrorAlert message={apiError} />}

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
    </div>
  )
}