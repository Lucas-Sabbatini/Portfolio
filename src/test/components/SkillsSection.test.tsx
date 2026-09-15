import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkillsSection from '../../components/sections/SkillsSection/SkillsSection'
import { skills } from '../../data/content'

describe('SkillsSection', () => {
  it('renders section heading', () => {
    render(<SkillsSection />)
    expect(screen.getByText('04 / Core Stack')).toBeInTheDocument()
  })

  it('renders a pill per skill', () => {
    render(<SkillsSection />)
    for (const skill of skills) {
      expect(screen.getByText(skill.name)).toBeInTheDocument()
    }
  })

  it('renders skill icons', () => {
    render(<SkillsSection />)
    for (const skill of skills) {
      if (skill.icon) {
        expect(document.querySelector(`img[src="${skill.icon}"]`)).toBeInTheDocument()
      }
    }
  })
})
