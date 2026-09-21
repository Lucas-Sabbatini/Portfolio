import { facts } from '@/data/content'

export default function FactsSection() {
  return (
    <section aria-label="Quick facts" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
        >
          <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {fact.label}
          </div>
          <div className="mt-1 text-base font-bold text-slate-900">{fact.value}</div>
        </div>
      ))}
    </section>
  )
}
