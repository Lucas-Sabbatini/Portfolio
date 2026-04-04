import { useState, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, fadeIn } from '../lib/animations'
import { fetchContent } from '../api/content'
import { useAnalytics } from '../hooks/useAnalytics'
import Skeleton from './Skeleton'

function styledHeadline(text: string): ReactNode {
  return text.split(/(\([^)]+\))/).map((part, i) =>
    part.startsWith('(') && part.endsWith(')')
      ? <span key={i} className="text-primary-dim">{part.slice(1, -1)}</span>
      : part
  )
}

export default function HeroSection() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const { track } = useAnalytics()

  useEffect(() => {
    fetchContent('hero').then(setContent).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <motion.section
      className="flex flex-col items-start gap-10"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={fadeIn}
        transition={{ delay: 0.6 }}
        className="inline-flex items-center gap-2.5 px-4 py-2.5 min-h-[44px] rounded-full bg-primary/5 border border-primary/20 text-primary font-bold text-[10px] tracking-widest uppercase"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse" />
        {loading ? <Skeleton /> : (content.status_badge ?? 'Operational')}
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="font-display font-extrabold text-4xl sm:text-5xl md:text-[6rem] tracking-tighter max-w-5xl leading-[1.1] text-on-surface"
      >
        {loading ? <Skeleton /> : styledHeadline(content.headline_line1 ?? 'Building')} <br />
        {loading ? <Skeleton /> : styledHeadline(content.headline_line2 ?? 'at scale')}<span className="text-primary-dim">.</span>
      </motion.h1>

      <motion.div
        variants={staggerContainer}
        className="flex flex-wrap gap-6 mt-6"
      >
        <motion.a
          href={loading ? undefined : (content.cta_primary_link ?? '#')}
          aria-disabled={loading}
          variants={fadeUp}
          whileHover={loading ? undefined : { y: -2 }}
          whileTap={loading ? undefined : { scale: 0.97 }}
          onClick={(e) => {
            if (loading) { e.preventDefault(); return }
            track('cta-click', { label: content.cta_primary ?? 'Explore Works' })
          }}
          className={`flex items-center gap-2 glass-card px-6 py-3 md:px-10 md:py-5 rounded-full text-sm md:text-base text-on-surface font-semibold group hover:bg-white/5 ${loading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {loading ? <Skeleton /> : (content.cta_primary ?? 'Explore Works')}
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            north_east
          </span>
        </motion.a>

        <motion.a
          href={loading ? undefined : (content.cta_secondary_link ?? '#')}
          aria-disabled={loading}
          variants={fadeUp}
          whileHover={loading ? undefined : { x: 4 }}
          onClick={(e) => {
            if (loading) { e.preventDefault(); return }
            track('cta-click', { label: content.cta_secondary ?? 'Research Lab' })
          }}
          className={`flex items-center gap-3 px-5 py-3 md:px-10 md:py-5 min-h-[44px] rounded-full text-on-surface-variant hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px] ${loading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {loading ? <Skeleton /> : (content.cta_secondary ?? 'Research Lab')}
        </motion.a>
      </motion.div>
    </motion.section>
  )
}
