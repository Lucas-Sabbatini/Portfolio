import { CV_URL, profile } from '@/data/content'

export default function HeroSection() {
  return (
    <section className="pb-16 pt-20 text-center sm:pt-28">
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        {profile.status}
      </span>

      <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        {profile.name}
      </h1>

      <p className="mt-3 text-base font-semibold text-blue-600 sm:text-lg">
        {profile.role}
      </p>

      <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
        {profile.summary}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`mailto:${profile.email}`}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Email me
        </a>
        <a
          href={CV_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700"
        >
          Download CV
        </a>
      </div>
    </section>
  )
}
