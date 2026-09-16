import { Annotation } from '@/components/annotations'
import type { ExperienceMark } from '@/types/experience'
import { experiences } from '@/data/content'

/** Renders a bullet, hand-marking the entry's key phrase when present. */
function BulletText({ text, mark }: { text: string; mark?: ExperienceMark }) {
  const index = mark ? text.indexOf(mark.text) : -1
  if (!mark || index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <Annotation type={mark.type ?? 'underline'}>{mark.text}</Annotation>
      {text.slice(index + mark.text.length)}
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
                    <BulletText text={bullet} mark={entry.mark} />
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
