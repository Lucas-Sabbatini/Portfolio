import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { PostDetail } from '@/types/post'
import { fetchPost } from '@/api/posts'
import { ApiError } from '@/api/client'
import { TagChip } from '@/components/blog/PostCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import './PostPage.css'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { track } = useAnalytics()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    fetchPost(slug)
      .then(setPost)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          console.error(err)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!post) return
    const thresholds = [25, 50, 75, 100]
    const fired = new Set<number>()

    const onScroll = () => {
      const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      thresholds.forEach(t => {
        if (scrolled >= t && !fired.has(t)) {
          fired.add(t)
          track('scroll-depth', { percent: t, slug: post?.slug })
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [post, track])

  if (loading) {
    return (
      <main className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <article className="max-w-3xl mx-auto space-y-12">
          <div className="glass-card h-12 w-2/3 rounded-full animate-pulse" />
          <div className="glass-card h-4 w-1/4 rounded-full animate-pulse" />
          <div className="glass-card w-full h-[400px] rounded-[2rem] animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card h-4 w-full rounded animate-pulse" />
          ))}
        </article>
      </main>
    )
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <div className="post-not-found">
          <span className="material-symbols-outlined text-primary/30 text-6xl">signal_disconnected</span>
          <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">
            Signal not found
          </p>
          <Link to="/blog" className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">
            ← Back to Archive
          </Link>
        </div>
      </main>
    )
  }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
    : ''

  return (
    <main className="min-h-screen pt-36 pb-24 px-6 md:px-12">
      <article className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-6">
          <Link to="/blog" className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors">
            ← Signal Archive
          </Link>
          <TagChip tag={post.tag} />
          <h1 className="font-headline font-extrabold text-4xl md:text-6xl tracking-tighter leading-tight text-on-surface">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
            <span>{formattedDate}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>{post.read_time}</span>
          </div>
        </header>

        {post.cover_image && (
          <div className="post-cover">
            <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover opacity-80" />
          </div>
        )}

        <div className="prose prose-invert prose-lg max-w-none
                        prose-headings:font-headline prose-headings:tracking-tight
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-code:text-primary prose-code:bg-white/5 prose-code:rounded prose-code:px-1
                        prose-pre:glass-card prose-pre:rounded-[1rem]
                        prose-blockquote:border-primary prose-blockquote:text-on-surface-variant">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {post.body}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  )
}
