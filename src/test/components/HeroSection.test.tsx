import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroSection from '../../components/sections/HeroSection/HeroSection'
import { profile } from '../../data/content'

describe('HeroSection', () => {
  it('renders the name and role', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(profile.name)
    expect(screen.getByText(profile.role)).toBeInTheDocument()
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
