import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import SignupLayout from '../../components/auth/SignupLayout'
import StepIndicator from '../../components/auth/StepIndicator'
import OTPInput from '../../components/auth/OTPInput'

const STEPS = ['Your Info', 'Verify Email']

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Enter a valid email address'),
  phone:           z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})

export default function PatientSignup() {
  const [step, setStep]           = useState(1)
  const [otp, setOtp]             = useState('')
  const [otpError, setOtpError]   = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading]     = useState(false)
  const [apiError, setApiError]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [formData, setFormData]   = useState(null)

  const { login }  = useAuth()
  const navigate   = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  // ── Step 1: submit form → send OTP ──────────────────────────────
  const onSubmitStep1 = async (data) => {
    setLoading(true)
    setApiError('')
    try {
      await authAPI.sendOTP(data.email)
      setFormData(data)
      setStep(2)
      startResendTimer()
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify OTP → register ───────────────────────────────
  const onVerifyOTP = async () => {
    if (otp.length < 6) {
      setOtpError('Enter all 6 digits')
      return
    }
    setLoading(true)
    setOtpError('')
    try {
      await authAPI.verifyOTP(formData.email, otp)

      // OTP good → now register the user
      const res = await authAPI.register({
        name:     formData.name,
        email:    formData.email,
        phone:    formData.phone,
        password: formData.password,
        role:     'patient',
      })

      const { user, token } = res.data.data
      login(user, token)
      navigate('/patient')
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const interval = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(interval); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const handleResend = async () => {
    try {
      await authAPI.sendOTP(data.email, true)
      startResendTimer()
      setOtp('')
      setOtpError('')
    } catch (err) {
      setOtpError('Failed to resend OTP')
    }
  }

  return (
    <SignupLayout>
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* ── Step 1: Personal Info ─────────────────────────── */}
      {step === 1 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Create your account</h2>
          <p className="font-body text-sm text-text-muted mb-6">Patient account — free forever</p>

          <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-4">
            <Field label="Full Name" error={errors.name?.message}>
              <input {...register('name')} placeholder="Priya Sharma" className={inputCls(errors.name)} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="you@email.com" className={inputCls(errors.email)} />
            </Field>
            <Field label="Mobile Number" error={errors.phone?.message}>
              <input {...register('phone')} type="tel" placeholder="9876543210" className={inputCls(errors.phone)} />
            </Field>
            <p className="font-body text-xs text-text-muted -mt-2 px-1">
              💡 Use the same number you gave at the clinic — this links your account to your visit records
            </p>
            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" className={inputCls(errors.password) + ' pr-10'} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" error={errors.confirmPassword?.message}>
              <input {...register('confirmPassword')} type="password" placeholder="Re-enter password" className={inputCls(errors.confirmPassword)} />
            </Field>

            {apiError && <ErrorAlert message={apiError} />}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <Spinner /> : 'Continue'}
            </button>
          </form>
        </>
      )}

      {/* ── Step 2: OTP Verification ──────────────────────── */}
      {step === 2 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Verify your email</h2>
          <p className="font-body text-sm text-text-muted mb-6">
            We sent a 6-digit code to <strong className="text-text-secondary">{formData?.email}</strong>
          </p>

          <OTPInput value={otp} onChange={setOtp} hasError={!!otpError} />

          {otpError && (
            <p className="flex items-center justify-center gap-1 mt-3 font-body text-sm text-accent-coral">
              <AlertCircle size={14} />
              {otpError}
            </p>
          )}

          <button
            onClick={onVerifyOTP}
            disabled={loading || otp.length < 6}
            className="btn-primary w-full justify-center py-3 mt-6"
          >
            {loading ? <Spinner /> : 'Verify & Create Account'}
          </button>

          <div className="text-center mt-4">
            {resendTimer > 0 ? (
              <p className="font-body text-sm text-text-muted">Resend in {resendTimer}s</p>
            ) : (
              <button onClick={handleResend} className="font-body text-sm text-crimson-500 hover:text-crimson-700 font-semibold">
                Resend OTP
              </button>
            )}
          </div>
        </>
      )}
    </SignupLayout>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
export function Field({ label, error, children }) {
  return (
    <div>
      <label className="font-body text-sm font-medium text-text-secondary block mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 mt-1 font-body text-xs text-accent-coral">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

export function inputCls(error) {
  return `w-full px-4 py-3 rounded-2xl border font-body text-sm text-text-primary bg-cream-50 outline-none transition-all placeholder:text-text-muted focus:bg-white focus:border-crimson-400 focus:ring-2 focus:ring-crimson-100 ${error ? 'border-accent-coral ring-2 ring-accent-coral/20' : 'border-cream-300'}`
}

export function ErrorAlert({ message }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-accent-coral/10 border border-accent-coral/30 rounded-2xl">
      <AlertCircle size={16} className="text-accent-coral flex-shrink-0" />
      <p className="font-body text-sm text-accent-coral">{message}</p>
    </div>
  )
}

export function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
}