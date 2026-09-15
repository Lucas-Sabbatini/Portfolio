import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactSection from '../../components/sections/ContactSection/ContactSection'
import { contact } from '../../data/content'

describe('ContactSection', () => {
  it('renders section heading', () => {
    render(<ContactSection />)
    expect(screen.getByText(contact.section_label)).toBeInTheDocument()
  })

  it('renders the main heading with accent text', () => {
    render(<ContactSection />)
    expect(screen.getByText(contact.heading_dim)).toBeInTheDocument()
    const heading = screen.getByText(contact.heading_dim).closest('h2')
    expect(heading?.textContent).toContain(contact.heading)
    expect(heading?.textContent).toContain(contact.heading_dim)
  })

  it('renders the contact email', () => {
    render(<ContactSection />)
    expect(screen.getByText(contact.email)).toBeInTheDocument()
  })
})
