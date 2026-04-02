import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, viewportOnce } from '../lib/animations'

export default function ContactSection() {

  return (
    <motion.section
      className="flex flex-col items-center text-center py-20 space-y-12"
      id="contact"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      <motion.h2
        variants={fadeUp}
        className="font-bold text-[10px] uppercase tracking-[0.6em] text-primary/60"
      >
        06 / Contact
      </motion.h2>

      <motion.h3
        variants={fadeUp}
        className="font-headline text-6xl md:text-[8rem] font-extrabold tracking-tighter leading-none"
      >
        Let's build <br />
        <span className="text-primary-dim">together.</span>
      </motion.h3>

    </motion.section>
  )
}
