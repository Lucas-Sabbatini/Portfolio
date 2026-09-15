import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResearchSection from '../../components/sections/ResearchSection/ResearchSection'
import { research } from '../../data/content'

describe('ResearchSection', () => {
  it('renders title, org, and body', () => {
    render(<ResearchSection />)
    expect(screen.getByRole('heading', { name: research.title })).toBeInTheDocument()
    expect(screen.getByText(research.org)).toBeInTheDocument()
    expect(screen.getByText(research.body)).toBeInTheDocument()
  })

  it('renders the stats', () => {
    render(<ResearchSection />)
    for (const stat of research.stats) {
      expect(screen.getByText(stat.value)).toBeInTheDocument()
      expect(screen.getByText(stat.label)).toBeInTheDocument()
    }
  })

  it('renders the research image', () => {
    render(<ResearchSection />)
    expect(screen.getByAltText(research.image_alt)).toHaveAttribute('src', research.image_url)
  })
})
