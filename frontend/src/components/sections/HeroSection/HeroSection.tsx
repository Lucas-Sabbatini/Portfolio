import { useState, useEffect, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, fadeIn } from '@/lib/animations'
import { fetchContent } from '@/api/content'
import { useAnalytics } from '@/hooks/useAnalytics'
import Skeleton from '@/components/shared/Skeleton'
import './HeroSection.css'

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
        className="hero-status-badge"
      >
        <span className="hero-status-dot" />
        {loading ? <Skeleton /> : (content.status_badge ?? 'Operational')}
      </motion.div>

      <motion.h1 variants={fadeUp} className="hero-title">
        {loading ? <Skeleton /> : styledHeadline(content.headline_line1 ?? 'Building')} <br />
        {loading ? <Skeleton /> : styledHeadline(content.headline_line2 ?? 'at scale')}<span className="text-primary-dim">.</span>
      </motion.h1>

      <motion.div variants={staggerContainer} className="flex flex-wrap gap-6 mt-6">
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
          className={`hero-cta-primary group${loading ? ' hero-cta-loading' : ''}`}
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
          className={`hero-cta-secondary${loading ? ' hero-cta-loading' : ''}`}
        >
          {loading ? <Skeleton /> : (content.cta_secondary ?? 'Research Lab')}
        </motion.a>
      </motion.div>
    </motion.section>
  )
}
