import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { fadeUp, staggerContainer, viewportOnce } from '../lib/animations'
import type { Post } from '../api/posts'
import { fetchPosts } from '../api/posts'
import { tagColors } from '../data/posts'

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
        <Link
          to="/blog"
          className="text-on-surface-variant hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest min-h-[44px] flex items-center"
        >
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
                  className="glass-card p-1 rounded-[3rem] aspect-[3/4] relative overflow-hidden group cursor-pointer"
                >
                  {post.cover_image ? (
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      className="w-full h-full object-cover opacity-20 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${gradientFallbacks[idx % gradientFallbacks.length]}`}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
                  <div className="absolute bottom-0 left-0 p-10 z-20 w-full space-y-5">
                    <span
                      className={`px-4 py-1.5 backdrop-blur-md rounded-full text-[9px] font-black tracking-widest uppercase border ${tagColors[post.tag]}`}
                    >
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
