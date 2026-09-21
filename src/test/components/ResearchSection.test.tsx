import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResearchSection from '../../components/sections/ResearchSection/ResearchSection'
import { research } from '../../data/content'

describe('ResearchSection', () => {
  it('renders title and org', () => {
    render(<ResearchSection />)
    expect(screen.getByRole('heading', { name: research.title })).toBeInTheDocument()
    expect(screen.getByText(research.org)).toBeInTheDocument()
  })

  it('renders every bullet', () => {
    render(<ResearchSection />)
    for (const bullet of research.bullets) {
      expect(screen.getByText(bullet)).toBeInTheDocument()
    }
  })

  it('renders the stats as bullets', () => {
    render(<ResearchSection />)
    for (const stat of research.stats) {
      expect(screen.getByText(stat.value)).toBeInTheDocument()
      expect(screen.getByText(new RegExp(stat.label, 'i'))).toBeInTheDocument()
    }
  })

  it('links to the paper DOI', () => {
    render(<ResearchSection />)
    const link = screen.getByRole('link', { name: /doi/i })
    expect(link).toHaveAttribute('href', research.doi.url)
  })

  it('renders the research image', () => {
    render(<ResearchSection />)
    expect(screen.getByAltText(research.image_alt)).toHaveAttribute('src', research.image_url)
  })
})
