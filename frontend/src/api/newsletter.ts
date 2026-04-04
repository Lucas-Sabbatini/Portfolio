import { apiFetch } from './client'
import type { Subscriber } from '@/types/newsletter'

export type { Subscriber }

export const subscribe = (email: string): Promise<void> =>
  apiFetch('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const fetchSubscribers = (): Promise<Subscriber[]> =>
  apiFetch('/api/newsletter/subscribers')
