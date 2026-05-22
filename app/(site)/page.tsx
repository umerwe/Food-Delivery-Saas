"use client";

import { useEffect, useMemo, useState } from "react";

import HeroSection from "@/components/heroSection";
import FoodCategorySection from "@/components/foodCategorySection";
import WhyChooseUs from "@/components/whyChooseUsSection";
import AppPromo from "@/components/appPromoSection";
import Stats from "@/components/statsSection";
import BlogSection from "@/components/blogSection";
import NewsletterSection from "@/components/newsLetterSection";
import Footer from "@/components/layout/footer";
import RequiredBranchSelectionModal from "@/components/branch-selector/RequiredBranchSelectionModal";
import OrderNowFloatingButton from "@/components/ui/OrderNowFloatingButton";
import BranchOpeningHoursPopup from "@/components/Home/BranchOpeningHours";

import { useAuth } from "@/hooks/useAuth";
import useApi from "@/hooks/useApi";

const normalizeHomeData = (res: any) => {
  return res?.data?.data || res?.data || res || {};
};

const getUserBranchId = (user: any) => {
  return user?.branchId || user?.branch?.id || "";
};

const getUserRestaurantId = (user: any) => {
  return user?.restaurantId || user?.branch?.restaurantId || "";
};

const HomePage = () => {
  const { user, token } = useAuth();
  const { get } = useApi(token);

  const [homeData, setHomeData] = useState<any>(null);

  const restaurantId = useMemo(() => getUserRestaurantId(user), [user]);
  const branchId = useMemo(() => getUserBranchId(user), [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchCustomerHome = async () => {
      if (!token) return;
      if(!branchId) return;
      try {
        const params = new URLSearchParams();

        if (restaurantId) {
          params.set("restaurantId", String(restaurantId));
        }

        if (branchId) {
          params.set("branchId", String(branchId));
        }

        const query = params.toString();
        const res = await get(
          `/v1/customer-app/home${query ? `?${query}` : ""}`
        );

        if (!isMounted) return;

        if (res?.error) {
          console.error("Failed to fetch customer home:", res.error);
          setHomeData(null);
          return;
        }

        setHomeData(normalizeHomeData(res));
      } catch (error) {
        if (!isMounted) return;
        console.error("Failed to fetch customer home:", error);
        setHomeData(null);
      }
    };

    fetchCustomerHome();

    return () => {
      isMounted = false;
    };
  }, [token, restaurantId, branchId]);

  const resolvedBranch = homeData?.branch || user?.branch || null;
  const landingPopup = homeData?.landingPopup || null;

  return (
    <div>
      <BranchOpeningHoursPopup popup={landingPopup} branch={resolvedBranch} />

      <HeroSection />

      <section id="categories">
        <FoodCategorySection />
      </section>

      <WhyChooseUs />
      <AppPromo />
      <Stats />
      <BlogSection />
      <NewsletterSection />

      <Footer isHome={true} />

      {user && token && !branchId ? <RequiredBranchSelectionModal /> : null}

      <OrderNowFloatingButton />
    </div>
  );
};

export default HomePage;
