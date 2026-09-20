import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { useSelector } from 'react-redux'
import { useAuth } from '../hook/useAuth'
import { AuthLayout, Field, SubmitButton } from './AuthLayout'

const linkClass =
  'font-bold text-[#2B5BC0] underline underline-offset-4 transition-colors hover:text-[#E0472F]'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const user = useSelector((state) => state.auth.user)
  const loading = useSelector((state) => state.auth.loading)

  const { handleLogin } = useAuth()
  const navigate = useNavigate()

  const submitForm = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await handleLogin({ email, password })
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && user) {
    return <Navigate to="/" replace />
  } 

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Sign in to give your agent its next task."
      footer={
        <>
          New to QueryPilot?{' '}
          <Link to="/register" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submitForm} className="space-y-7">
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Field
          id="password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#2B5BC0] hover:text-[#E0472F]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        />

        <div className="pt-2">
          <SubmitButton loading={submitting} label="Sign in" loadingLabel="Signing in…" />
        </div>
      </form>
    </AuthLayout>
  )
}

export default Login