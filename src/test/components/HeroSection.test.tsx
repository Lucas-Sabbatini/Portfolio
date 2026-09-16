import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from '../../components/sections/HeroSection/HeroSection'
import { profile } from '../../data/content'

describe('HeroSection', () => {
  it('renders the name and the full role text', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(profile.name)
    // The role is split so the emphasised part can carry an annotation;
    // the paragraph must still read as the complete role.
    const role = screen.getByText(profile.roleEmphasis).closest('p')
    expect(role?.textContent).toBe(profile.role)
  })

  it('renders the summary', () => {
    render(<HeroSection />)
    expect(screen.getByText(profile.summary)).toBeInTheDocument()
  })

  it('renders a circular profile picture', () => {
    render(<HeroSection />)
    expect(screen.getByRole('img', { name: profile.name })).toBeInTheDocument()
  })
})
