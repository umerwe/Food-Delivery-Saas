"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

import { HeroSection } from "@/components/pages/Home/components/heroSection";
import { FoodCategorySection } from "@/components/pages/Home/components/foodCategorySection";
import WhyChooseUs from "@/components/pages/Home/components/whyChooseUsSection";
import AppPromo from "@/components/pages/Home/components/appPromoSection";
import Stats from "@/components/pages/Home/components/statsSection";
import { RequiredBranchSelectionModal } from "@/components/common/branch-selector/RequiredBranchSelectionModal";
import BranchOpeningHoursPopup from "@/components/pages/Home/components/BranchOpeningHours";
import { CustomerDealsSection } from "@/components/pages/Home/components/CustomerDealsSection";
import { GiftCardsSection } from "@/components/pages/Home/components/GiftCardsSection";
import { MobileHomeExperience } from "@/components/pages/Home/components/MobileHomeExperience";
import { PromotionalItemsSection } from "@/components/pages/Home/components/PromotionalItemsSection";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useAddDealToCart } from "@/hooks/useCart";
import { useAppLocale } from "@/hooks/useAppLocale";
import { useCustomerDeals } from "@/hooks/useCustomerDeals";
import { useDomainContext } from "@/hooks/useDomainContext";
import { useHome } from "@/hooks/useHome";
import { useHomeCategories, useHomePromotionalItems } from "@/hooks/useHomeCategories";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { resolveCustomerCurrency } from "@/lib/money";
import type { CustomerDeal } from "@/types/customer-deals";
import type { AuthBranch } from "@/types/auth";
import type { HomeBranch, HomeRestaurant } from "@/types/home";

const getRestaurantHeroImage = (restaurant?: HomeRestaurant | null) =>
  restaurant?.coverImage ||
  restaurant?.coverImageUrl ||
  restaurant?.heroImageUrl ||
  null;

const getTrimmedText = (value?: string | null) => {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
};

const mergeHomeBranch = (
  homeBranch?: HomeBranch | null,
  sessionBranch?: AuthBranch | null,
): HomeBranch | AuthBranch | null => {
  if (!homeBranch) return sessionBranch ?? null;
  if (!sessionBranch || String(homeBranch.id || "") !== String(sessionBranch.id || "")) {
    return homeBranch;
  }

  const sessionHomeBranch = sessionBranch as HomeBranch;

  return {
    ...sessionBranch,
    ...homeBranch,
    settings: {
      ...(sessionBranch.settings ?? {}),
      ...(homeBranch.settings ?? {}),
    },
    availability: {
      ...(sessionHomeBranch.availability ?? {}),
      ...(homeBranch.availability ?? {}),
      temporaryClosure:
        homeBranch.availability?.temporaryClosure ??
        sessionHomeBranch.availability?.temporaryClosure ??
        null,
    },
    scheduleTimings: homeBranch.scheduleTimings ?? sessionHomeBranch.scheduleTimings ?? null,
  };
};

const HomePage = () => {
  const t = useTranslations("home.hero");
  const { user, token, restaurantId: authRestaurantId } = useAuth();
  const { context: domainContext } = useDomainContext();
  const { locale } = useAppLocale();
  const { branding: fallbackBranding } = useBranding();

  const restaurantId = useMemo(
    () => resolveHomeRestaurantId(user, authRestaurantId) || domainContext?.restaurantId || "",
    [authRestaurantId, domainContext?.restaurantId, user],
  );
  const branchId = useMemo(() => resolveHomeBranchId(user) || domainContext?.branchId || "", [domainContext?.branchId, user]);
  const hasRestaurantContext = Boolean(restaurantId);
  const homeQuery = useHome(restaurantId, branchId, hasRestaurantContext && Boolean(branchId));
  const categoriesQuery = useHomeCategories(restaurantId, hasRestaurantContext);
  const promotionalItemsQuery = useHomePromotionalItems({
    restaurantId,
    branchId,
    locale,
    limit: 8,
    enabled: hasRestaurantContext,
  });
  const dealsQuery = useCustomerDeals({ restaurantId, branchId, locale, limit: 20 });
  const addDealMutation = useAddDealToCart(branchId);
  const handleAddDeal = useCallback(
    (deal: CustomerDeal, selectedMenuItemIds?: string[]) => {
      addDealMutation.mutate({ deal, selectedMenuItemIds });
    },
    [addDealMutation]
  );
  const homeResponse = homeQuery.data;
  const homeData = homeResponse ? homeResponse.data : undefined;
  const branding = homeData?.branding ?? fallbackBranding ?? DEFAULT_BRANDING;
  const resolvedBranch = useMemo(
    () => mergeHomeBranch(homeData?.branch, user?.branch),
    [homeData?.branch, user?.branch]
  );
  const landingPopup = homeData?.landingPopup ?? null;
  const heroTitle = homeData?.restaurant?.name ?? branding.restaurantName ?? t("defaultTitle");
  const heroTagline = branding.tagline;
  const heroBannerTitle = getTrimmedText(homeData?.restaurant?.tagline) ?? t("deliveryTitle");
  const heroBannerDescription = getTrimmedText(homeData?.restaurant?.bio) ?? t("description");
  const heroImage =
    getRestaurantHeroImage(homeData?.restaurant) ??
    branding.assets.heroImage ??
    branding.assets.coverImage ??
    DEFAULT_BRANDING.assets.heroImage;
  const currency = resolveCustomerCurrency({
    configCurrency: homeData?.config?.currency,
    restaurant: homeData?.restaurant,
  });

  return (
    <div>
      <BranchOpeningHoursPopup popup={landingPopup} branch={resolvedBranch} />

      <MobileHomeExperience
        restaurantName={heroTitle}
        tagline={heroTagline}
        heroImage={heroImage}
        branding={branding}
        branch={resolvedBranch}
        categories={categoriesQuery.data ?? []}
        categoriesLoading={categoriesQuery.isLoading}
        promotionalItems={promotionalItemsQuery.data ?? []}
        promotionalItemsLoading={promotionalItemsQuery.isLoading}
        deals={dealsQuery.deals}
        currency={currency}
      />

      <div className="md:hidden">
        <GiftCardsSection
          giftCards={homeData?.giftCards}
          restaurantId={restaurantId}
          branchId={branchId}
          currency={currency}
        />

        <WhyChooseUs />
        <AppPromo />
        <Stats />
      </div>

      <div className="hidden md:block">
        {branding.showHeroBanner ? (
          <HeroSection
            restaurantName={heroTitle}
            tagline={heroTagline}
            title={heroBannerTitle}
            description={heroBannerDescription}
            heroImage={heroImage}
          />
        ) : null}

        {branding.showCategories ? (
          <section id="categories">
            <FoodCategorySection />
          </section>
        ) : null}

        <PromotionalItemsSection
          items={promotionalItemsQuery.data ?? []}
          isLoading={promotionalItemsQuery.isLoading}
          currency={currency}
        />

        <CustomerDealsSection
          deals={dealsQuery.deals}
          isLoading={dealsQuery.isLoading}
          addingDealId={addDealMutation.isPending ? addDealMutation.variables?.deal.id ?? null : null}
          branchId={branchId}
          currency={currency}
          onAddDeal={handleAddDeal}
        />

        <GiftCardsSection
          giftCards={homeData?.giftCards}
          restaurantId={restaurantId}
          branchId={branchId}
          currency={currency}
        />

        <WhyChooseUs />
        <AppPromo />
        <Stats />
      </div>

      {user && token && !branchId ? <RequiredBranchSelectionModal /> : null}
    </div>
  );
};

export { HomePage };
