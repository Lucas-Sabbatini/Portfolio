import { CV_URL } from '@/data/content'

const navLinks = [
  { label: 'Experience', href: '#experience' },
  { label: 'Research', href: '#research' },
  { label: 'Stack', href: '#stack' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex max-w-content items-center justify-between px-6 py-3.5">
        <a href="/" className="text-sm font-bold tracking-tight text-slate-900">
          Lucas Janot
        </a>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-7 sm:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-slate-500 transition-colors hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
          </div>

          <a
            href={CV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            CV
          </a>
        </div>
      </nav>
    </header>
  )
}
