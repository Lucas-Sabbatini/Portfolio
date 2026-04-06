import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import BlogPage from '../../pages/BlogPage/BlogPage'

const BASE = 'http://localhost:8000'

function renderBlogPage() {
  return render(
    <MemoryRouter>
      <BlogPage />
    </MemoryRouter>
  )
}

describe('BlogPage', () => {
  it('renders skeleton while loading', () => {
    server.use(
      http.get(`${BASE}/api/posts`, () => new Promise(() => {})) // never resolves
    )
    renderBlogPage()
    // skeleton divs have animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders posts after loading', async () => {
    renderBlogPage()
    await waitFor(() => {
      expect(screen.getAllByText('Test Post').length).toBeGreaterThan(0)
    })
  })

  it('filters posts by tag', async () => {
    renderBlogPage()
    await waitFor(() => screen.getAllByText('Test Post'))
    const researchFilter = screen.getByRole('button', { name: /research/i })
    await userEvent.click(researchFilter)
    await waitFor(() => {
      expect(screen.getByText('Research Post')).toBeInTheDocument()
    })
  })

  it('shows empty state when no posts match filter', async () => {
    server.use(
      http.get(`${BASE}/api/posts`, () => HttpResponse.json([]))
    )
    renderBlogPage()
    await waitFor(() => {
      expect(screen.getByText(/no posts in this category/i)).toBeInTheDocument()
    })
  })

  it('subscribes to newsletter successfully', async () => {
    renderBlogPage()
    await waitFor(() => screen.getAllByText('Test Post'))
    const emailInput = screen.getByPlaceholderText('your@email.com')
    await userEvent.type(emailInput, 'test@example.com')
    const button = screen.getByRole('button', { name: /subscribe/i })
    await userEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText("You're subscribed.")).toBeInTheDocument()
    })
  })

  it('shows duplicate error on 409', async () => {
    renderBlogPage()
    await waitFor(() => screen.getAllByText('Test Post'))
    const emailInput = screen.getByPlaceholderText('your@email.com')
    await userEvent.type(emailInput, 'duplicate@test.com')
    const button = screen.getByRole('button', { name: /subscribe/i })
    await userEvent.click(button)
    await waitFor(() => {
      expect(screen.getByText('Already subscribed.')).toBeInTheDocument()
    })
  })
})
