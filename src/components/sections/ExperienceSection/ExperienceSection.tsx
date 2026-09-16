import { Annotation } from '@/components/annotations'
import type { ExperienceMark } from '@/types/experience'
import { experiences } from '@/data/content'

/**
 * Renders a bullet, hand-marking the earliest key phrase it contains and
 * recursing on the remainder so a bullet can carry more than one mark.
 */
function BulletText({ text, marks }: { text: string; marks?: ExperienceMark[] }) {
  if (!marks?.length) return <>{text}</>

  let best: { mark: ExperienceMark; index: number } | null = null
  for (const mark of marks) {
    const index = text.indexOf(mark.text)
    if (index !== -1 && (best === null || index < best.index)) best = { mark, index }
  }

  if (best === null) return <>{text}</>

  const { mark, index } = best
  return (
    <>
      {text.slice(0, index)}
      <Annotation type={mark.type ?? 'underline'}>{mark.text}</Annotation>
      <BulletText text={text.slice(index + mark.text.length)} marks={marks} />
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
                    <BulletText text={bullet} marks={entry.marks} />
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
