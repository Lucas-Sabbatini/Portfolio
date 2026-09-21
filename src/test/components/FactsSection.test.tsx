import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FactsSection from '../../components/sections/FactsSection/FactsSection'
import { facts } from '../../data/content'

describe('FactsSection', () => {
  it('renders every fact label and value', () => {
    render(<FactsSection />)
    for (const fact of facts) {
      expect(screen.getByText(fact.label)).toBeInTheDocument()
      expect(screen.getByText(fact.value)).toBeInTheDocument()
    }
  })
})
