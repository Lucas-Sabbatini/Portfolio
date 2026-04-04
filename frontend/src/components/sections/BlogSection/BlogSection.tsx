import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeUp, staggerContainer, viewportOnce } from '@/lib/animations'
import type { Post } from '@/types/post'
import { fetchPosts } from '@/api/posts'
import { tagColors } from '@/data/posts'
import './BlogSection.css'

const card: import('framer-motion').Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

const gradientFallbacks = [
  'from-primary-container via-surface-container-low to-background',
  'from-tertiary-container via-surface-container-low to-background',
  'from-secondary-container via-surface-container-low to-background',
]

export default function BlogSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchPosts()
      .then(p => setPosts(p.slice(0, 3)))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="space-y-16" id="blog" aria-label="Blog posts">
      <motion.div
        className="flex justify-between items-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <p className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60">
          05 / Intelligence
        </p>
        <Link to="/blog" className="blog-section-view-all">
          Library →
        </Link>
      </motion.div>

      {error && !loading && posts.length === 0 && (
        <p className="text-on-surface-variant text-sm">Unable to load posts.</p>
      )}

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {loading
          ? [0, 1, 2].map((i) => (
              <div
                key={i}
                className="glass-card rounded-[3rem] aspect-[3/4] animate-pulse bg-white/5"
              />
            ))
          : posts.map((post, idx) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <motion.div
                  variants={card}
                  whileHover={{ y: -4, transition: { duration: 0.3, ease: 'easeOut' } }}
                  className="blog-section-card group"
                >
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="blog-section-card-image"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${gradientFallbacks[idx % gradientFallbacks.length]}`}
                    />
                  )}
                  <div className="blog-section-card-overlay" />
                  <div className="blog-section-card-content">
                    <span className={`blog-section-tag-chip ${tagColors[post.tag]}`}>
                      {post.tag}
                    </span>
                    <h4 className="text-2xl font-bold leading-tight tracking-tight">
                      {post.title}
                    </h4>
                  </div>
                </motion.div>
              </Link>
            ))}
      </motion.div>
    </section>
  )
}
