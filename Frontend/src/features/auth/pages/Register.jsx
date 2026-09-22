import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hook/useAuth'
import { AuthLayout, Field, SubmitButton } from './AuthLayout'

const linkClass =
  'font-semibold text-[#f2f0ea] underline underline-offset-4 decoration-[#e2402f]/50 transition-colors hover:text-[#e2402f]'

// 0-4: length, mixed case, a number, a symbol
const scorePassword = (pw) => {
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const LEVELS = ['Weak', 'Weak', 'Fair', 'Good', 'Strong']

const Register = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')

  const { handleRegister } = useAuth()
  const navigate = useNavigate()

  const score = scorePassword(password)

  const submitForm = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setNotice('')

    const result = await handleRegister({ username, email, password })

    setSubmitting(false)

    if (result.success) {
      setNotice('Account created — check your email for a verification link, then sign in.')
      setTimeout(() => navigate('/login'), 2200)
    } else {
      setFormError(result.message)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Takes a minute. Then give your agent its first task."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className={linkClass}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submitForm} className="space-y-7">
        <Field
          id="username"
          label="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Pick a username"
          autoComplete="username"
        />

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
          placeholder="Create a password"
          autoComplete="new-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              className="qp-mono absolute right-0 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-[0.1em] text-[#f2f0ea]/50 hover:text-[#e2402f]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        >
          {/* strength meter: dim red while weak, full red once it is strong */}
          <div className="mt-3 flex items-center gap-3 pl-[96px]">
            <div className="flex flex-1 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-[3px] flex-1 transition-colors duration-300 ${
                    i <= score ? (score <= 2 ? 'bg-[#e2402f]/45' : 'bg-[#e2402f]') : 'bg-[#262626]'
                  }`}
                />
              ))}
            </div>
            <span className="qp-mono w-28 text-right text-[10.5px] uppercase tracking-[0.08em] text-[#f2f0ea]/40" aria-live="polite">
              {password ? LEVELS[score] : 'Use 8+ characters'}
            </span>
          </div>
        </Field>

        {formError && (
          <p className="qp-mono text-[12px] leading-relaxed text-[#e2402f]">{formError}</p>
        )}
        {notice && (
          <p className="qp-mono text-[12px] leading-relaxed text-[#f2f0ea]/70">{notice}</p>
        )}

        <div className="pt-2">
          <SubmitButton loading={submitting} label="Create account" loadingLabel="Creating account…" />
        </div>
      </form>
    </AuthLayout>
  )
}

export default Register