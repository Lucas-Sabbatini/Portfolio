import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PostCardFeatured, PostCardMedium } from '../../components/blog/PostCard/PostCard'
import type { Post } from '../../types/post'

const basePost: Post = {
  id: '1',
  slug: 'test-slug',
  title: 'Test Post',
  excerpt: 'Test excerpt',
  tag: 'System Entry',
  status: 'published',
  read_time: '5 min',
  published_at: '2024-03-01T00:00:00Z',
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-01T00:00:00Z',
}

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('PostCardFeatured', () => {
  it('renders cover image when cover_image is set', () => {
    wrap(<PostCardFeatured post={{ ...basePost, cover_image: '/uploads/covers/test.webp' }} />)
    const img = document.querySelector('img')
    expect(img).toBeInTheDocument()
  })

  it('renders gradient fallback when cover_image is not set', () => {
    wrap(<PostCardFeatured post={{ ...basePost, cover_image: undefined }} />)
    expect(document.querySelector('img')).not.toBeInTheDocument()
    expect(document.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
  })

  it('falls back to gradient when cover image fails to load', () => {
    wrap(<PostCardFeatured post={{ ...basePost, cover_image: '/uploads/covers/broken.webp' }} />)
    const img = document.querySelector('img')!
    fireEvent.error(img)
    expect(document.querySelector('img')).not.toBeInTheDocument()
    expect(document.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
  })
})

describe('PostCardMedium', () => {
  it('renders cover image when cover_image is set', () => {
    wrap(<PostCardMedium post={{ ...basePost, cover_image: '/uploads/covers/test.webp' }} />)
    const img = document.querySelector('img')
    expect(img).toBeInTheDocument()
  })

  it('renders gradient fallback when cover_image is not set', () => {
    wrap(<PostCardMedium post={{ ...basePost, cover_image: undefined }} />)
    expect(document.querySelector('img')).not.toBeInTheDocument()
    expect(document.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
  })

  it('falls back to gradient when cover image fails to load', () => {
    wrap(<PostCardMedium post={{ ...basePost, cover_image: '/uploads/covers/broken.webp' }} />)
    const img = document.querySelector('img')!
    fireEvent.error(img)
    expect(document.querySelector('img')).not.toBeInTheDocument()
    expect(document.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
  })
})
