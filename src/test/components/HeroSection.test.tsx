import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from '../../components/sections/HeroSection/HeroSection'
import { CV_URL, profile } from '../../data/content'

describe('HeroSection', () => {
  it('renders name, role, and status', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(profile.name)
    expect(screen.getByText(profile.role)).toBeInTheDocument()
    expect(screen.getByText(profile.status)).toBeInTheDocument()
  })

  it('links to email and CV', () => {
    render(<HeroSection />)
    expect(screen.getByRole('link', { name: /email me/i })).toHaveAttribute(
      'href',
      `mailto:${profile.email}`,
    )
    expect(screen.getByRole('link', { name: /download cv/i })).toHaveAttribute('href', CV_URL)
  })
})
