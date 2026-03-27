import { useState, useEffect } from 'react'
import type { Subscriber } from '../../api/newsletter'
import { fetchSubscribers } from '../../api/newsletter'

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscribers()
      .then(setSubscribers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="font-headline font-extrabold text-3xl tracking-tighter">
        Newsletter — {subscribers.length} subscribers
      </h1>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {loading ? (
        <p className="text-on-surface-variant text-sm">Loading…</p>
      ) : (
        <div className="glass-card rounded-[2rem] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Email</th>
                <th className="text-left p-5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((sub) => (
                <tr key={sub.email} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-5 text-on-surface">{sub.email}</td>
                  <td className="p-5 text-on-surface-variant">
                    {new Date(sub.subscribed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
