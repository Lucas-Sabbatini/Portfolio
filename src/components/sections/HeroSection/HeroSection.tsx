import { Annotation } from '@/components/annotations'
import { profile } from '@/data/content'

export default function HeroSection() {
  const index = profile.role.indexOf(profile.roleEmphasis)
  const hasEmphasis = index !== -1
  const lead = hasEmphasis ? profile.role.slice(0, index) : profile.role

  return (
    <section className="pb-14 pt-16">
      <img
        src="/profile.jpg"
        alt={profile.name}
        width={224}
        height={224}
        className="h-56 w-56 rounded-full object-cover ring-1 ring-slate-200"
      />

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
        {profile.name}
      </h1>
      <p className="mt-1 text-base font-semibold text-blue-600">
        {hasEmphasis ? (
          <>
            {lead}
            <Annotation type="underline">{profile.roleEmphasis}</Annotation>
          </>
        ) : (
          profile.role
        )}
      </p>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
        {profile.summary}
      </p>
    </section>
  )
}
