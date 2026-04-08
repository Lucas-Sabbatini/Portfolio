import { apiFetch } from './client'

export interface LoginResponse {
  message: 'ok' | 'mfa_required'
}

export const login = (email: string, password: string): Promise<LoginResponse> =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const verifyMfa = (code: string): Promise<{ message: string }> =>
  apiFetch('/api/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })

export interface MfaSetupResponse {
  qr_code: string
  secret: string
}

export const setupMfa = (): Promise<MfaSetupResponse> =>
  apiFetch('/api/auth/mfa/setup', { method: 'POST' })

export const confirmMfa = (secret: string, code: string): Promise<{ message: string }> =>
  apiFetch('/api/auth/mfa/confirm', {
    method: 'POST',
    body: JSON.stringify({ secret, code }),
  })

export const logout = (): Promise<void> =>
  apiFetch('/api/auth/logout', { method: 'POST' })

export const getMe = (): Promise<{ email: string }> =>
  apiFetch('/api/auth/me')
