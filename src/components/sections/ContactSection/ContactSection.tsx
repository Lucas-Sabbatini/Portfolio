import { useCallback, useState } from 'react'
import { SketchArrow } from '@/components/annotations'
import SocialLinks from '@/components/shared/SocialLinks/SocialLinks'
import { CV_URL, profile } from '@/data/content'

export default function ContactSection() {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }, [])

  return (
    <section id="contact" className="w-full bg-slate-50">
      <div className="mx-auto max-w-content px-6 py-16 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
          Contact
        </h2>

        <div className="relative mt-6 inline-flex flex-wrap items-center justify-center gap-3">
          <SketchArrow className="absolute -left-14 top-1/2 hidden -translate-y-1/2 text-blue-500 sm:block" />

          <button
            type="button"
            onClick={handleCopy}
            title="Copy email to clipboard"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-base" aria-hidden="true">
              {copied ? 'check' : 'mail'}
            </span>
            {copied ? 'Copied' : profile.email}
          </button>

          <a
            href={CV_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
          >
            Download CV
          </a>
        </div>

        <SocialLinks className="mt-8 justify-center" />
      </div>
    </section>
  )
}
