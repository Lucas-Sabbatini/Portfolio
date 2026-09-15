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
      expect(screen.getByText(entry.role)).toBeInTheDocument()
      expect(screen.getByText(entry.company)).toBeInTheDocument()
      expect(screen.getByText(entry.period)).toBeInTheDocument()
    }
  })
})
