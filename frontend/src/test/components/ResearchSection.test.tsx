import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { server } from '../mocks/server'
import ResearchSection from '../../components/ResearchSection'

const BASE = 'http://localhost:8000'

describe('ResearchSection', () => {
  it('renders section label', async () => {
    render(<ResearchSection />)
    expect(screen.getByText('03 / Research')).toBeInTheDocument()
  })

  it('renders title, body, and stats from API', async () => {
    render(<ResearchSection />)
    await waitFor(() => {
      const h3 = document.querySelector('h3')
      expect(h3?.textContent).toContain('AI Researcher')
      expect(h3?.textContent).toContain('@ AINet')
      expect(screen.getByText('Investigating Transformer efficiency.')).toBeInTheDocument()
      expect(screen.getByText('14+')).toBeInTheDocument()
      expect(screen.getByText('Citations')).toBeInTheDocument()
      expect(screen.getByText('04')).toBeInTheDocument()
      expect(screen.getByText('Pubs')).toBeInTheDocument()
    })
  })

  it('renders the research image', async () => {
    render(<ResearchSection />)
    await waitFor(() => {
      const img = screen.getByAltText('Neural Topology')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/neural.png')
    })
  })

  it('renders skeleton while loading', () => {
    server.use(
      http.get(`${BASE}/api/content/research`, () => new Promise(() => {}))
    )
    render(<ResearchSection />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
