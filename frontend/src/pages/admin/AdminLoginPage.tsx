import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, verifyMfa, getMe } from '../../api/auth'
import { ApiError } from '../../api/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getMe().then(() => navigate('/admin/posts')).catch(() => {})
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await login(email, password)
      if (res.message === 'mfa_required') {
        setStep('mfa')
      } else {
        navigate('/admin/posts')
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Invalid credentials')
        else if (err.status === 403) setError('Account temporarily locked. Try again later.')
        else if (err.status === 429) setError('Too many attempts. Try again in a minute.')
        else setError('Something went wrong.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await verifyMfa(mfaCode)
      navigate('/admin/posts')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid code. Please try again.')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors'
  const buttonClass =
    'w-full bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-3 rounded-full disabled:opacity-60'

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-sm space-y-8">
        <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Admin</h1>

        {step === 'credentials' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
            <button type="submit" disabled={submitting} className={buttonClass}>
              {submitting ? 'Entering\u2026' : 'Enter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfa} className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Enter the 6-digit code from your authenticator app.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
              className={`${inputClass} text-center tracking-[0.5em] font-mono text-lg`}
            />
            <button type="submit" disabled={submitting || mfaCode.length !== 6} className={buttonClass}>
              {submitting ? 'Verifying\u2026' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('credentials'); setMfaCode(''); setError('') }}
              className="w-full text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors py-2"
            >
              Back to login
            </button>
          </form>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </main>
  )
}
