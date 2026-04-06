export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export function resolveImageUrl(url: string): string {
  return url.startsWith('/') ? `${BASE}${url}` : url
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const isFormData = init?.body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: isFormData
      ? { ...init?.headers }
      : { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(res.status, body.detail ?? 'Unknown error')
  }
  return res.json()
}
