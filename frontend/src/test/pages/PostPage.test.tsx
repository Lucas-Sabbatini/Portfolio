import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import PostPage from '../../pages/PostPage/PostPage'

const BASE = 'http://localhost:8000'

function renderPostPage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<PostPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PostPage', () => {
  it('renders post content', async () => {
    renderPostPage('test-slug')
    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument()
    })
  })

  it('renders 404 state for unknown slug', async () => {
    renderPostPage('nonexistent-slug')
    await waitFor(() => {
      expect(screen.getByText(/signal not found/i)).toBeInTheDocument()
    })
  })

  it('renders markdown body', async () => {
    server.use(
      http.get(`${BASE}/api/posts/markdown-post`, () =>
        HttpResponse.json({
          id: '99',
          slug: 'markdown-post',
          title: 'Markdown Test',
          excerpt: 'Test',
          tag: 'Research',
          status: 'published',
          body: '# Hello',
          read_time: '1 min',
          published_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        })
      )
    )
    renderPostPage('markdown-post')
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: 'Hello' })
      expect(heading).toBeInTheDocument()
    })
  })

  it('hides cover image container when image fails to load', async () => {
    server.use(
      http.get(`${BASE}/api/posts/cover-post`, () =>
        HttpResponse.json({
          id: '50',
          slug: 'cover-post',
          title: 'Cover Post',
          excerpt: 'Has a broken cover',
          tag: 'System Entry',
          status: 'published',
          body: 'Content here',
          cover_image: '/uploads/covers/broken.webp',
          read_time: '2 min',
          published_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        })
      )
    )
    renderPostPage('cover-post')
    await waitFor(() => screen.getByText('Cover Post'))

    const img = screen.getByRole('img', { name: 'Cover Post' })
    const container = img.parentElement!
    fireEvent.error(img)

    expect(container.style.display).toBe('none')
  })
})
