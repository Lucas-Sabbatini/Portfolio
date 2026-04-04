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
