import { useState } from 'react'
import { setupMfa, confirmMfa, type MfaSetupResponse } from '../../api/auth'

export default function AdminSecurityPage() {
  const [mfaData, setMfaData] = useState<MfaSetupResponse | null>(null)
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'idle' | 'confirming' | 'done'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSetup = async () => {
    setSubmitting(true)
    setError('')
    try {
      const data = await setupMfa()
      setMfaData(data)
      setStep('confirming')
    } catch {
      setError('Failed to generate MFA setup. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mfaData) return
    setError('')
    setSubmitting(true)
    try {
      await confirmMfa(mfaData.secret, code)
      setStep('done')
    } catch {
      setError('Invalid code. Make sure your authenticator app is synced and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-full px-5 py-3 text-sm outline-none focus:border-primary/40 transition-colors'
  const buttonClass =
    'bg-primary text-on-primary font-bold tracking-wider text-[10px] uppercase px-6 py-3 rounded-full disabled:opacity-60'

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="font-headline font-extrabold text-3xl tracking-tighter">Security</h1>

      <section className="glass-card p-8 rounded-3xl space-y-6">
        <h2 className="font-bold text-lg">Two-Factor Authentication</h2>

        {step === 'done' ? (
          <div className="space-y-3">
            <p className="text-green-400 text-sm font-medium">
              MFA has been enabled successfully.
            </p>
            <p className="text-sm text-on-surface-variant">
              You will now be asked for a verification code each time you log in.
            </p>
          </div>
        ) : step === 'confirming' && mfaData ? (
          <form onSubmit={handleConfirm} className="space-y-6">
            <p className="text-sm text-on-surface-variant">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.),
              then enter the 6-digit code below to confirm.
            </p>

            <div className="flex justify-center">
              <img
                src={`data:image/png;base64,${mfaData.qr_code}`}
                alt="MFA QR Code"
                className="w-48 h-48 rounded-xl bg-white p-2"
              />
            </div>

            <details className="text-xs text-on-surface-variant">
              <summary className="cursor-pointer hover:text-primary transition-colors">
                Can't scan? Copy the secret manually
              </summary>
              <code className="block mt-2 p-3 bg-white/5 rounded-xl break-all select-all">
                {mfaData.secret}
              </code>
            </details>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
              autoFocus
              className={`${inputClass} text-center tracking-[0.5em] font-mono text-lg`}
            />

            <button
              type="submit"
              disabled={code.length !== 6 || submitting}
              className={buttonClass}
            >
              {submitting ? 'Verifying\u2026' : 'Confirm & Enable MFA'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-on-surface-variant">
              Add an extra layer of security to your account by requiring a verification code
              from an authenticator app when you log in.
            </p>
            <button
              onClick={handleSetup}
              disabled={submitting}
              className={buttonClass}
            >
              {submitting ? 'Setting up\u2026' : 'Set Up MFA'}
            </button>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </section>
    </div>
  )
}
