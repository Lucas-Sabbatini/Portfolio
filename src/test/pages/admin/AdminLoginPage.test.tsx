import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import AdminLoginPage from '../../../pages/admin/AdminLoginPage'

const BASE = 'http://localhost:8000'

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/login']}>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/posts" element={<div>Admin Posts</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminLoginPage', () => {
  it('renders login form', () => {
    // Override getMe to return 401 so redirect doesn't happen
    server.use(
      http.get(`${BASE}/api/auth/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      )
    )
    renderLoginPage()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument()
  })

  it('shows error on invalid credentials', async () => {
    server.use(
      http.get(`${BASE}/api/auth/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      ),
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
      )
    )
    renderLoginPage()
    await userEvent.type(screen.getByPlaceholderText('Email'), 'wrong@test.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpass')
    await userEvent.click(screen.getByRole('button', { name: /enter/i }))
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('navigates to /admin/posts on success', async () => {
    server.use(
      http.get(`${BASE}/api/auth/me`, () =>
        HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
      ),
      http.post(`${BASE}/api/auth/login`, () =>
        HttpResponse.json({ email: 'admin@test.com' })
      )
    )
    renderLoginPage()
    await userEvent.type(screen.getByPlaceholderText('Email'), 'admin@test.com')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password')
    await userEvent.click(screen.getByRole('button', { name: /enter/i }))
    await waitFor(() => {
      expect(screen.getByText('Admin Posts')).toBeInTheDocument()
    })
  })
})
