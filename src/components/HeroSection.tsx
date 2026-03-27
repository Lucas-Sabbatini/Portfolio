import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, fadeIn } from '../lib/animations'
import { fetchContent } from '../api/content'
import { useAnalytics } from '../hooks/useAnalytics'

const Skeleton = () => (
  <span className="inline-block w-32 h-6 rounded bg-white/5 animate-pulse" />
)

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
        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary font-bold text-[10px] tracking-widest uppercase"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse" />
        {loading ? <Skeleton /> : (content.status_badge ?? 'Operational')}
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="font-headline font-extrabold text-6xl md:text-[9rem] tracking-tighter max-w-5xl leading-[0.85] text-on-surface"
      >
        {loading ? <Skeleton /> : (content.headline_line1 ?? 'Building')} <br />
        {loading ? <Skeleton /> : (content.headline_line2 ?? 'at scale')}<span className="text-primary-dim">.</span>
      </motion.h1>

      <motion.div
        variants={staggerContainer}
        className="flex flex-wrap gap-6 mt-6"
      >
        <motion.button
          variants={fadeUp}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => track('cta-click', { label: content.cta_primary ?? 'Explore Works' })}
          className="flex items-center gap-2 glass-card px-6 py-3 md:px-10 md:py-5 rounded-full text-sm md:text-base text-on-surface font-semibold group hover:bg-white/5"
        >
          {loading ? <Skeleton /> : (content.cta_primary ?? 'Explore Works')}
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            north_east
          </span>
        </motion.button>

        <motion.button
          variants={fadeUp}
          whileHover={{ x: 4 }}
          onClick={() => track('cta-click', { label: content.cta_secondary ?? 'Research Lab' })}
          className="flex items-center gap-3 px-5 py-3 md:px-10 md:py-5 rounded-full text-on-surface-variant hover:text-primary transition-colors font-bold uppercase tracking-widest text-[10px]"
        >
          {loading ? <Skeleton /> : (content.cta_secondary ?? 'Research Lab')}
        </motion.button>
      </motion.div>
    </motion.section>
  )
}
