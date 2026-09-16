import { socialLinks } from '@/data/content'

export default function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-5 gap-y-2 ${className}`}>
      {socialLinks.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
          >
            {link.icon && <img src={link.icon} alt="" className="h-4 w-4" />}
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
