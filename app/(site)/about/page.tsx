import AboutBanner from '@/components/about/AboutBanner'
import CTASection from '@/components/about/CTASection'
import MissionVisionValues from '@/components/about/MissionVisionValues'
import OurStorySection from '@/components/about/OurStorySection'
import TeamSection from '@/components/about/TeamSection'
import TestimonialsSection from '@/components/about/TestimonialsSection'
import WhyChooseUsSection from '@/components/about/WhyChooseUsSection'
import React from 'react'

const page = () => {
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

export default page
