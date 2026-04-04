import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUp, staggerContainer, viewportOnce } from '../lib/animations'
import { fetchContent } from '../api/content'
import { useAnalytics } from '../hooks/useAnalytics'

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

  return (
    <motion.section
      className="flex flex-col items-center text-center py-20 space-y-14"
      id="contact"
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      <motion.h2
        variants={fadeUp}
        className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
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

      <motion.p
        variants={fadeUp}
        className="text-on-surface-variant font-light text-lg max-w-md leading-relaxed"
      >
        {content.subtitle ?? 'Have a project in mind, or just want to talk shop? Reach out.'}
      </motion.p>

      {/* ── Email CTA ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
        <motion.button
          onClick={handleCopyEmail}
          whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(56,189,248,0.15)' }}
          whileTap={{ scale: 0.97 }}
          className="glass-card px-8 py-4 md:px-12 md:py-5 rounded-full flex items-center gap-3 group"
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
              className="text-primary text-xs font-bold uppercase tracking-widest"
            >
              Copied to clipboard
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.section>
  )
}
