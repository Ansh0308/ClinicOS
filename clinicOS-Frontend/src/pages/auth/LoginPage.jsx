import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../services/api'
import SignupLayout from '../../components/auth/SignupLayout'
import { Field, inputCls, ErrorAlert, Spinner } from './PatientSignup'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password required'),
})

const DASHBOARD = {
  patient: '/patient',
  admin:   '/admin',
  doctor:  '/doctor',
  staff:   '/reception',
}

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')

  const { login }  = useAuth()
  const navigate   = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    setApiError('')
    try {
      const res = await authAPI.login(email, password)
      const { user, token } = res.data.data

      login(user, token)

      // Doctor/staff still pending → hold them on pending screen
      if (['doctor', 'staff'].includes(user.role) && user.status === 'pending') {
        navigate('/pending')
        return
      }

      if (user.status === 'rejected') {
        setApiError('Your registration was not approved. Contact your clinic admin.')
        return
      }

      navigate(DASHBOARD[user.role] || '/')
    } catch (err) {
      setApiError(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SignupLayout showBack={false}>
      <h2 className="font-display font-bold text-2xl text-text-primary mb-1">Welcome back</h2>
      <p className="font-body text-sm text-text-muted mb-6">Sign in to your ClinicOS account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="you@clinic.com"
            autoComplete="email"
            className={inputCls(errors.email)}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              placeholder="Your password"
              autoComplete="current-password"
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

        {apiError && <ErrorAlert message={apiError} />}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-3.5 mt-2"
        >
          {loading ? <Spinner /> : 'Sign In'}
        </button>
      </form>

      <div className="flex items-center justify-between mt-5">
        <p className="font-body text-sm text-text-muted">
          New to ClinicOS?{' '}
          <Link to="/signup" className="text-crimson-500 font-semibold hover:text-crimson-700">
            Create account
          </Link>
        </p>
        <Link
  to="/forgot-password"
  className="font-body text-sm text-text-muted hover:text-crimson-500 transition-colors"
>
  Forgot password?
</Link>
      </div>
    </SignupLayout>
  )
}