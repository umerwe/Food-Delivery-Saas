"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import HeroSection from "@/components/pages/Home/components/heroSection";
import FoodCategorySection from "@/components/pages/Home/components/foodCategorySection";
import WhyChooseUs from "@/components/pages/Home/components/whyChooseUsSection";
import AppPromo from "@/components/pages/Home/components/appPromoSection";
import Stats from "@/components/pages/Home/components/statsSection";
import BlogSection from "@/components/pages/Home/components/blogSection";
import NewsletterSection from "@/components/pages/Home/components/newsLetterSection";
import { RequiredBranchSelectionModal } from "@/components/common/branch-selector/RequiredBranchSelectionModal";
import { OrderNowFloatingButton } from "@/components/ui/OrderNowFloatingButton";
import BranchOpeningHoursPopup from "@/components/pages/Home/components/BranchOpeningHours";
import { CustomerDealsSection } from "@/components/pages/Home/components/CustomerDealsSection";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useAddDealToCart } from "@/hooks/useCart";
import { useCustomerDeals } from "@/hooks/useCustomerDeals";
import { useHome } from "@/hooks/useHome";
import {
  isFixedItemDeal,
  isFlexibleCategoryDeal,
} from "@/components/pages/Home/utils/customer-deal-cart";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import type { CustomerDeal } from "@/types/customer-deals";

const HomePage = () => {
  const t = useTranslations("home.hero");
  const dealsT = useTranslations("home.deals");
  const router = useRouter();
  const { user, token, restaurantId: authRestaurantId } = useAuth();
  const { branding: fallbackBranding } = useBranding();

  const restaurantId = useMemo(() => resolveHomeRestaurantId(user, authRestaurantId), [authRestaurantId, user]);
  const branchId = useMemo(() => resolveHomeBranchId(user), [user]);
  const homeQuery = useHome(restaurantId, branchId, Boolean(token && branchId));
  const dealsQuery = useCustomerDeals({ restaurantId, branchId, limit: 20 });
  const addDealMutation = useAddDealToCart(branchId);
  const handleAddDeal = useCallback(
    (deal: CustomerDeal, selectedMenuItemIds?: string[]) => {
      addDealMutation.mutate(
        { deal, selectedMenuItemIds },
        {
          onSuccess: () => {
            router.push("/checkout");
          },
        }
      );
    },
    [addDealMutation, router]
  );
  const handleBrowseDeal = useCallback(
    (deal: CustomerDeal) => {
      const firstCategoryId = deal.scopeCategories[0]?.id;
      const firstMenuItemId = deal.scopeMenuItems[0]?.id;
      const params = new URLSearchParams();

      params.set("dealId", deal.id);

      if (firstCategoryId) {
        params.set("categoryId", firstCategoryId);
      }

      if (isFixedItemDeal(deal) && deal.scopeMenuItems.length === 1 && firstMenuItemId) {
        params.set("itemId", firstMenuItemId);
        router.push(`/items/details?${params.toString()}`);
      } else {
        router.push(`/items?${params.toString()}`);
      }

      if (isFlexibleCategoryDeal(deal)) {
        toast.info(dealsT("categoryDealToast"));
      }
    },
    [dealsT, router]
  );
  const homeResponse = homeQuery.data;
  const homeData = homeResponse ? homeResponse.data : undefined;
  const branding = homeData?.branding ?? fallbackBranding ?? DEFAULT_BRANDING;
  const resolvedBranch = homeData?.branch ?? user?.branch ?? null;
  const landingPopup = homeData?.landingPopup ?? null;
  const heroTitle = homeData?.restaurant?.name ?? branding.restaurantName ?? t("defaultTitle");
  const heroTagline = branding.tagline;
  const heroImage = branding.assets.heroImage ?? branding.assets.coverImage ?? DEFAULT_BRANDING.assets.heroImage;

  return (
    <div>
      <BranchOpeningHoursPopup popup={landingPopup} branch={resolvedBranch} />

      {branding.showHeroBanner ? (
        <HeroSection
          restaurantName={heroTitle}
          tagline={heroTagline}
          heroImage={heroImage}
        />
      ) : null}

      {branding.showCategories ? (
        <section id="categories">
          <FoodCategorySection />
        </section>
      ) : null}

      <CustomerDealsSection
        deals={dealsQuery.deals}
        isLoading={dealsQuery.isLoading}
        addingDealId={addDealMutation.isPending ? addDealMutation.variables?.deal.id ?? null : null}
        onAddDeal={handleAddDeal}
        onBrowseDeal={handleBrowseDeal}
      />

      <WhyChooseUs />
      <AppPromo />
      <Stats />
      {branding.showPopularItems ? <BlogSection /> : null}
      <NewsletterSection />

      {user && token && !branchId ? <RequiredBranchSelectionModal /> : null}

      <OrderNowFloatingButton />
    </div>
  );
};

export { HomePage };
