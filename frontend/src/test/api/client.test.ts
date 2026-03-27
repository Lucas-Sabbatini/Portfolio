import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { apiFetch, ApiError } from '../../api/client'

const BASE = 'http://localhost:8000'

describe('apiFetch', () => {
  it('throws ApiError on non-2xx response', async () => {
    server.use(
      http.get(`${BASE}/api/test`, () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 })
      )
    )
    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      status: 404,
      message: 'Not found',
    })
    const err = await apiFetch('/api/test').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(404)
  })

  it('returns parsed JSON on 2xx', async () => {
    server.use(
      http.get(`${BASE}/api/test-ok`, () =>
        HttpResponse.json({ ok: true }, { status: 200 })
      )
    )
    const data = await apiFetch<{ ok: boolean }>('/api/test-ok')
    expect(data).toEqual({ ok: true })
  })
})
