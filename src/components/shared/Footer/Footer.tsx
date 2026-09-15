import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import type { SocialLink } from '@/types/social'
import { footer, socialLinks } from '@/data/content'
import './Footer.css'

function SocialIcon({ icon, color }: { icon: string; color?: string }) {
  const isUrl = icon.startsWith('http://') || icon.startsWith('https://')

  if (isUrl && color && icon.toLowerCase().includes('.svg')) {
    return (
      <span
        className="social-icon-mask"
        style={{
          backgroundColor: color,
          WebkitMaskImage: `url(${icon})`,
          maskImage: `url(${icon})`,
        }}
      />
    )
  }

  if (isUrl) {
    return <img src={icon} alt="" className="social-icon-img" />
  }

  return (
    <span
      className="material-symbols-outlined material-icon-sm"
      style={{ color: color || undefined }}
    >
      {icon}
    </span>
  )
}

export default function Footer() {
  const reveal = useScrollReveal()
  const links: SocialLink[] = [...socialLinks].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <motion.footer
      ref={reveal.ref}
      className="w-full py-16 border-t border-white/5 bg-[#020202]"
      variants={fadeUp}
      initial="hidden"
      animate={reveal.animate}
    >
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-10">
        <div className="text-xl font-black text-on-surface md:flex-1">lucas.janot</div>

        <div className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em]">
          {links.map((link) => (
            <a key={link.id} href={link.url} className="footer-link">
              {link.icon && <SocialIcon icon={link.icon} color={link.color} />}
              {link.label && <span>{link.label}</span>}
            </a>
          ))}
        </div>

        <p className="footer-copyright">
          {footer.copyright} <br /> {footer.tagline}
        </p>
      </div>
    </motion.footer>
  )
}
