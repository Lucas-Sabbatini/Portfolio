import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, slideLeft, staggerContainer, viewportOnce } from '@/lib/animations'
import type { ExperienceEntry } from '@/types/experience'
import { fetchExperience } from '@/api/content'
import './ExperienceSection.css'

export default function ExperienceSection() {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchExperience()
      .then(setExperiences)
      .catch(() => setError(true))
  }, [])

  const sorted = [...experiences].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section className="space-y-16" id="experience" aria-label="Experience timeline">
      <motion.div
        className="flex justify-between items-end border-b border-white/5 pb-8"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <p className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60">
          02 / Timeline
        </p>
        <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest opacity-40">
          System History
        </span>
      </motion.div>

      {error && sorted.length === 0 && (
        <p className="text-on-surface-variant text-sm">Unable to load experience data.</p>
      )}

      <motion.div
        className="experience-timeline"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {sorted.map((entry, idx) => {
          const isActive = idx === 0
          return (
            <motion.div key={entry.id} variants={slideLeft} className="experience-node group">
              <div className="experience-dot-wrapper">
                <span className={isActive ? 'experience-dot-active' : 'experience-dot-inactive'} />
              </div>

              <motion.div
                className="experience-card"
                whileHover={{ x: 3, transition: { duration: 0.25, ease: 'easeOut' } }}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                  <div>
                    <h2 className="text-3xl font-bold text-on-surface tracking-tight">
                      {entry.role}
                    </h2>
                    <p className={isActive ? 'experience-company-active' : 'experience-company-inactive'}>
                      {entry.company} • {entry.period}
                    </p>
                  </div>
                  {isActive && (
                    <span className="experience-badge">Active</span>
                  )}
                </div>
                <ul className="experience-bullets">
                  {entry.description.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
