import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NarrativeSection from '../../components/sections/NarrativeSection/NarrativeSection'
import { narrative } from '../../data/content'

describe('NarrativeSection', () => {
  it('renders section label and body', () => {
    render(<NarrativeSection />)
    expect(screen.getByText(narrative.section_label)).toBeInTheDocument()
    expect(screen.getByText(narrative.body)).toBeInTheDocument()
  })

  it('renders all four stat cards', () => {
    render(<NarrativeSection />)
    for (const stat of narrative.stats) {
      expect(screen.getByText(stat.label)).toBeInTheDocument()
    }
    expect(screen.getByText('3+')).toBeInTheDocument()
    expect(screen.getByText('Full')).toBeInTheDocument()
    expect(screen.getByText(/English/)).toBeInTheDocument()
    expect(screen.getByText(/UFU · 2026/)).toBeInTheDocument()
  })
})
