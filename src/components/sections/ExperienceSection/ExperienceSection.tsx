import { Annotation } from '@/components/annotations'
import { experiences } from '@/data/content'

/** Renders a bullet, hand-circling the entry's key metric when present. */
function BulletText({ text, emphasis }: { text: string; emphasis?: string }) {
  if (!emphasis) return <>{text}</>

  const index = text.indexOf(emphasis)
  if (index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <Annotation type="circle">{emphasis}</Annotation>
      {text.slice(index + emphasis.length)}
    </>
  )
}

export default function ExperienceSection() {
  const sorted = [...experiences].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section id="experience" className="pt-20">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        Experience
      </h2>

      <div className="mt-8 divide-y divide-slate-100">
        {sorted.map((entry) => (
          <article key={entry.id} className="py-8 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="text-base font-bold tracking-tight text-slate-900">
                {entry.role}
              </h3>
              <span className="text-sm text-slate-400">{entry.period}</span>
            </div>

            <p className="mt-0.5 text-sm font-medium text-slate-500">{entry.company}</p>

            <ul className="mt-4 space-y-2">
              {entry.description.map((bullet, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-600">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-blue-400" />
                  <span>
                    <BulletText text={bullet} emphasis={entry.emphasis} />
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
