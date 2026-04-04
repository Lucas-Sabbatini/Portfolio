import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import SkillsSection from '../../components/sections/SkillsSection/SkillsSection'

const BASE = 'http://localhost:8000'

describe('SkillsSection', () => {
  it('renders section heading', () => {
    render(<SkillsSection />)
    expect(screen.getByText('04 / Core Stack')).toBeInTheDocument()
  })

  it('renders skill pills with icons from API', async () => {
    render(<SkillsSection />)
    await waitFor(() => {
      const tsIcon = document.querySelector('img[src="/icons/ts.svg"]')
      expect(tsIcon).toBeInTheDocument()

      const reactIcon = document.querySelector('img[src="/icons/react.svg"]')
      expect(reactIcon).toBeInTheDocument()
    })
  })

  it('renders accessible skill names via sr-only text', async () => {
    render(<SkillsSection />)
    await waitFor(() => {
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('Python')).toBeInTheDocument()
    })
  })

  it('renders nothing when API returns empty array', async () => {
    server.use(
      http.get(`${BASE}/api/skills`, () => HttpResponse.json([]))
    )
    render(<SkillsSection />)
    await waitFor(() => {
      expect(screen.queryByAltText('TypeScript')).not.toBeInTheDocument()
    })
  })
})
