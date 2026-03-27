import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, staggerContainer, staggerFast, viewportOnce } from '../lib/animations'
import type { SocialLink } from '../api/content'
import { fetchSocialLinks } from '../api/content'

export default function ContactSection() {
  const [links, setLinks] = useState<SocialLink[]>([])

  useEffect(() => {
    fetchSocialLinks().then(setLinks).catch(console.error)
  }, [])

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

      <motion.div
        className="flex flex-wrap justify-center gap-4 pt-10"
        variants={staggerFast}
      >
        {links.map((link) => (
          <motion.a
            key={link.id}
            href={link.url}
            variants={fadeUp}
            whileHover={{ scale: 1.06, y: -3, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.96 }}
            className="glass-card px-6 py-3 md:px-10 md:py-5 rounded-full hover:bg-primary/10 transition-all font-bold uppercase tracking-widest text-[10px]"
          >
            {link.label}
          </motion.a>
        ))}
      </motion.div>
    </motion.section>
  )
}
