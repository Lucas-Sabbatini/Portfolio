import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExperienceSection from '../../components/sections/ExperienceSection/ExperienceSection'
import { experiences } from '../../data/content'

describe('ExperienceSection', () => {
  it('renders the section heading', () => {
    render(<ExperienceSection />)
    expect(screen.getByRole('heading', { name: 'Experience' })).toBeInTheDocument()
  })

  it('renders every role, company, and period', () => {
    render(<ExperienceSection />)
    for (const entry of experiences) {
      // Roles can repeat (two "Software Engineer" roles), companies/periods can't.
      expect(screen.getAllByText(entry.role).length).toBeGreaterThan(0)
      expect(screen.getByText(entry.company)).toBeInTheDocument()
      expect(screen.getByText(entry.period)).toBeInTheDocument()
    }
  })

  it('lists the most recent role first', () => {
    render(<ExperienceSection />)
    const first = [...experiences].sort((a, b) => a.sort_order - b.sort_order)[0]
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings[0]).toHaveTextContent(first.role)
    expect(screen.getByText(first.period)).toBeInTheDocument()
  })
})
