import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, staggerContainer } from '@/lib/animations'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { fetchContent } from '@/api/content'
import { useAnalytics } from '@/hooks/useAnalytics'
import './ContactSection.css'

export default function ContactSection() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)
  const { track } = useAnalytics()

  useEffect(() => {
    fetchContent('contact').then(setContent).catch(console.error)
  }, [])

  const email = content.email ?? 'hello@lucasjanot.com'

  const handleCopyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      track('contact-copy-email')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }, [email, track])

  const reveal = useScrollReveal()

  return (
    <motion.section
      ref={reveal.ref}
      className="flex flex-col items-center text-center py-20 space-y-14"
      id="contact"
      aria-labelledby="contact-heading"
      variants={staggerContainer}
      initial="hidden"
      animate={reveal.animate}
    >
      <motion.p
        variants={fadeUp}
        className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
      >
        06 / Contact
      </motion.p>

      <motion.h2
        id="contact-heading"
        variants={fadeUp}
        className="contact-heading"
      >
        {content.heading ?? "Let's build"} <br />
        <span className="text-primary-dim">{content.heading_dim ?? 'together.'}</span>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        className="text-on-surface-variant font-light text-lg max-w-md leading-relaxed"
      >
        {content.subtitle ?? 'Have a project in mind, or just want to talk shop? Reach out.'}
      </motion.p>

      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
        <motion.button
          onClick={handleCopyEmail}
          whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(56,189,248,0.15)' }}
          whileTap={{ scale: 0.97 }}
          className="contact-email-btn group"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="material-symbols-outlined text-primary text-lg"
                style={{ width: 20, height: 20, lineHeight: 1 }}
              >
                check
              </motion.span>
            ) : (
              <motion.span
                key="mail"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-lg transition-colors"
                style={{ width: 20, height: 20, lineHeight: 1 }}
              >
                mail
              </motion.span>
            )}
          </AnimatePresence>
          <span className="text-on-surface font-semibold text-sm md:text-base tracking-tight">
            {email}
          </span>
        </motion.button>

        <AnimatePresence>
          {copied && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="contact-copied-msg"
            >
              Copied to clipboard
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  )
}
