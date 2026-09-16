import { socialLinks } from '@/data/content'

interface SocialLinksProps {
  className?: string
  showLabels?: boolean
}

export default function SocialLinks({ className = '', showLabels = true }: SocialLinksProps) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      {socialLinks.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            title={link.label}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            {link.icon && (
              <img src={link.icon} alt="" className={showLabels ? 'h-4 w-4' : 'h-5 w-5'} />
            )}
            {showLabels && link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
