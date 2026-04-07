import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import './Navbar.css'

const navLinks = [
  { label: 'Work', href: '/#work' },
  { label: 'Research', href: '/#research' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/#contact' },
]

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { pathname } = useLocation()
  const { track } = useAnalytics()

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
          <Link to="/" className="text-xl font-extrabold tracking-tight text-on-surface">
            lucas.janot
          </Link>
        </motion.div>

        {!minimal && (
          <>
            <motion.div
              className="hidden md:flex gap-10 font-medium tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {navLinks.map((link) => {
                const isActive =
                  link.href === '/blog' ? pathname === '/blog' : pathname === '/'
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => track('nav-click', { label: link.label })}
                    className={
                      isActive && link.href === '/blog' ? 'nav-link-active' : 'nav-link'
                    }
                  >
                    {link.label}
                  </Link>
                )
              })}
            </motion.div>

            <motion.button
              className="nav-cta"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              Resume
            </motion.button>
          </>
        )}
      </div>
    </motion.nav>
  )
}
