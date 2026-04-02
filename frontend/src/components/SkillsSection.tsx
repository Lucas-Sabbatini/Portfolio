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

  useEffect(() => {
    fetchSkills().then(setSkills).catch(console.error)
  }, [])

  return (
    <section className="space-y-12">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        className="font-bold text-[10px] uppercase tracking-[0.6em] text-primary/60"
      >
        04 / Core Stack
      </motion.h2>

      <motion.div
        className="flex flex-wrap gap-4"
        variants={staggerFast}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {skills.map((skill) => (
          <motion.span
            key={skill.id}
            variants={pill}
            whileHover={{ scale: 1.08, backgroundColor: 'rgba(56,189,248,0.1)', transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
            className="glass-card px-8 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] cursor-default flex items-center gap-2.5"
          >
            {skill.icon && (
              <span className="material-symbols-outlined text-primary/70 text-base leading-none">{skill.icon}</span>
            )}
            {skill.name}
          </motion.span>
        ))}
      </motion.div>
    </section>
  )
}
