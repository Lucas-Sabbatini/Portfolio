import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from '../../components/sections/HeroSection/HeroSection'
import { hero } from '../../data/content'

describe('HeroSection', () => {
  it('renders the static headline', () => {
    render(<HeroSection />)
    const h1 = document.querySelector('h1')
    expect(h1?.textContent).toContain('Engineering')
    expect(h1?.textContent).toContain('at the edge of AI')
  })

  it('renders the status badge', () => {
    render(<HeroSection />)
    expect(screen.getByText(hero.status_badge)).toBeInTheDocument()
  })

  it('renders both CTAs', () => {
    render(<HeroSection />)
    const primary = screen.getByText(hero.cta_primary).closest('a')
    const secondary = screen.getByText(hero.cta_secondary).closest('a')
    expect(primary).toHaveAttribute('href', hero.cta_primary_link)
    expect(secondary).toHaveAttribute('href', hero.cta_secondary_link)
  })
})
