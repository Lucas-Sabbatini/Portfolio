import { experiences } from '@/data/content'

export default function ExperienceSection() {
  const sorted = [...experiences].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section id="experience" className="pt-20">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        Experience
      </h2>

      <div className="mt-8 space-y-4">
        {sorted.map((entry) => (
          <article
            key={entry.id}
            className="rounded-2xl border border-slate-200 p-6 transition-colors hover:border-slate-300 sm:p-8"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                {entry.role}
              </h3>
              <span className="text-sm text-slate-400">{entry.period}</span>
            </div>

            <p className="mt-1 text-sm font-semibold text-blue-600">{entry.company}</p>

            <ul className="mt-4 space-y-2.5">
              {entry.description.map((bullet, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
