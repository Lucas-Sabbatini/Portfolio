import { motion } from 'framer-motion'
import type { Post } from '@/types/post'
import type { PostTag } from '@/data/posts'
import { tagColors } from '@/data/posts'
import { fadeUp, scaleIn } from '@/lib/animations'
import './PostCard.css'

// ─── Gradient placeholder when no image ─────────────────────────────────────
const gradientFallbacks = [
  'from-[#002b3d] via-[#001a26] to-[#020202]',
  'from-[#1e1b4b] via-[#0f0e2e] to-[#020202]',
  'from-[#0f172a] via-[#080f1c] to-[#020202]',
]

function gradientFor(id: string): string {
  const n = parseInt(id, 10)
  return gradientFallbacks[n % gradientFallbacks.length] ?? 'from-primary-container to-background'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })
}

// ─── Shared tag chip ─────────────────────────────────────────────────────────
export function TagChip({ tag }: { tag: PostTag }) {
  return (
    <span className={`tag-chip ${tagColors[tag]}`}>
      {tag}
    </span>
  )
}

// ─── Featured (full-width hero card) ─────────────────────────────────────────
export function PostCardFeatured({ post }: { post: Post }) {
  return (
    <motion.article
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.005, transition: { duration: 0.4 } }}
      className="post-card-featured group"
    >
      {post.cover_image ? (
        <img
          src={post.cover_image}
          alt=""
          className="post-card-featured-image"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFor(post.id)}`} />
      )}

      <div className="post-card-featured-overlay" />
      <div className="post-card-featured-watermark">01</div>

      <div className="post-card-featured-content">
        <div className="flex items-center gap-4 mb-5">
          <TagChip tag={post.tag} />
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
            {formatDate(post.published_at)} · {post.read_time} read
          </span>
        </div>
        <h2 className="post-card-featured-title">{post.title}</h2>
        <p className="post-card-featured-excerpt">{post.excerpt}</p>
        <div className="post-card-featured-cta">
          Read Signal
          <span className="material-symbols-outlined text-[16px]">north_east</span>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Standard grid card ───────────────────────────────────────────────────────
export function PostCardMedium({ post, index }: { post: Post; index: number }) {
  const indexStr = String(index + 1).padStart(2, '0')

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
      className="post-card-medium group"
    >
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt=""
            loading="lazy"
            className="post-card-medium-image"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientFor(post.id)}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        <span className="absolute top-4 left-5 text-[11px] font-black tracking-widest text-on-surface-variant/30">
          {indexStr}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <TagChip tag={post.tag} />
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
            {post.read_time}
          </span>
        </div>
        <h3 className="post-card-medium-title">{post.title}</h3>
        <p className="text-on-surface-variant text-sm font-light leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>
        <div className="post-card-medium-footer">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
            {formatDate(post.published_at)}
          </span>
          <span className="material-symbols-outlined text-primary text-[18px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
            north_east
          </span>
        </div>
      </div>
    </motion.article>
  )
}

// ─── Horizontal list row ──────────────────────────────────────────────────────
export function PostCardList({ post, index }: { post: Post; index: number }) {
  const indexStr = String(index + 1).padStart(2, '0')

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ x: 8, transition: { duration: 0.2, ease: 'easeOut' } }}
      className="post-card-list group"
    >
      <span className="text-[11px] font-black tracking-widest text-on-surface-variant/30 w-6 flex-shrink-0">
        {indexStr}
      </span>
      <div className="flex-shrink-0">
        <TagChip tag={post.tag} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="post-card-list-title">{post.title}</h3>
      </div>
      <div className="hidden md:flex items-center gap-6 flex-shrink-0">
        <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
          {formatDate(post.published_at)}
        </span>
        <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
          {post.read_time} read
        </span>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px] transition-colors flex-shrink-0">
        north_east
      </span>
    </motion.article>
  )
}
