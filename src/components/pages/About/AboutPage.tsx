"use client";

import AboutBanner from '@/components/pages/About/components/AboutBanner'
import MissionVisionValues from '@/components/pages/About/components/MissionVisionValues'
import OurStorySection from '@/components/pages/About/components/OurStorySection'
import TeamSection from '@/components/pages/About/components/TeamSection'
import TestimonialsSection from '@/components/pages/About/components/TestimonialsSection'
import WhyChooseUsSection from '@/components/pages/About/components/WhyChooseUsSection'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/config/query-keys'
import { useAuth } from '@/hooks/useAuth'
import { resolveHomeBranchId, resolveHomeRestaurantId } from '@/lib/home'
import { fetchAboutContent, fetchBranchStats } from '@/services/public-content'

const AboutPage = () => {
  const { user, restaurantId: authRestaurantId } = useAuth()
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId)
  const branchId = resolveHomeBranchId(user)
  const aboutQuery = useQuery({
    queryKey: queryKeys.home.about(restaurantId),
    queryFn: () => fetchAboutContent(restaurantId),
    enabled: Boolean(restaurantId),
    staleTime: 5 * 60 * 1000,
  })
  const branchStatsQuery = useQuery({
    queryKey: queryKeys.home.branchStats(restaurantId, branchId),
    queryFn: () => fetchBranchStats(restaurantId, branchId),
    enabled: Boolean(restaurantId && branchId),
    staleTime: 5 * 60 * 1000,
  })
  const aboutContent = aboutQuery.data
  const pageContent = aboutContent?.pageContent

  return (
    <>
    <AboutBanner content={pageContent?.hero} coverImage={aboutContent?.restaurantCoverImage} />
    <OurStorySection content={aboutContent?.content} story={pageContent?.story} />
    <MissionVisionValues items={pageContent?.missionVisionValues} />
    <WhyChooseUsSection features={pageContent?.whyChooseUs} branchStats={branchStatsQuery.data} />
    <TeamSection />
    <TestimonialsSection />
    </>
  )
}

export { AboutPage }
