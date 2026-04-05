import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { motion } from 'framer-motion'
import type { Post, PostDetail } from '@/types/post'
import { fetchPost, fetchPosts } from '@/api/posts'
import { subscribe } from '@/api/newsletter'
import { ApiError } from '@/api/client'
import { TagChip } from '@/components/blog/PostCard/PostCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import { fadeUp, viewportOnce } from '@/lib/animations'
import './PostPage.css'

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [allPosts, setAllPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newsletterMsg, setNewsletterMsg] = useState<{ text: string; cls: string } | null>(null)
  const { track } = useAnalytics()

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setNotFound(false)
    Promise.all([
      fetchPost(slug),
      fetchPosts(),
    ])
      .then(([postData, postsData]) => {
        setPost(postData)
        setAllPosts(postsData)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          console.error(err)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  const currentIndex = allPosts.findIndex((p) => p.slug === post?.slug)
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null

  const renderedBody = useMemo(
    () => post ? (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
        {post.body}
      </ReactMarkdown>
    ) : null,
    [post],
  )

  const formattedDate = post?.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
    : ''

  useEffect(() => {
    if (!post) return
    const thresholds = [25, 50, 75, 100]
    const fired = new Set<number>()

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        thresholds.forEach(t => {
          if (scrolled >= t && !fired.has(t)) {
            fired.add(t)
            track('scroll-depth', { percent: t, slug: post?.slug })
          }
        })
        ticking = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [post, track])

  if (loading) {
    return (
      <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <article className="max-w-3xl mx-auto space-y-12" role="status" aria-busy="true">
          <h1 className="sr-only">Loading post</h1>
          <div className="solid-card h-12 w-2/3 rounded-full animate-pulse" />
          <div className="solid-card h-4 w-1/4 rounded-full animate-pulse" />
          <div className="solid-card w-full h-[400px] rounded-[2rem] animate-pulse" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="solid-card h-4 w-full rounded animate-pulse" />
          ))}
        </article>
      </main>
    )
  }

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setNewsletterMsg(null)
    try {
      await subscribe(email)
      setEmail('')
      setNewsletterMsg({ text: 'Signal received.', cls: 'text-primary text-xs' })
      track('newsletter-subscribe')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setNewsletterMsg({ text: 'Already subscribed.', cls: 'text-on-surface-variant text-xs' })
      } else {
        setNewsletterMsg({ text: 'Something went wrong.', cls: 'text-error text-xs' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (notFound || !post) {
    return (
      <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <div className="post-not-found">
          <h1 className="sr-only">Post not found</h1>
          <span className="material-symbols-outlined text-primary/30 text-6xl" aria-hidden="true">signal_disconnected</span>
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

  return (
    <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
      <article className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/blog" className="inline-flex items-center min-h-[44px] text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">
              ← Signal Archive
            </Link>
            <span className="w-1 h-1 rounded-full bg-on-surface/20" />
            <TagChip tag={post.tag} />
          </div>
          <h1 className="font-headline font-extrabold text-4xl md:text-6xl tracking-tighter leading-tight text-on-surface">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-on-surface-variant text-xs font-bold uppercase tracking-widest">
            <span>{formattedDate}</span>
            <span className="w-1 h-1 rounded-full bg-on-surface/20" />
            <span>{post.read_time}</span>
          </div>
        </header>

        {post.cover_image && (
          <div className="post-cover">
            <img src={post.cover_image} alt={post.title} loading="lazy" className="w-full h-full object-cover opacity-80" />
          </div>
        )}

        <div className="prose prose-invert prose-lg max-w-none
                        prose-headings:font-headline prose-headings:tracking-tight
                        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-code:text-primary prose-code:bg-on-surface/5 prose-code:rounded prose-code:px-1
                        prose-pre:solid-card prose-pre:rounded-[1rem]
                        prose-blockquote:border-primary prose-blockquote:text-on-surface-variant">
          {renderedBody}
        </div>

        <div className="h-[1px] bg-on-surface/5" />

        {/* ── Prev / Next navigation ─────────────────────────────── */}
        {(prevPost || nextPost) && (
          <motion.nav
            aria-label="Post navigation"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="post-nav"
          >
            {prevPost ? (
              <Link to={`/blog/${prevPost.slug}`} className="post-nav-link group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                  ← Previous
                </span>
                <span className="font-headline font-bold text-sm tracking-tight text-on-surface group-hover:text-primary transition-colors">
                  {prevPost.title}
                </span>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link to={`/blog/${nextPost.slug}`} className="post-nav-link group text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                  Next →
                </span>
                <span className="font-headline font-bold text-sm tracking-tight text-on-surface group-hover:text-primary transition-colors">
                  {nextPost.title}
                </span>
              </Link>
            ) : <div />}
          </motion.nav>
        )}

        {/* ── Newsletter CTA ─────────────────────────────────────── */}
        <motion.section
          aria-label="Newsletter signup"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="post-newsletter"
        >
          <div className="space-y-2">
            <h2 className="font-headline font-extrabold text-xl md:text-2xl tracking-tight text-on-surface">
              Stay on the signal.
            </h2>
            <p className="text-on-surface-variant text-sm font-light">
              New dispatches land in your inbox. No noise.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <form onSubmit={handleSubscribe} className="flex gap-3">
              <input
                type="email"
                placeholder="your@email.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="post-newsletter-input"
              />
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="post-newsletter-btn"
              >
                {submitting ? 'Transmitting…' : 'Subscribe'}
              </motion.button>
            </form>
            {newsletterMsg && (
              <p className={newsletterMsg.cls}>{newsletterMsg.text}</p>
            )}
          </div>
        </motion.section>

        {/* ── Back to top ─────────────────────────────────────────── */}
        <div className="flex justify-center pt-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="post-back-to-top group"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-y-0.5 transition-transform">
              arrow_upward
            </span>
            Back to top
          </button>
        </div>
      </article>
    </main>
  )
}
