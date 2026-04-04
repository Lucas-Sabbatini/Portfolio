import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, scaleIn, staggerContainer, staggerFast, viewportOnce } from '../lib/animations'
import { fetchContent } from '../api/content'

const defaultStats = [
  { label: 'Experience', value: '2+', sub: 'Circuits', small: false },
  { label: 'Linguistics', value: 'C2', sub: 'Level', small: true },
  { label: 'Architected', value: '3', sub: 'Monoliths', small: false },
  { label: 'Papers', value: '608', sub: 'Indexed', small: false },
]

function buildStats(content: Record<string, string>) {
  return [1, 2, 3, 4].map((i) => ({
    label: content[`stat_${i}_label`] ?? defaultStats[i - 1].label,
    value: content[`stat_${i}_value`] ?? defaultStats[i - 1].value,
    sub: content[`stat_${i}_sub`] ?? defaultStats[i - 1].sub,
    small: content[`stat_${i}_small`] != null ? content[`stat_${i}_small`] === 'true' : defaultStats[i - 1].small,
  }))
}

const Skeleton = () => (
  <span className="inline-block w-32 h-6 rounded bg-white/5 animate-pulse" />
)

export default function NarrativeSection() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent('narrative').then(setContent).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12" id="work">
      <motion.div
        className="lg:col-span-7 flex flex-col justify-center space-y-10"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <motion.h2
          variants={fadeUp}
          className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
        >
          {loading ? <Skeleton /> : (content.section_label ?? '01 / Philosophy')}
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="font-headline text-3xl md:text-5xl font-light text-on-surface leading-tight"
        >
          {loading ? <Skeleton /> : (content.body ?? 'Fusing mathematical rigor with intuitive interfaces. Architecting the next generation of neural systems.')}
        </motion.p>
      </motion.div>

      <motion.div
        className="lg:col-span-5 grid grid-cols-2 gap-4"
        variants={staggerFast}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        {buildStats(content).map((stat) => (
          <motion.div
            key={stat.label}
            variants={scaleIn}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="glass-card p-5 sm:p-7 md:p-8 rounded-[2rem] flex flex-col justify-between aspect-square"
          >
            <span className="text-primary/60 text-[10px] uppercase font-bold tracking-widest">
              {stat.label}
            </span>
            <div className="flex flex-col">
              <span
                className={`font-extrabold font-headline leading-none ${stat.small ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl md:text-6xl'}`}
              >
                {stat.value}
                {stat.small && (
                  <>
                    <br />
                    {stat.sub}
                  </>
                )}
              </span>
              {!stat.small && (
                <span className="text-[11px] font-medium text-on-surface-variant mt-1.5">
                  {stat.sub}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
