import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Mock IntersectionObserver (not available in jsdom)
;(globalThis as unknown as Record<string, unknown>).IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  takeRecords() { return [] }
} as unknown as typeof IntersectionObserver

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
