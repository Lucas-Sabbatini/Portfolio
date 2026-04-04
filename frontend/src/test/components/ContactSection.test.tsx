import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactSection from '../../components/ContactSection'

describe('ContactSection', () => {
  it('renders section heading', () => {
    render(<ContactSection />)
    expect(screen.getByText('06 / Contact')).toBeInTheDocument()
  })

  it('renders the main heading with accent text', () => {
    render(<ContactSection />)
    expect(screen.getByText('together.')).toBeInTheDocument()
    const heading = screen.getByText('together.').closest('h3')
    expect(heading?.textContent).toContain("Let's build")
    expect(heading?.textContent).toContain('together.')
  })
})
