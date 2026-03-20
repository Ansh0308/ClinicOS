import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck } from 'lucide-react'
import { authAPI } from '../../services/api'
import SignupLayout from '../../components/auth/SignupLayout'
import { Field, inputCls, ErrorAlert, Spinner } from './PatientSignup'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

export default function ForgotPassword() {
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')
  const [sent, setSent]         = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async ({ email }) => {
    setLoading(true)
    setApiError('')
    try {
      await authAPI.forgotPassword(email)
      setSentEmail(email)
      setSent(true)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ─────────────────────────────────────────────
  if (sent) {
    return (
      <SignupLayout>
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-teal/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <MailCheck size={32} className="text-accent-teal" />
          </div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-2">
            Check your inbox
          </h2>
          <p className="font-body text-sm text-text-muted mb-2">
            We sent a password reset link to:
          </p>
          <p className="font-body font-semibold text-text-secondary mb-6">
            {sentEmail}
          </p>
          <p className="font-body text-xs text-text-muted mb-8">
            The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <Link
            to="/login"
            className="btn-primary justify-center w-full py-3"
          >
            Back to Sign In
          </Link>
        </div>
      </SignupLayout>
    )
  }

  // ── Form state ────────────────────────────────────────────────
  return (
    <SignupLayout>
      <h2 className="font-display font-bold text-2xl text-text-primary mb-1">
        Forgot password?
      </h2>
      <p className="font-body text-sm text-text-muted mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email address" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="you@clinic.com"
            autoFocus
            className={inputCls(errors.email)}
          />
        </Field>

        {apiError && <ErrorAlert message={apiError} />}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3.5 mt-2"
        >
          {loading ? <Spinner /> : 'Send Reset Link'}
        </button>
      </form>

      <p className="font-body text-sm text-center text-text-muted mt-6">
        Remembered it?{' '}
        <Link to="/login" className="text-crimson-500 font-semibold hover:text-crimson-700">
          Sign in
        </Link>
      </p>
    </SignupLayout>
  )
}