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
import { Field, inputCls, ErrorAlert, Spinner } from './PatientSignup'

const STEPS = ['Your Info', 'Verify Email', 'Join Clinic']

const schema = z.object({
  name:            z.string().min(2, 'Name required'),
  email:           z.string().email('Valid email required'),
  phone:           z.string().regex(/^\d{10}$/, '10-digit mobile required'),
  designation:     z.string().min(2, 'Designation required'),
  password:        z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

export default function StaffSignup() {
  const [step, setStep]             = useState(1)
  const [otp, setOtp]               = useState('')
  const [otpError, setOtpError]     = useState('')
  const [clinicCode, setClinicCode] = useState('')
  const [codeError, setCodeError]   = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [loading, setLoading]       = useState(false)
  const [apiError, setApiError]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [formData, setFormData]     = useState(null)

  const { login } = useAuth()
  const navigate  = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const startResendTimer = () => {
    setResendTimer(60)
    const iv = setInterval(() => setResendTimer(t => { if(t<=1){clearInterval(iv);return 0} return t-1 }), 1000)
  }

  const onStep1 = async (data) => {
    setLoading(true); setApiError('')
    try { await authAPI.sendOTP(data.email, true); setFormData(data); setStep(2); startResendTimer() }
    catch (err) { setApiError(err.response?.data?.error || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  const onVerifyOTP = async () => {
    if (otp.length < 6) { setOtpError('Enter all 6 digits'); return }
    setLoading(true); setOtpError('')
    try { await authAPI.verifyOTP(formData.email, otp); setStep(3) }
    catch (err) { setOtpError(err.response?.data?.error || 'Invalid or expired OTP') }
    finally { setLoading(false) }
  }

  const onSubmitCode = async () => {
    if (!/^CLIN-[A-Z0-9]{4}$/.test(clinicCode.toUpperCase())) {
      setCodeError('Format must be CLIN-XXXX'); return
    }
    setLoading(true); setCodeError('')
    try {
      const res = await authAPI.register({
        name:        formData.name,
        email:       formData.email,
        phone:       formData.phone,
        password:    formData.password,
        designation: formData.designation,
        role:        'staff',
        clinicCode:  clinicCode.toUpperCase(),
      })
      const { user, token } = res.data.data
      login(user, token)
      navigate('/pending')
    } catch (err) { setCodeError(err.response?.data?.error || 'Invalid clinic code') }
    finally { setLoading(false) }
  }

  return (
    <SignupLayout>
      <StepIndicator steps={STEPS} currentStep={step} />

      {step === 1 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Staff registration</h2>
          <p className="font-body text-sm text-text-muted mb-6">You'll need a clinic code from your admin</p>
          <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
            <Field label="Full Name" error={errors.name?.message}>
              <input {...register('name')} placeholder="Priya Sharma" className={inputCls(errors.name)} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="staff@clinic.com" className={inputCls(errors.email)} />
            </Field>
            <Field label="Mobile Number" error={errors.phone?.message}>
              <input {...register('phone')} type="tel" placeholder="9876543210" className={inputCls(errors.phone)} />
            </Field>
            <Field label="Designation" error={errors.designation?.message}>
              <input {...register('designation')} placeholder="Head Receptionist, Nurse..." className={inputCls(errors.designation)} />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <div className="relative">
                <input {...register('password')} type={showPass?'text':'password'} placeholder="Min 8 characters" className={inputCls(errors.password)+' pr-10'} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
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

      {step === 2 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Verify your email</h2>
          <p className="font-body text-sm text-text-muted mb-6">Code sent to <strong>{formData?.email}</strong></p>
          <OTPInput value={otp} onChange={setOtp} hasError={!!otpError} />
          {otpError && <p className="flex items-center justify-center gap-1 mt-3 font-body text-sm text-accent-coral"><AlertCircle size={14}/>{otpError}</p>}
          <button onClick={onVerifyOTP} disabled={loading || otp.length < 6} className="btn-primary w-full justify-center py-3 mt-6">
            {loading ? <Spinner /> : 'Verify Email'}
          </button>
          <div className="text-center mt-4">
            {resendTimer > 0
              ? <p className="font-body text-sm text-text-muted">Resend in {resendTimer}s</p>
              : <button onClick={async () => { await authAPI.sendOTP(formData.email); startResendTimer(); setOtp(''); setOtpError('') }} className="font-body text-sm text-crimson-500 font-semibold">Resend OTP</button>
            }
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Enter clinic code</h2>
          <p className="font-body text-sm text-text-muted mb-6">Get the <strong>CLIN-XXXX</strong> code from your admin</p>
          <div className="mb-4">
            <label className="font-body text-sm font-medium text-text-secondary block mb-1.5">Clinic Code</label>
            <input
              value={clinicCode}
              onChange={e => { setClinicCode(e.target.value.toUpperCase()); setCodeError('') }}
              placeholder="CLIN-4X9Z"
              maxLength={9}
              className={`w-full px-4 py-4 rounded-2xl border text-center font-display font-bold text-2xl tracking-widest outline-none transition-all ${codeError ? 'border-accent-coral bg-accent-coral/5' : 'border-cream-300 bg-cream-50 focus:border-crimson-400 focus:ring-2 focus:ring-crimson-100'}`}
            />
            {codeError && <p className="flex items-center justify-center gap-1 mt-2 font-body text-sm text-accent-coral"><AlertCircle size={14}/>{codeError}</p>}
          </div>
          <button onClick={onSubmitCode} disabled={loading || clinicCode.length < 9} className="btn-primary w-full justify-center py-3">
            {loading ? <Spinner /> : 'Request to Join Clinic'}
          </button>
        </>
      )}
    </SignupLayout>
  )
}