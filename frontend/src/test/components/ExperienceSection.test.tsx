import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import ExperienceSection from '../../components/sections/ExperienceSection'

const BASE = 'http://localhost:8000'

describe('ExperienceSection', () => {
  it('renders section heading and subtitle', async () => {
    render(<ExperienceSection />)
    expect(screen.getByText('02 / Timeline')).toBeInTheDocument()
    expect(screen.getByText('System History')).toBeInTheDocument()
  })

  it('renders experience entries from API', async () => {
    render(<ExperienceSection />)
    await waitFor(() => {
      expect(screen.getByText('Senior Engineer')).toBeInTheDocument()
      expect(screen.getByText(/Acme Corp.*2024 – Present/)).toBeInTheDocument()
      expect(screen.getByText('Led platform migration')).toBeInTheDocument()
      expect(screen.getByText('Improved latency by 40%')).toBeInTheDocument()

      expect(screen.getByText('Software Engineer')).toBeInTheDocument()
      expect(screen.getByText(/StartupCo.*2022 – 2024/)).toBeInTheDocument()
    })
  })

  it('shows Active badge on the first entry', async () => {
    render(<ExperienceSection />)
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('renders nothing when API returns empty array', async () => {
    server.use(
      http.get(`${BASE}/api/experience`, () => HttpResponse.json([]))
    )
    render(<ExperienceSection />)
    expect(screen.getByText('02 / Timeline')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Senior Engineer')).not.toBeInTheDocument()
    })
  })
})
