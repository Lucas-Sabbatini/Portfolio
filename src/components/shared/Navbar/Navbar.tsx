import { motion } from 'framer-motion'
import { CV_URL } from '@/data/content'
import './Navbar.css'

const navLinks = [
  { label: 'Work', href: '#work' },
  { label: 'Research', href: '#research' },
  { label: 'Experience', href: '#experience' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  return (
    <motion.nav
      className="nav-bar"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="nav-inner">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <a href="/" className="text-xl font-extrabold tracking-tight text-on-surface">
            lucas.janot
          </a>
        </motion.div>

        <motion.div
          className="flex items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="hidden md:flex gap-10 font-medium tracking-tight">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </div>

          <a
            href={CV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-cv"
          >
            CV
          </a>
        </motion.div>
      </div>
    </motion.nav>
  )
}
