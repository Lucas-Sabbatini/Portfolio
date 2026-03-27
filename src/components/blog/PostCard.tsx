import { motion } from 'framer-motion'
import type { Post } from '../../api/posts'
import type { PostTag } from '../../data/posts'
import { tagColors } from '../../data/posts'
import { fadeUp, scaleIn } from '../../lib/animations'

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
    <span
      className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border backdrop-blur-md ${tagColors[tag]}`}
    >
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
      className="glass-card rounded-[2.5rem] overflow-hidden relative group cursor-pointer h-[480px] md:h-[560px]"
    >
      {post.cover_image ? (
        <img
          src={post.cover_image}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:opacity-50 group-hover:grayscale-0 transition-all duration-1000"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFor(post.id)}`} />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Index watermark */}
      <div className="absolute top-8 right-10 text-[120px] font-extrabold leading-none text-white/[0.03] font-headline select-none">
        01
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
        <div className="flex items-center gap-4 mb-5">
          <TagChip tag={post.tag} />
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
            {formatDate(post.published_at)} · {post.read_time} read
          </span>
        </div>
        <h2 className="font-headline font-extrabold text-3xl md:text-5xl tracking-tighter text-on-surface leading-tight max-w-2xl mb-4">
          {post.title}
        </h2>
        <p className="text-on-surface-variant text-base md:text-lg font-light leading-relaxed max-w-2xl line-clamp-2 mb-6">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-widest group-hover:gap-4 transition-all">
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
      className="glass-card rounded-[2rem] overflow-hidden relative group cursor-pointer flex flex-col"
    >
      {/* Image or gradient */}
      <div className="relative h-48 overflow-hidden flex-shrink-0">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover opacity-25 grayscale group-hover:opacity-50 group-hover:grayscale-0 transition-all duration-700"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientFor(post.id)}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80" />
        {/* Index */}
        <span className="absolute top-4 left-5 text-[11px] font-black tracking-widest text-on-surface-variant/30">
          {indexStr}
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-4">
          <TagChip tag={post.tag} />
          <span className="text-on-surface-variant text-[9px] font-bold uppercase tracking-widest">
            {post.read_time}
          </span>
        </div>
        <h3 className="font-headline font-bold text-xl tracking-tight text-on-surface leading-tight mb-3 group-hover:text-primary transition-colors duration-300">
          {post.title}
        </h3>
        <p className="text-on-surface-variant text-sm font-light leading-relaxed line-clamp-3 flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
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
      className="flex items-center gap-6 md:gap-10 py-6 border-b border-white/5 group cursor-pointer"
    >
      <span className="text-[11px] font-black tracking-widest text-on-surface-variant/30 w-6 flex-shrink-0">
        {indexStr}
      </span>
      <div className="flex-shrink-0">
        <TagChip tag={post.tag} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-headline font-bold text-base md:text-lg tracking-tight text-on-surface truncate group-hover:text-primary transition-colors duration-200">
          {post.title}
        </h3>
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
