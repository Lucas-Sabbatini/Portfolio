import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import HeroSection from '../../components/HeroSection'

const BASE = 'http://localhost:8000'

describe('HeroSection', () => {
  it('renders content from API', async () => {
    render(<HeroSection />)
    await waitFor(() => {
      // The headline is split across two text nodes inside h1
      const h1 = document.querySelector('h1')
      expect(h1?.textContent).toContain('Building')
      expect(h1?.textContent).toContain('at scale')
    })
  })

  it('renders skeleton while loading', () => {
    server.use(
      http.get(`${BASE}/api/content/hero`, () => new Promise(() => {})) // never resolves
    )
    render(<HeroSection />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
