import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactSection from '../../components/sections/ContactSection/ContactSection'
import { profile, socialLinks } from '../../data/content'

describe('ContactSection', () => {
  it('renders the section heading and email', () => {
    render(<ContactSection />)
    expect(screen.getByRole('heading', { name: 'Contact' })).toBeInTheDocument()
    expect(screen.getByText(profile.email)).toBeInTheDocument()
  })

  it('renders the social links', () => {
    render(<ContactSection />)
    for (const link of socialLinks) {
      expect(screen.getByRole('link', { name: new RegExp(link.label, 'i') })).toHaveAttribute(
        'href',
        link.url,
      )
    }
  })
})
