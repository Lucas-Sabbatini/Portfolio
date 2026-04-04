import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { server } from '../mocks/server'
import NarrativeSection from '../../components/NarrativeSection'

const BASE = 'http://localhost:8000'

describe('NarrativeSection', () => {
  it('renders section label and body from API', async () => {
    render(<NarrativeSection />)
    await waitFor(() => {
      expect(screen.getByText('01 / Philosophy')).toBeInTheDocument()
      expect(screen.getByText('Fusing mathematical rigor with intuitive interfaces.')).toBeInTheDocument()
    })
  })

  it('renders all four stat cards', async () => {
    render(<NarrativeSection />)
    await waitFor(() => {
      expect(screen.getByText('Experience')).toBeInTheDocument()
      expect(screen.getByText('2+')).toBeInTheDocument()
      expect(screen.getByText('Linguistics')).toBeInTheDocument()
      expect(screen.getByText('Architected')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Papers')).toBeInTheDocument()
      expect(screen.getByText('608')).toBeInTheDocument()
    })
  })

  it('renders skeleton while loading', () => {
    server.use(
      http.get(`${BASE}/api/content/narrative`, () => new Promise(() => {}))
    )
    render(<NarrativeSection />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
