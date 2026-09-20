import React, { useState } from 'react'
import { Link } from 'react-router'
import { AuthLayout, Field, SubmitButton } from './AuthLayout'

const linkClass =
  'font-bold text-[#2B5BC0] underline underline-offset-4 transition-colors hover:text-[#E0472F]'

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

  const score = scorePassword(password)

  const submitForm = (event) => {
    event.preventDefault()

    const payload = {
      username,
      email,
      password,
    }

    // TODO: call your register handler here once the backend route is wired
    console.log('Register payload:', payload)
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
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-[#2B5BC0] hover:text-[#E0472F]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
        >
          {/* strength meter: red while weak, blue once it is good */}
          <div className="mt-3 flex items-center gap-3 pl-[96px]">
            <div className="flex flex-1 gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-[4px] flex-1 transition-colors duration-300 ${
                    i <= score ? (score <= 2 ? 'bg-[#E0472F]' : 'bg-[#2B5BC0]') : 'bg-[#10202F]/15'
                  }`}
                />
              ))}
            </div>
            <span className="w-28 text-right text-[12px] text-[#10202F]/60" aria-live="polite">
              {password ? LEVELS[score] : 'Use 8+ characters'}
            </span>
          </div>
        </Field>

        <div className="pt-2">
          <SubmitButton loading={false} label="Create account" loadingLabel="Creating account…" />
        </div>
      </form>
    </AuthLayout>
  )
}

export default Register