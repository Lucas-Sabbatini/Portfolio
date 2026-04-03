import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, viewportOnce } from '../lib/animations'
import type { SocialLink } from '../api/content'
import { fetchSocialLinks } from '../api/content'

function SocialIcon({ icon, color }: { icon: string; color?: string }) {
  const isUrl = icon.startsWith('http://') || icon.startsWith('https://')

  if (isUrl && color && icon.toLowerCase().includes('.svg')) {
    return (
      <span
        style={{
          display: 'inline-block',
          width: 18, height: 18,
          backgroundColor: color,
          WebkitMaskImage: `url(${icon})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskImage: `url(${icon})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
        }}
      />
    )
  }

  if (isUrl) {
    return <img src={icon} alt="" className="w-[18px] h-[18px] object-contain" style={{ width: 18, height: 18 }} />
  }

  return (
    <span
      className="material-symbols-outlined"
      style={{ fontSize: 18, lineHeight: 1, color: color || undefined }}
    >
      {icon}
    </span>
  )
}

export default function Footer() {
  const [links, setLinks] = useState<SocialLink[]>([])

  useEffect(() => {
    fetchSocialLinks()
      .then(all => setLinks([...all].sort((a, b) => a.sort_order - b.sort_order).slice(0, 3)))
      .catch(console.error)
  }, [])

  return (
    <motion.footer
      className="w-full py-16 border-t border-white/5 bg-[#020202]"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
    >
      <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-10">
        <div className="text-xl font-black text-on-surface">lucas.janot</div>

        <div className="flex gap-10 text-[10px] font-bold uppercase tracking-[0.2em]">
          {links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              className="text-on-surface/40 hover:text-primary transition-all flex items-center gap-1.5"
            >
              {link.icon && <SocialIcon icon={link.icon} color={link.color} />}
              {link.label && <span>{link.label}</span>}
            </a>
          ))}
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface/40 text-center md:text-right leading-loose">
          © 2024 Lucas Janot. <br /> Built on Obsidian Principles.
        </p>
      </div>
    </motion.footer>
  )
}
