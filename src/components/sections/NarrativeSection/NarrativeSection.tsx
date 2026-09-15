import { motion } from 'framer-motion'
import { fadeUp, scaleIn, staggerContainer, staggerFast } from '@/lib/animations'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { narrative } from '@/data/content'
import './NarrativeSection.css'

export default function NarrativeSection() {
  const reveal1 = useScrollReveal()
  const reveal2 = useScrollReveal()

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-12" id="work" aria-labelledby="work-heading">
      <motion.div
        ref={reveal1.ref}
        className="lg:col-span-7 flex flex-col justify-center space-y-10"
        variants={staggerContainer}
        initial="hidden"
        animate={reveal1.animate}
      >
        <motion.p
          variants={fadeUp}
          className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
        >
          {narrative.section_label}
        </motion.p>
        <motion.h2
          id="work-heading"
          variants={fadeUp}
          className="font-headline text-3xl md:text-5xl font-light text-on-surface leading-tight"
        >
          {narrative.body}
        </motion.h2>
      </motion.div>

      <motion.div
        ref={reveal2.ref}
        className="lg:col-span-5 grid grid-cols-2 gap-4"
        variants={staggerFast}
        initial="hidden"
        animate={reveal2.animate}
      >
        {narrative.stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={scaleIn}
            whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
            className="narrative-stat-card"
          >
            <span className="text-primary/60 text-[10px] uppercase font-bold tracking-widest">
              {stat.label}
            </span>
            <div className="flex flex-col">
              <span className={stat.small ? 'narrative-stat-value-small' : 'narrative-stat-value-large'}>
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
