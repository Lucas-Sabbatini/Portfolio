import Avatar from '@/components/shared/Avatar/Avatar'
import { profile } from '@/data/content'

export default function HeroSection() {
  return (
    <section className="pb-14 pt-16">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar src="/profile.jpg" alt={profile.name} fallback="LJ" />

        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {profile.name}
          </h1>
          <p className="mt-1 text-base font-semibold text-blue-600">{profile.role}</p>
        </div>
      </div>

      <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
        {profile.summary}
      </p>
    </section>
  )
}
