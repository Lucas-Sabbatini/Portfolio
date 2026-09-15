import { motion } from 'framer-motion'
import { fadeUp, fadeIn, scaleIn, staggerContainer } from '@/lib/animations'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { research } from '@/data/content'
import './ResearchSection.css'

export default function ResearchSection() {
  const reveal1 = useScrollReveal()
  const reveal2 = useScrollReveal()
  const reveal3 = useScrollReveal()

  return (
    <section className="relative" id="research" aria-labelledby="research-heading">
      <div className="absolute -inset-10 bg-primary/10 blur-[150px] rounded-full -z-10 opacity-30" />

      <motion.div
        ref={reveal1.ref}
        className="research-card"
        variants={scaleIn}
        initial="hidden"
        animate={reveal1.animate}
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            ref={reveal2.ref}
            className="space-y-10"
            variants={staggerContainer}
            initial="hidden"
            animate={reveal2.animate}
          >
            <motion.p
              variants={fadeUp}
              className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
            >
              {research.section_label}
            </motion.p>
            <motion.h2
              id="research-heading"
              variants={fadeUp}
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter"
            >
              {research.title_line1} <br />
              {research.title_line2}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-on-surface-variant text-xl leading-relaxed font-light"
            >
              {research.body}
            </motion.p>

            <motion.div variants={fadeUp} className="flex gap-12">
              {research.stats.map((stat, i) => (
                <div key={stat.label} className="flex gap-12 items-center">
                  {i > 0 && (
                    <div className="w-[1px] h-14 bg-white/10" />
                  )}
                  <motion.div
                    className="flex flex-col"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <span className="text-primary text-4xl font-extrabold tracking-tight">
                      {stat.value}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-on-surface-variant mt-1">
                      {stat.label}
                    </span>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            ref={reveal3.ref}
            className="research-image-wrapper group"
            variants={fadeIn}
            initial="hidden"
            animate={reveal3.animate}
            whileHover={{ y: -4, transition: { duration: 0.4 } }}
          >
            <img
              src={research.image_url}
              alt="Neural Topology"
              loading="lazy"
              className="research-image"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
