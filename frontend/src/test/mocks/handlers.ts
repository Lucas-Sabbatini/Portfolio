import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

const mockPosts = [
  {
    id: '1',
    slug: 'test-slug',
    title: 'Test Post',
    excerpt: 'Test excerpt',
    tag: 'System Entry',
    status: 'published',
    cover_image: null,
    read_time: '5 min',
    published_at: '2024-03-01T00:00:00Z',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
  {
    id: '2',
    slug: 'research-post',
    title: 'Research Post',
    excerpt: 'Research excerpt',
    tag: 'Research',
    status: 'published',
    cover_image: null,
    read_time: '8 min',
    published_at: '2024-02-01T00:00:00Z',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
]

const mockPostDetail = {
  ...mockPosts[0],
  body: '# Hello\n\nThis is the post body.',
}

export const handlers = [
  http.get(`${BASE}/api/posts`, ({ request }) => {
    const url = new URL(request.url)
    const tag = url.searchParams.get('tag')
    if (tag) {
      return HttpResponse.json(mockPosts.filter(p => p.tag === tag))
    }
    return HttpResponse.json(mockPosts)
  }),

  http.get(`${BASE}/api/posts/:slug`, ({ params }) => {
    const { slug } = params
    if (slug === 'test-slug') return HttpResponse.json(mockPostDetail)
    if (slug === 'markdown-post') {
      return HttpResponse.json({ ...mockPostDetail, slug: 'markdown-post', body: '# Hello' })
    }
    return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
  }),

  http.post(`${BASE}/api/newsletter/subscribe`, async ({ request }) => {
    const body = await request.json() as { email: string }
    if (body.email === 'duplicate@test.com') {
      return HttpResponse.json({ detail: 'Already subscribed' }, { status: 409 })
    }
    return HttpResponse.json({}, { status: 201 })
  }),

  http.post(`${BASE}/api/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    if (body.email === 'admin@test.com' && body.password === 'password') {
      return HttpResponse.json({ email: 'admin@test.com' })
    }
    return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 401 })
  }),

  http.get(`${BASE}/api/auth/me`, () => {
    return HttpResponse.json({ email: 'admin@test.com' })
  }),

  http.get(`${BASE}/api/content/hero`, () => {
    return HttpResponse.json({
      headline_line1: 'Building',
      headline_line2: 'at scale',
      status_badge: 'Operational',
      cta_primary: 'Explore Works',
      cta_primary_link: '/works',
      cta_secondary: 'Research Lab',
      cta_secondary_link: '/research',
    })
  }),

  http.get(`${BASE}/api/content/narrative`, () => {
    return HttpResponse.json({
      section_label: '01 / Philosophy',
      body: 'Fusing mathematical rigor with intuitive interfaces.',
      stat_1_label: 'Experience', stat_1_value: '2+', stat_1_sub: 'Circuits', stat_1_small: 'false',
      stat_2_label: 'Linguistics', stat_2_value: 'C2', stat_2_sub: 'Level', stat_2_small: 'true',
      stat_3_label: 'Architected', stat_3_value: '3', stat_3_sub: 'Monoliths', stat_3_small: 'false',
      stat_4_label: 'Papers', stat_4_value: '608', stat_4_sub: 'Indexed', stat_4_small: 'false',
    })
  }),

  http.get(`${BASE}/api/content/research`, () => {
    return HttpResponse.json({
      title_line1: 'AI Researcher',
      title_line2: '@ AINet',
      body: 'Investigating Transformer efficiency.',
      stat_citations_value: '14+',
      stat_citations_label: 'Citations',
      stat_pubs_value: '04',
      stat_pubs_label: 'Pubs',
      image_url: 'https://example.com/neural.png',
    })
  }),

  http.get(`${BASE}/api/content/:section`, ({ params }) => {
    return HttpResponse.json({ section: params.section })
  }),

  http.get(`${BASE}/api/experience`, () => {
    return HttpResponse.json([
      {
        id: '1',
        role: 'Senior Engineer',
        company: 'Acme Corp',
        period: '2024 – Present',
        description: ['Led platform migration', 'Improved latency by 40%'],
        sort_order: 1,
      },
      {
        id: '2',
        role: 'Software Engineer',
        company: 'StartupCo',
        period: '2022 – 2024',
        description: ['Built REST APIs', 'Designed data pipelines'],
        sort_order: 2,
      },
    ])
  }),

  http.get(`${BASE}/api/skills`, () => {
    return HttpResponse.json([
      { id: '1', name: 'TypeScript', category: 'Language', icon: '/icons/ts.svg', sort_order: 1 },
      { id: '2', name: 'React', category: 'Framework', icon: '/icons/react.svg', sort_order: 2 },
      { id: '3', name: 'Python', category: 'Language', sort_order: 3 },
    ])
  }),

  http.get(`${BASE}/api/social-links`, () => {
    return HttpResponse.json([])
  }),
]
