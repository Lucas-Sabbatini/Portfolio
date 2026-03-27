import { apiFetch } from './client'

export const subscribe = (email: string): Promise<void> =>
  apiFetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export interface Subscriber {
  email: string
  subscribed_at: string
}

export const fetchSubscribers = (): Promise<Subscriber[]> =>
  apiFetch('/api/newsletter/subscribers')
