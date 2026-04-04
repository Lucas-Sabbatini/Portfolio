import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import SkillsSection from '../../components/SkillsSection'

const BASE = 'http://localhost:8000'

describe('SkillsSection', () => {
  it('renders section heading', () => {
    render(<SkillsSection />)
    expect(screen.getByText('04 / Core Stack')).toBeInTheDocument()
  })

  it('renders skill pills with icons from API', async () => {
    render(<SkillsSection />)
    await waitFor(() => {
      const tsIcon = screen.getByAltText('TypeScript')
      expect(tsIcon).toBeInTheDocument()
      expect(tsIcon).toHaveAttribute('src', '/icons/ts.svg')

      const reactIcon = screen.getByAltText('React')
      expect(reactIcon).toBeInTheDocument()
      expect(reactIcon).toHaveAttribute('src', '/icons/react.svg')
    })
  })

  it('renders skill without icon when icon is absent', async () => {
    render(<SkillsSection />)
    await waitFor(() => {
      // Python has no icon, so there should be no img with alt "Python"
      expect(screen.queryByAltText('Python')).not.toBeInTheDocument()
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
