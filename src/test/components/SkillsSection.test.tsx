import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SkillsSection from '../../components/sections/SkillsSection/SkillsSection'
import { skills } from '../../data/content'

describe('SkillsSection', () => {
  it('renders the section heading', () => {
    render(<SkillsSection />)
    expect(screen.getByRole('heading', { name: 'Stack' })).toBeInTheDocument()
  })

  it('renders every skill name and icon', () => {
    render(<SkillsSection />)
    for (const skill of skills) {
      expect(screen.getByText(skill.name)).toBeInTheDocument()
      if (skill.icon) {
        expect(document.querySelector(`img[src="${skill.icon}"]`)).toBeInTheDocument()
      }
    }
  })

  it('groups skills by category', () => {
    render(<SkillsSection />)
    expect(screen.getByText('Languages')).toBeInTheDocument()
    expect(screen.getByText('Frameworks')).toBeInTheDocument()
    expect(screen.getByText('Databases')).toBeInTheDocument()
    expect(screen.getByText('Cloud')).toBeInTheDocument()
  })
})
