import { apiFetch } from './client'
import type { Post, PostDetail, PostCreate } from '@/types/post'

export type { Post, PostDetail, PostCreate }

export const fetchPosts = (tag?: string, status?: string): Promise<Post[]> => {
  const params = new URLSearchParams()
  if (tag) params.set('tag', tag)
  if (status) params.set('status', status)
  const qs = params.toString()
  return apiFetch(`/api/posts${qs ? `?${qs}` : ''}`)
}

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
