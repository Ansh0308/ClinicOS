import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import SignupLayout from '../../components/auth/SignupLayout'
import StepIndicator from '../../components/auth/StepIndicator'
import OTPInput from '../../components/auth/OTPInput'
import { Field, inputCls, ErrorAlert, Spinner } from './PatientSignup'

const STEPS = ['Your Info', 'Verify Email', 'Clinic Details']

const personalSchema = z.object({
  name:            z.string().min(2, 'Name required'),
  email:           z.string().email('Valid email required'),
  phone:           z.string().regex(/^\d{10}$/, '10-digit mobile required'),
  password:        z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword']
})

const clinicSchema = z.object({
  clinicName:    z.string().min(2, 'Clinic name required'),
  clinicAddress: z.string().min(5, 'Address required'),
  clinicPhone:   z.string().regex(/^\d{10}$/, '10-digit phone required'),
  specialty:     z.string().min(2, 'Specialty required'),
})

export default function AdminSignup() {
  const [step, setStep]         = useState(1)
  const [otp, setOtp]           = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [personalData, setPersonalData] = useState(null)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const personalForm = useForm({ resolver: zodResolver(personalSchema) })
  const clinicForm   = useForm({ resolver: zodResolver(clinicSchema) })

  // Step 1 → send OTP
  const onStep1 = async (data) => {
    setLoading(true)
    setApiError('')
    try {
      await authAPI.sendOTP(data.email, true)
      setPersonalData(data)
      setStep(2)
      startResendTimer()
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → verify OTP
  const onVerifyOTP = async () => {
    if (otp.length < 6) { setOtpError('Enter all 6 digits'); return }
    setLoading(true)
    setOtpError('')
    try {
      await authAPI.verifyOTP(personalData.email, otp)
      setStep(3)
    } catch (err) {
      setOtpError(err.response?.data?.error || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  // Step 3 → register with clinic data
  const onStep3 = async (data) => {
    setLoading(true)
    setApiError('')
    try {
      const res = await authAPI.register({
        name:     personalData.name,
        email:    personalData.email,
        phone:    personalData.phone,
        password: personalData.password,
        role:     'admin',
        clinicData: {
          name:      data.clinicName,
          address:   data.clinicAddress,
          phone:     data.clinicPhone,
          specialty: data.specialty,
        },
      })
      const { user, token } = res.data.data
      login(user, token)
      navigate('/admin')
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const startResendTimer = () => {
    setResendTimer(60)
    const iv = setInterval(() => setResendTimer(t => { if (t<=1){clearInterval(iv);return 0} return t-1 }), 1000)
  }

  return (
    <SignupLayout>
      <StepIndicator steps={STEPS} currentStep={step} />

      {/* Step 1 */}
      {step === 1 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Create admin account</h2>
          <p className="font-body text-sm text-text-muted mb-6">You'll register your clinic in the next step</p>
          <form onSubmit={personalForm.handleSubmit(onStep1)} className="space-y-4">
            <Field label="Full Name" error={personalForm.formState.errors.name?.message}>
              <input {...personalForm.register('name')} placeholder="Rajesh Kumar" className={inputCls(personalForm.formState.errors.name)} />
            </Field>
            <Field label="Email" error={personalForm.formState.errors.email?.message}>
              <input {...personalForm.register('email')} type="email" placeholder="admin@clinic.com" className={inputCls(personalForm.formState.errors.email)} />
            </Field>
            <Field label="Mobile Number" error={personalForm.formState.errors.phone?.message}>
              <input {...personalForm.register('phone')} type="tel" placeholder="9876543210" className={inputCls(personalForm.formState.errors.phone)} />
            </Field>
            <Field label="Password" error={personalForm.formState.errors.password?.message}>
              <div className="relative">
                <input {...personalForm.register('password')} type={showPass?'text':'password'} placeholder="Min 8 characters" className={inputCls(personalForm.formState.errors.password) + ' pr-10'} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" error={personalForm.formState.errors.confirmPassword?.message}>
              <input {...personalForm.register('confirmPassword')} type="password" placeholder="Re-enter password" className={inputCls(personalForm.formState.errors.confirmPassword)} />
            </Field>
            {apiError && <ErrorAlert message={apiError} />}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <Spinner /> : 'Continue'}
            </button>
          </form>
        </>
      )}

      {/* Step 2 — OTP */}
      {step === 2 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Verify your email</h2>
          <p className="font-body text-sm text-text-muted mb-6">
            Code sent to <strong>{personalData?.email}</strong>
          </p>
          <OTPInput value={otp} onChange={setOtp} hasError={!!otpError} />
          {otpError && <p className="flex items-center justify-center gap-1 mt-3 font-body text-sm text-accent-coral"><AlertCircle size={14}/>{otpError}</p>}
          <button onClick={onVerifyOTP} disabled={loading || otp.length < 6} className="btn-primary w-full justify-center py-3 mt-6">
            {loading ? <Spinner /> : 'Verify Email'}
          </button>
          <div className="text-center mt-4">
            {resendTimer > 0
              ? <p className="font-body text-sm text-text-muted">Resend in {resendTimer}s</p>
              : <button onClick={async () => { await authAPI.sendOTP(personalData.email); startResendTimer(); setOtp(''); setOtpError('') }} className="font-body text-sm text-crimson-500 font-semibold">Resend OTP</button>
            }
          </div>
        </>
      )}

      {/* Step 3 — Clinic Details */}
      {step === 3 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Register your clinic</h2>
          <p className="font-body text-sm text-text-muted mb-6">This creates your clinic workspace</p>
          <form onSubmit={clinicForm.handleSubmit(onStep3)} className="space-y-4">
            <Field label="Clinic Name" error={clinicForm.formState.errors.clinicName?.message}>
              <input {...clinicForm.register('clinicName')} placeholder="Dr. Sharma's Clinic" className={inputCls(clinicForm.formState.errors.clinicName)} />
            </Field>
            <Field label="Address" error={clinicForm.formState.errors.clinicAddress?.message}>
              <input {...clinicForm.register('clinicAddress')} placeholder="123, MG Road, Mumbai" className={inputCls(clinicForm.formState.errors.clinicAddress)} />
            </Field>
            <Field label="Clinic Phone" error={clinicForm.formState.errors.clinicPhone?.message}>
              <input {...clinicForm.register('clinicPhone')} type="tel" placeholder="0222345678" className={inputCls(clinicForm.formState.errors.clinicPhone)} />
            </Field>
            <Field label="Specialty" error={clinicForm.formState.errors.specialty?.message}>
              <input {...clinicForm.register('specialty')} placeholder="General Practice, Pediatrics, Dermatology..." className={inputCls(clinicForm.formState.errors.specialty)} />
            </Field>
            {apiError && <ErrorAlert message={apiError} />}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <Spinner /> : 'Create Clinic & Continue'}
            </button>
          </form>
        </>
      )}
    </SignupLayout>
  )
}