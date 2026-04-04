import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerFast, viewportOnce } from '../lib/animations'
import type { Skill } from '../api/content'
import { fetchSkills } from '../api/content'

const pill: import('framer-motion').Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
}

export default function SkillsSection() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchSkills()
      .then(setSkills)
      .catch(() => setError(true))
  }, [])

  return (
    <section className="space-y-12">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
      >
        04 / Core Stack
      </motion.h2>

      {error && skills.length === 0 && (
        <p className="text-on-surface-variant text-sm">Unable to load skills.</p>
      )}

      <motion.div
        className="flex flex-wrap gap-4 justify-center"
        variants={staggerFast}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {skills.map((skill) => (
          <motion.span
            key={skill.id}
            variants={pill}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
            className="solid-card px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2.5"
            role="img"
            aria-label={skill.name}
          >
            {skill.icon && (
              <img src={skill.icon} height="40" width="50" alt={skill.name} className="inline-block" aria-hidden="true" />
            )}
            <span className="sr-only">{skill.name}</span>
          </motion.span>
        ))}
      </motion.div>
    </section>
  )
}
