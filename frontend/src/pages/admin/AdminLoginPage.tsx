import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, getMe } from '../../api/auth'
import { ApiError } from '../../api/client'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getMe().then(() => navigate('/admin/posts')).catch(() => {})
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
      navigate('/admin/posts')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid credentials')
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="glass-card p-10 rounded-[2.5rem] w-full max-w-sm space-y-8">
        <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-3 rounded-full disabled:opacity-60"
          >
            {submitting ? 'Entering…' : 'Enter'}
          </button>
        </form>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </main>
  )
}
