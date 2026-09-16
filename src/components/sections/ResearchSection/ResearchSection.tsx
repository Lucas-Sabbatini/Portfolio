import { Annotation } from '@/components/annotations'
import { research } from '@/data/content'

export default function ResearchSection() {
  return (
    <section id="research" className="pt-20">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        Research
      </h2>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            {research.title}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-slate-500">{research.org}</p>

          <ul className="mt-4 space-y-2">
            {research.bullets.map((bullet, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                <span>{bullet}</span>
              </li>
            ))}
            {research.stats.map((stat) => (
              <li key={stat.label} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                <span>
                  <span className="font-semibold text-slate-900">{stat.value}</span>{' '}
                  {stat.label.toLowerCase()}
                </span>
              </li>
            ))}
            <li className="flex gap-3 text-sm leading-relaxed text-slate-600">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
              <Annotation type="underline">
                <a
                  href={research.doi.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  DOI: {research.doi.label}
                </a>
              </Annotation>
            </li>
          </ul>
        </div>

        <img
          src={research.image_url}
          alt={research.image_alt}
          loading="lazy"
          className="w-40 rounded-2xl lg:w-56"
        />
      </div>
    </section>
  )
}
