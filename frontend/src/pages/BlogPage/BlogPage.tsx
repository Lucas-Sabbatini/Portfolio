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
  const { track } = useAnalytics()

  useEffect(() => {
    fetchPosts().then(setPosts).catch(console.error).finally(() => setLoading(false))
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

  return (
    <>
      <main id="main-content" className="min-h-screen pt-36 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-20">

          {/* ── Masthead ───────────────────────────────────────────────── */}
          <motion.header
            className="space-y-10"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="flex items-end justify-between">
              <p className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60">
                05 / Intelligence
              </p>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/40">
                  {posts.length} Signals indexed
                </span>
              </div>
            </motion.div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 border-b border-on-surface/5 pb-10">
              <motion.h1 variants={fadeUp} className="blog-page-heading">
                Signal<br />
                <span className="text-primary-dim">Archive.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-on-surface-variant font-light text-lg max-w-sm leading-relaxed md:pb-3"
              >
                Dispatches on AI systems, infrastructure, and the machinery of intelligence.
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
            <div className="space-y-8" role="status" aria-busy="true">
              <span className="sr-only">Loading posts</span>
              <div className="solid-card rounded-[2rem] animate-pulse h-[480px]" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="solid-card rounded-[2rem] animate-pulse h-[320px]" />
                <div className="solid-card rounded-[2rem] animate-pulse h-[320px]" />
                <div className="solid-card rounded-[2rem] animate-pulse h-[320px]" />
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
                    <span className="material-symbols-outlined text-primary/30 text-5xl" aria-hidden="true">
                      signal_disconnected
                    </span>
                    <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest">
                      No signals in this category
                    </p>
                  </motion.div>
                ) : (
                  <>
                    {featured && (
                      <Link to={`/blog/${featured.slug}`} aria-label={featured.title}>
                        <PostCardFeatured post={featured} />
                      </Link>
                    )}

                    {gridPosts.length > 0 && (
                      <motion.div
                        className={`grid gap-6 ${
                          gridPosts.length === 1
                            ? 'grid-cols-1'
                            : gridPosts.length === 2
                              ? 'grid-cols-1 md:grid-cols-2'
                              : 'grid-cols-1 md:grid-cols-3'
                        }`}
                        variants={staggerFast}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportOnce}
                      >
                        {gridPosts.map((post, i) => (
                          <Link key={post.id} to={`/blog/${post.slug}`} aria-label={post.title}>
                            <PostCardMedium post={post} index={i + 1} />
                          </Link>
                        ))}
                      </motion.div>
                    )}

                    {listPosts.length > 0 && (
                      <motion.div
                        className="flex items-center gap-6 pt-4"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportOnce}
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.6em] text-primary/40">
                          Archive
                        </span>
                        <div className="flex-1 h-[1px] bg-on-surface/5" />
                      </motion.div>
                    )}

                    {listPosts.length > 0 && (
                      <motion.div
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={viewportOnce}
                      >
                        <div className="border-t border-on-surface/5">
                          {listPosts.map((post, i) => (
                            <Link key={post.id} to={`/blog/${post.slug}`} aria-label={post.title}>
                              <PostCardList post={post} index={i + gridPosts.length + 1} />
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
                  className="newsletter-input"
                />
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="newsletter-btn"
                >
                  {submitting ? 'Transmitting…' : 'Subscribe'}
                </motion.button>
              </form>
              {newsletterMsg && (
                <p className={newsletterMsg.cls}>{newsletterMsg.text}</p>
              )}
            </div>
          </motion.section>

        </div>
      </main>
    </>
  )
}
