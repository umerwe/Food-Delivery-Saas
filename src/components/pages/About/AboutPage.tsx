import AboutBanner from '@/components/pages/About/components/AboutBanner'
import CTASection from '@/components/pages/About/components/CTASection'
import MissionVisionValues from '@/components/pages/About/components/MissionVisionValues'
import OurStorySection from '@/components/pages/About/components/OurStorySection'
import TeamSection from '@/components/pages/About/components/TeamSection'
import TestimonialsSection from '@/components/pages/About/components/TestimonialsSection'
import WhyChooseUsSection from '@/components/pages/About/components/WhyChooseUsSection'

const AboutPage = () => {
  return (
    <>
    <AboutBanner />
    <OurStorySection />
    <MissionVisionValues />
    <WhyChooseUsSection />
    <TeamSection />
    <TestimonialsSection />
    <CTASection />
    </>
  )
}

export { AboutPage }
