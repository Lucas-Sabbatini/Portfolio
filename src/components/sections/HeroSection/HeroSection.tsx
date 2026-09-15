import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, fadeIn } from '@/lib/animations'
import { hero } from '@/data/content'
import './HeroSection.css'

function styledHeadline(text: string): ReactNode {
  return text.split(/(\([^)]+\))/).map((part, i) =>
    part.startsWith('(') && part.endsWith(')')
      ? <span key={i} className="text-primary-dim">{part.slice(1, -1)}</span>
      : part
  )
}

export default function HeroSection() {
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
        {hero.status_badge}
      </motion.div>

      <motion.h1 variants={fadeUp} className="hero-title">
        {styledHeadline(hero.headline_line1)} <br />
        {styledHeadline(hero.headline_line2)}<span className="text-primary-dim">.</span>
      </motion.h1>

      <motion.div variants={staggerContainer} className="flex flex-wrap gap-6 mt-6">
        <motion.a
          href={hero.cta_primary_link}
          variants={fadeUp}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="hero-cta-primary group"
        >
          {hero.cta_primary}
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            north_east
          </span>
        </motion.a>

        <motion.a
          href={hero.cta_secondary_link}
          target="_blank"
          rel="noopener noreferrer"
          variants={fadeUp}
          whileHover={{ x: 4 }}
          className="hero-cta-secondary"
        >
          {hero.cta_secondary}
        </motion.a>
      </motion.div>
    </motion.section>
  )
}
