import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http } from 'msw'
import { server } from '../mocks/server'
import BlogSection from '../../components/BlogSection'

const BASE = 'http://localhost:8000'

function renderBlogSection() {
  return render(
    <MemoryRouter>
      <BlogSection />
    </MemoryRouter>
  )
}

describe('BlogSection', () => {
  it('renders section heading and library link', () => {
    renderBlogSection()
    expect(screen.getByText('05 / Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Library →')).toBeInTheDocument()
  })

  it('renders post cards with titles and tags from API', async () => {
    renderBlogSection()
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
      expect(screen.getByText('System Entry')).toBeInTheDocument()
      expect(screen.getByText('Research Post')).toBeInTheDocument()
      expect(screen.getByText('Research')).toBeInTheDocument()
    })
  })

  it('links post cards to the correct blog post URL', async () => {
    renderBlogSection()
    await waitFor(() => {
      const link = screen.getByText('Test Post').closest('a')
      expect(link).toHaveAttribute('href', '/blog/test-slug')
    })
  })

  it('renders skeleton cards while loading', () => {
    server.use(
      http.get(`${BASE}/api/posts`, () => new Promise(() => {}))
    )
    renderBlogSection()
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })
})
