import { apiFetch } from './client'

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  tag: 'System Entry' | 'Research' | 'Archived' | 'Drafting'
  status: 'draft' | 'published'
  cover_image?: string
  read_time?: string
  published_at?: string
  created_at: string
  updated_at: string
}

export interface PostDetail extends Post {
  body: string
}

export interface PostCreate {
  title: string
  excerpt: string
  body: string
  tag: Post['tag']
  slug?: string
  cover_image?: string
  read_time?: string
}

export const fetchPosts = (tag?: string): Promise<Post[]> =>
  apiFetch(`/api/posts${tag ? `?tag=${encodeURIComponent(tag)}` : ''}`)

export const fetchPost = (slug: string): Promise<PostDetail> =>
  apiFetch(`/api/posts/${slug}`)

export const createPost = (data: PostCreate): Promise<Post> =>
  apiFetch('/api/posts', { method: 'POST', body: JSON.stringify(data) })

export const updatePost = (slug: string, data: Partial<PostCreate>): Promise<Post> =>
  apiFetch(`/api/posts/${slug}`, { method: 'PUT', body: JSON.stringify(data) })

export const publishPost = (slug: string): Promise<Post> =>
  apiFetch(`/api/posts/${slug}/publish`, { method: 'PATCH' })

export const deletePost = (slug: string): Promise<void> =>
  apiFetch(`/api/posts/${slug}`, { method: 'DELETE' })

export const uploadCoverImage = (file: File): Promise<{ url: string }> => {
  const form = new FormData()
  form.append('file', file)
  return apiFetch('/api/upload', {
    method: 'POST',
    body: form,
    // Do not set Content-Type — let browser set multipart/form-data boundary
    headers: {},
  })
}
