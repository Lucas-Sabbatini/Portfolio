import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerFast } from '@/lib/animations'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { Skill } from '@/types/skill'
import { fetchSkills } from '@/api/content'
import './SkillsSection.css'

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
  const reveal1 = useScrollReveal()
  const reveal2 = useScrollReveal()

  useEffect(() => {
    fetchSkills()
      .then(setSkills)
      .catch(() => setError(true))
  }, [])

  return (
    <section className="space-y-12">
      <motion.p
        ref={reveal1.ref}
        variants={fadeUp}
        initial="hidden"
        animate={reveal1.animate}
        className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
      >
        04 / Core Stack
      </motion.p>

      {error && skills.length === 0 && (
        <p className="text-on-surface-variant text-sm">Unable to load skills.</p>
      )}

      <motion.div
        ref={reveal2.ref}
        className="flex flex-wrap gap-4 justify-center"
        variants={staggerFast}
        initial="hidden"
        animate={reveal2.animate}
      >
        {skills.map((skill) => (
          <motion.span
            key={skill.id}
            variants={pill}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            whileTap={{ scale: 0.95 }}
            className="skill-pill"
          >
            {skill.icon && (
              <img src={skill.icon} height="40" width="50" alt="" className="inline-block" aria-hidden="true" />
            )}
            <span className="sr-only">{skill.name}</span>
          </motion.span>
        ))}
      </motion.div>
    </section>
  )
}
