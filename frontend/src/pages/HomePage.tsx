import { lazy, Suspense } from 'react'
import HeroSection from '../components/HeroSection'
import NarrativeSection from '../components/NarrativeSection'

const ExperienceSection = lazy(() => import('../components/ExperienceSection'))
const ResearchSection = lazy(() => import('../components/ResearchSection'))
const SkillsSection = lazy(() => import('../components/SkillsSection'))
const BlogSection = lazy(() => import('../components/BlogSection'))
const ContactSection = lazy(() => import('../components/ContactSection'))

const LazyFallback = () => <div className="min-h-[200px]" />

export default function HomePage() {
  return (
    <main className="mesh-gradient min-h-screen pt-40 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <HeroSection />
        <div className="mt-48"><NarrativeSection /></div>
        <Suspense fallback={<LazyFallback />}>
          <div className="mt-32"><ExperienceSection /></div>
          <div className="mt-40"><ResearchSection /></div>
          <div className="mt-24"><SkillsSection /></div>
          <div className="mt-40"><BlogSection /></div>
          <div className="mt-32"><ContactSection /></div>
        </Suspense>
      </div>
    </main>
  )
}
