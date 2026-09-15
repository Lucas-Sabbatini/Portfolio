import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ExperienceSection from '../../components/sections/ExperienceSection/ExperienceSection'
import { experiences } from '../../data/content'

describe('ExperienceSection', () => {
  it('renders section heading and subtitle', () => {
    render(<ExperienceSection />)
    expect(screen.getByText('02 / Timeline')).toBeInTheDocument()
    expect(screen.getByText('System History')).toBeInTheDocument()
  })

  it('renders all experience entries', () => {
    render(<ExperienceSection />)
    for (const entry of experiences) {
      expect(screen.getByText(entry.role)).toBeInTheDocument()
    }
  })

  it('shows Active badge on the first entry only', () => {
    render(<ExperienceSection />)
    expect(screen.getAllByText('Active')).toHaveLength(1)
  })
})
