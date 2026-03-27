import HeroSection from '../components/HeroSection'
import NarrativeSection from '../components/NarrativeSection'
import ExperienceSection from '../components/ExperienceSection'
import ResearchSection from '../components/ResearchSection'
import SkillsSection from '../components/SkillsSection'
import BlogSection from '../components/BlogSection'
import ContactSection from '../components/ContactSection'

export default function HomePage() {
  return (
    <main className="mesh-gradient min-h-screen pt-40 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-40">
        <HeroSection />
        <NarrativeSection />
        <ExperienceSection />
        <ResearchSection />
        <SkillsSection />
        <BlogSection />
        <ContactSection />
      </div>
    </main>
  )
}
