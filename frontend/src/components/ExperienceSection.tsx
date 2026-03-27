import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, slideLeft, staggerContainer, viewportOnce } from '../lib/animations'
import type { ExperienceEntry } from '../api/content'
import { fetchExperience } from '../api/content'

export default function ExperienceSection() {
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([])

  useEffect(() => {
    fetchExperience().then(setExperiences).catch(console.error)
  }, [])

  const sorted = [...experiences].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section className="space-y-16" id="experience">
      <motion.div
        className="flex justify-between items-end border-b border-white/5 pb-8"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <h2 className="font-bold text-[10px] uppercase tracking-[0.6em] text-primary/60">
          02 / Timeline
        </h2>
        <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest opacity-40">
          System History
        </span>
      </motion.div>

      <motion.div
        className="relative space-y-16 before:content-[''] before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[1px] before:bg-gradient-to-b before:from-primary/40 before:to-transparent"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {sorted.map((entry, idx) => {
          const isActive = idx === 0
          return (
            <motion.div
              key={entry.id}
              variants={slideLeft}
              className="relative pl-14 group"
            >
              <motion.div
                className="absolute left-0 top-1.5 w-[35px] h-[35px] rounded-full glass-card flex items-center justify-center z-10"
                whileHover={{ scale: 1.2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-primary/40'}`}
                />
              </motion.div>

              <motion.div
                className="glass-card p-10 rounded-[2.5rem]"
                whileHover={{ x: 3, transition: { duration: 0.25, ease: 'easeOut' } }}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                  <div>
                    <h3 className="text-3xl font-bold text-on-surface tracking-tight">
                      {entry.role}
                    </h3>
                    <p
                      className={`font-bold uppercase tracking-[0.2em] text-[10px] mt-2 ${isActive ? 'text-primary' : 'text-primary/60'}`}
                    >
                      {entry.company} • {entry.period}
                    </p>
                  </div>
                  {isActive && (
                    <span className="bg-primary/10 px-4 py-1.5 rounded-full text-[9px] uppercase font-black tracking-widest border border-primary/20 text-primary self-start">
                      Active
                    </span>
                  )}
                </div>
                <ul className="mt-6 text-on-surface-variant text-lg leading-relaxed max-w-4xl font-light list-disc list-inside space-y-1">
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
