import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { authAPI } from '../../services/api'
import SignupLayout from '../../components/auth/SignupLayout'
import { Field, inputCls, ErrorAlert, Spinner } from './PatientSignup'

const schema = z.object({
  password:        z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
})

export default function ResetPassword() {
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [apiError, setApiError]     = useState('')
  const [success, setSuccess]       = useState(false)

  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const token          = searchParams.get('token')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  // No token in URL → invalid link
  if (!token) {
    return (
      <SignupLayout>
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-coral/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-accent-coral" />
          </div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
            Invalid Reset Link
          </h2>
          <p className="font-body text-sm text-text-muted mb-6">
            This link is invalid or has already been used. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn-primary justify-center w-full py-3">
            Request New Link
          </Link>
        </div>
      </SignupLayout>
    )
  }

  // Success state
  if (success) {
    return (
      <SignupLayout>
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-teal/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-accent-teal" />
          </div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
            Password Reset!
          </h2>
          <p className="font-body text-sm text-text-muted mb-6">
            Your password has been updated successfully. You can now sign in with your new password.
          </p>
          <Link to="/login" className="btn-primary justify-center w-full py-3">
            Sign In
          </Link>
        </div>
      </SignupLayout>
    )
  }

  const onSubmit = async ({ password }) => {
    setLoading(true)
    setApiError('')
    try {
      await authAPI.resetPassword(token, password)
      setSuccess(true)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SignupLayout>
      <h2 className="font-display font-bold text-2xl text-text-primary mb-1">
        Set new password
      </h2>
      <p className="font-body text-sm text-text-muted mb-6">
        Choose a strong password for your ClinicOS account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="New Password" error={errors.password?.message}>
          <div className="relative">
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="Min 8 characters"
              className={inputCls(errors.password) + ' pr-10'}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm New Password" error={errors.confirmPassword?.message}>
          <input
            {...register('confirmPassword')}
            type="password"
            placeholder="Re-enter password"
            className={inputCls(errors.confirmPassword)}
          />
        </Field>

        {apiError && <ErrorAlert message={apiError} />}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3.5 mt-2"
        >
          {loading ? <Spinner /> : 'Reset Password'}
        </button>
      </form>
    </SignupLayout>
  )
}