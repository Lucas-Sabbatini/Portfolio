import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { label: 'Work', href: '/#work' },
  { label: 'Research', href: '/#research' },
  { label: 'Experience', href: '/#experience' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/#contact' },
]

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { pathname } = useLocation()

  return (
    <motion.nav
      className="fixed top-0 w-full z-50 bg-[#020202]/60 backdrop-blur-2xl border-b border-white/5"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex justify-between items-center px-8 py-5 max-w-7xl mx-auto">
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
                    className={
                      isActive && link.href === '/blog'
                        ? 'text-primary font-bold border-b-2 border-primary pb-1'
                        : 'text-on-surface/50 hover:text-primary transition-all px-2 py-1'
                    }
                  >
                    {link.label}
                  </Link>
                )
              })}
            </motion.div>

            <motion.button
              className="bg-primary hover:bg-primary-dim text-on-primary font-bold tracking-wider text-[10px] uppercase px-4 py-2 md:px-6 md:py-2.5 rounded-full transition-all hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
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
