import HeroSection from '@/components/sections/HeroSection/HeroSection'
import FactsSection from '@/components/sections/FactsSection/FactsSection'
import ExperienceSection from '@/components/sections/ExperienceSection/ExperienceSection'
import ResearchSection from '@/components/sections/ResearchSection/ResearchSection'
import SkillsSection from '@/components/sections/SkillsSection/SkillsSection'
import ContactSection from '@/components/sections/ContactSection/ContactSection'

export default function HomePage() {
  return (
    <main id="main-content">
      <div className="mx-auto max-w-content px-6 pb-20">
        <HeroSection />
        <FactsSection />
        <ExperienceSection />
        <ResearchSection />
        <SkillsSection />
      </div>
      <ContactSection />
    </main>
  )
}
