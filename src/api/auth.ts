import { apiFetch } from './client'

export const login = (email: string, password: string): Promise<void> =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const logout = (): Promise<void> =>
  apiFetch('/api/auth/logout', { method: 'POST' })

export const getMe = (): Promise<{ email: string }> =>
  apiFetch('/api/auth/me')
