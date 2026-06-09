"use client";

import { Suspense, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { SignatureSelectionContent } from "@/components/pages/Items/components/signature-selection/SignatureSelectionContent";
import { OrderCartSidebar } from "@/components/pages/Items/components/signature-selection/OrderCartSidebar";
import { useAuth } from "@/hooks/useAuth";

function MenuPageContent() {
  const t = useTranslations("menu");
  const { restaurantId, user, loading } = useAuth();
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const checkoutType = user?.selectedOrderType === "TAKEAWAY" ? "pickup" : "delivery";

  const handleCartRefresh = useCallback(() => {
    setCartRefreshKey((prev) => prev + 1);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-[#777]">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto overflow-x-hidden">
        <div className="grid min-h-screen grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 overflow-x-hidden">
            <SignatureSelectionContent
              restaurantId={restaurantId}
              customerId={user?.id}
              branchId={user?.branchId}
              onCartRefresh={handleCartRefresh}
            />
          </div>

          <div className="min-w-0">
            <OrderCartSidebar
              customerId={user?.id}
              cartRefreshKey={cartRefreshKey}
              onCartRefresh={handleCartRefresh}
              checkoutType={checkoutType}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen overflow-x-hidden" />}>
      <MenuPageContent />
    </Suspense>
  );
}
