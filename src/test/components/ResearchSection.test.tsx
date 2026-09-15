import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResearchSection from '../../components/sections/ResearchSection/ResearchSection'
import { research } from '../../data/content'

describe('ResearchSection', () => {
  it('renders section label', () => {
    render(<ResearchSection />)
    expect(screen.getByText(research.section_label)).toBeInTheDocument()
  })

  it('renders title, body, and stats', () => {
    render(<ResearchSection />)
    const h2 = document.querySelector('h2')
    expect(h2?.textContent).toContain(research.title_line1)
    expect(h2?.textContent).toContain(research.title_line2)
    expect(screen.getByText(research.body)).toBeInTheDocument()
    for (const stat of research.stats) {
      expect(screen.getByText(stat.value)).toBeInTheDocument()
      expect(screen.getByText(stat.label)).toBeInTheDocument()
    }
  })

  it('renders the bundled research image', () => {
    render(<ResearchSection />)
    const img = screen.getByAltText('Neural Topology')
    expect(img).toHaveAttribute('src', research.image_url)
  })
})
