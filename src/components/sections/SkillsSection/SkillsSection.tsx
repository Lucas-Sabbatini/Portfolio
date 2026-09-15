import { skillCategories, skills } from '@/data/content'

const categoryLabels: Record<string, string> = {
  Language: 'Languages',
  Framework: 'Frameworks',
  Database: 'Databases',
  Cloud: 'Cloud',
}

export default function SkillsSection() {
  return (
    <section id="stack" className="scroll-mt-24 pt-20">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        Stack
      </h2>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {skillCategories.map((category) => {
          const items = skills
            .filter((skill) => skill.category === category)
            .sort((a, b) => a.sort_order - b.sort_order)

          if (items.length === 0) return null

          return (
            <div key={category} className="rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {categoryLabels[category] ?? category}
              </h3>

              <ul className="mt-4 flex flex-wrap gap-2">
                {items.map((skill) => (
                  <li
                    key={skill.id}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    {skill.icon && (
                      <img src={skill.icon} alt="" className="h-4 w-4" />
                    )}
                    {skill.name}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
