"use client";

import { useMemo } from 'react'
import AboutBanner from '@/components/pages/About/components/AboutBanner'
import MissionVisionValues from '@/components/pages/About/components/MissionVisionValues'
import OurStorySection from '@/components/pages/About/components/OurStorySection'
import TeamSection from '@/components/pages/About/components/TeamSection'
import TestimonialsSection from '@/components/pages/About/components/TestimonialsSection'
import WhyChooseUsSection from '@/components/pages/About/components/WhyChooseUsSection'
import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { queryKeys } from '@/config/query-keys'
import { useAuth } from '@/hooks/useAuth'
import { useCustomerReviews } from '@/hooks/useCustomerReviews'
import { resolveHomeBranchId, resolveHomeRestaurantId } from '@/lib/home'
import { fetchAboutContent, fetchBranchStats, type AboutTestimonial } from '@/services/public-content'

const AboutPage = () => {
  const locale = useLocale()
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
  const { reviews: customerReviews } = useCustomerReviews({
    restaurantId,
    branchId,
    page: 1,
    limit: 50,
    locale,
  })
  const aboutContent = aboutQuery.data
  const pageContent = aboutContent?.pageContent
  const testimonials = useMemo<AboutTestimonial[]>(
    () =>
      customerReviews.slice(0, 3).map((review) => {
        const name =
          [review.customer.firstName, review.customer.lastName]
            .filter(Boolean)
            .join(" ") || "Customer"

        return {
          name,
          role: review.branch.name || "Verified customer",
          imageUrl: review.customer.avatarUrl,
          quote: review.comment?.trim() || "Rated their order after dining with us.",
          rating: review.rating,
        }
      }),
    [customerReviews]
  )

  return (
    <>
    <AboutBanner content={pageContent?.hero} coverImage={aboutContent?.restaurantCoverImage} />
    <OurStorySection content={aboutContent?.content} story={pageContent?.story} />
    <MissionVisionValues items={pageContent?.missionVisionValues} />
    <WhyChooseUsSection features={pageContent?.whyChooseUs} branchStats={branchStatsQuery.data} />
    <TeamSection />
    <TestimonialsSection testimonials={testimonials} />
    </>
  )
}

export { AboutPage }
