import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import BlogFilter from '@/components/blog/BlogFilter'
import {
  PostCardFeatured,
  PostCardMedium,
  PostCardList,
} from '@/components/blog/PostCard/PostCard'
import type { PostTag } from '@/data/posts'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/api/posts'
import { fetchContent } from '@/api/content'
import { subscribe } from '@/api/newsletter'
import { ApiError } from '@/api/client'
import { useAnalytics } from '@/hooks/useAnalytics'
import { fadeUp, staggerContainer, staggerFast, viewportOnce } from '@/lib/animations'
import './BlogPage.css'

type Filter = 'All' | PostTag

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<Filter>('All')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [newsletterMsg, setNewsletterMsg] = useState<{ text: string; cls: string } | null>(null)
  const [blogContent, setBlogContent] = useState<Record<string, string>>({})
  const { track } = useAnalytics()

  useEffect(() => {
    fetchPosts().then(setPosts).catch(console.error).finally(() => setLoading(false))
    fetchContent('blog').then(setBlogContent).catch(console.error)
  }, [])

  const tagCounts = useMemo(
    () => posts.reduce<Record<string, number>>((acc, p) => {
      acc[p.tag] = (acc[p.tag] ?? 0) + 1
      return acc
    }, {}),
    [posts],
  )

  const filtered = useMemo(
    () => (activeFilter === 'All' ? posts : posts.filter((p) => p.tag === activeFilter)),
    [activeFilter, posts],
  )

  const featured = filtered[0]
  const gridPosts = filtered.slice(1, 4)
  const listPosts = filtered.slice(4)

  const handleFilterChange = useCallback((filter: Filter) => {
    setActiveFilter(filter)
    track('blog-filter', { tag: filter })
  }, [track])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setNewsletterMsg(null)
    try {
      await subscribe(email)
      setEmail('')
      setNewsletterMsg({ text: 'You\'re subscribed.', cls: 'text-primary text-xs' })
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

  return (
    <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-20">

          {/* ── Masthead ───────────────────────────────────────────────── */}
          <motion.header
            className="space-y-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-b border-on-surface/5 pb-10">
              <motion.h1 variants={fadeUp} className="blog-page-heading">
                {blogContent.title ?? 'Blog.'}
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-on-surface-variant font-light text-lg max-w-sm leading-relaxed md:pb-3"
              >
                {blogContent.subtitle ?? 'On AI systems, infrastructure, and the machinery of intelligence.'}
              </motion.p>
            </div>

            <motion.div variants={fadeUp}>
              <BlogFilter
                active={activeFilter}
                onChange={handleFilterChange}
                counts={tagCounts}
              />
            </motion.div>
          </motion.header>

          {loading ? (
            <div className="space-y-6" role="status" aria-busy="true">
              <span className="sr-only">Loading posts</span>
              <div className="hidden md:block solid-card rounded-3xl animate-pulse h-[400px]" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="solid-card rounded-3xl animate-pulse h-[260px] md:h-[320px]" />
                <div className="solid-card rounded-3xl animate-pulse h-[260px] md:h-[320px]" />
                <div className="solid-card rounded-3xl animate-pulse h-[260px] md:h-[320px]" />
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-8"
              >
                {filtered.length === 0 ? (
                  <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="blog-empty-state"
                  >
                    <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">
                      No posts in this category
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {featured && (
                      <Link to={`/blog/${featured.slug}`} aria-label={featured.title} className="hidden md:block">
                        <PostCardFeatured post={featured} />
                      </Link>
                    )}

                    <motion.div
                      className={`grid gap-6 grid-cols-1 ${
                        gridPosts.length === 1 && !featured
                          ? 'md:grid-cols-1'
                          : gridPosts.length === 2 && !featured
                            ? 'md:grid-cols-2'
                            : 'md:grid-cols-3'
                      }`}
                      variants={staggerFast}
                      initial="hidden"
                      whileInView="visible"
                      viewport={viewportOnce}
                    >
                      {featured && (
                        <Link key={featured.id} to={`/blog/${featured.slug}`} aria-label={featured.title} className="md:hidden">
                          <PostCardMedium post={featured} />
                        </Link>
                      )}
                      {gridPosts.map((post) => (
                        <Link key={post.id} to={`/blog/${post.slug}`} aria-label={post.title}>
                          <PostCardMedium post={post} />
                        </Link>
                      ))}
                    </motion.div>

                    {listPosts.length > 0 && (
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportOnce}
                      >
                        <div className="border-t border-on-surface/5">
                          {listPosts.map((post) => (
                            <Link key={post.id} to={`/blog/${post.slug}`} aria-label={post.title}>
                              <PostCardList post={post} />
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          <motion.section
            aria-label="Newsletter signup"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="newsletter-section"
          >
            <div className="space-y-2">
              <h2 className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight text-on-surface">
                {blogContent.newsletter_title ?? 'Stay updated.'}
              </h2>
              <p className="text-on-surface-variant text-sm font-light">
                {blogContent.newsletter_subtitle ?? 'New posts delivered to your inbox.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="newsletter-input"
                />
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="newsletter-btn"
                >
                  {submitting ? 'Sending…' : 'Subscribe'}
                </motion.button>
              </form>
              {newsletterMsg && (
                <p className={newsletterMsg.cls}>{newsletterMsg.text}</p>
              )}
            </div>
          </motion.section>

        </div>
      </main>
  )
}
