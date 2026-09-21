import { skills } from '@/data/content'

export default function SkillsSection() {
  const sorted = [...skills].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <section id="stack" className="pt-20">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
        Stack
      </h2>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {sorted.map((skill) => (
          <span
            key={skill.id}
            title={skill.name}
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-6 py-3 transition-colors hover:border-blue-300"
          >
            {skill.icon && <img src={skill.icon} alt="" className="h-7 w-7" />}
            <span className="sr-only">{skill.name}</span>
          </span>
        ))}
      </div>
    </section>
  )
}
