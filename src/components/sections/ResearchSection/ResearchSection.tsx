import { research } from '@/data/content'

export default function ResearchSection() {
  return (
    <section id="research" className="scroll-mt-24 pt-20">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        Research
      </h2>

      <div className="mt-8 grid gap-8 rounded-2xl border border-slate-200 p-6 sm:p-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            {research.title}
          </h3>
          <p className="mt-1 text-sm font-semibold text-blue-600">{research.org}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{research.body}</p>

          <div className="mt-6 flex gap-10">
            {research.stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-extrabold text-slate-900">{stat.value}</div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <img
          src={research.image_url}
          alt={research.image_alt}
          loading="lazy"
          className="w-full rounded-xl border border-slate-200"
        />
      </div>
    </section>
  )
}
