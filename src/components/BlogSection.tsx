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
  'from-[#002b3d] via-[#001a26] to-[#020202]',
  'from-[#1e1b4b] via-[#0f0e2e] to-[#020202]',
  'from-[#0f172a] via-[#080f1c] to-[#020202]',
]

export default function BlogSection() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts().then(p => setPosts(p.slice(0, 3))).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <section className="space-y-16" id="blog">
      <motion.div
        className="flex justify-between items-center"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <h2 className="font-bold text-[10px] uppercase tracking-[0.6em] text-primary/60">
          05 / Intelligence
        </h2>
        <Link
          to="/blog"
          className="text-on-surface-variant hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest"
        >
          Library →
        </Link>
      </motion.div>

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
