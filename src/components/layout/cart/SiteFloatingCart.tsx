"use client";

import { ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { OrderCartSidebar } from "@/components/pages/Items/components/signature-selection/OrderCartSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useHome } from "@/hooks/useHome";
import { getSelectedOrderType } from "@/lib/branch-selector";
import { CART_CHANGED_EVENT } from "@/lib/cart-events";
import {
  getStoredCheckoutTypePreference,
  type CheckoutTypePreference,
} from "@/lib/checkout-type-preference";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { resolveCustomerCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";
import { fetchCustomerCart } from "@/services/cart";

const HIDDEN_CART_PATHS = ["/checkout", "/menu"];

export function SiteFloatingCart() {
  const pathname = usePathname();
  const t = useTranslations("cart");
  const { user, token, loading, restaurantId } = useAuth();
  const [cartRefreshKey, setCartRefreshKey] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasCartItems, setHasCartItems] = useState(false);
  const [storedCheckoutType, setStoredCheckoutType] =
    useState<CheckoutTypePreference | null>(null);

  const isHiddenRoute = HIDDEN_CART_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const hideOnMobileHome = pathname === "/";
  const customerId = user?.id;
  const homeRestaurantId = resolveHomeRestaurantId(user, restaurantId);
  const branchId = resolveHomeBranchId(user);
  const homeQuery = useHome(
    homeRestaurantId,
    branchId,
    Boolean(!loading && homeRestaurantId && branchId)
  );
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });
  const userCheckoutType = getSelectedOrderType(user) === "TAKEAWAY" ? "pickup" : "delivery";
  const checkoutType = storedCheckoutType ?? userCheckoutType;

  const refreshCart = useCallback(() => {
    setCartRefreshKey((current) => current + 1);
  }, []);

  const refreshCartPresence = useCallback(
    async ({ openWhenPresent = false }: { openWhenPresent?: boolean } = {}) => {
      if (loading || !customerId) {
        setHasCartItems(false);
        setIsOpen(false);
        return;
      }

      try {
        const { items } = await fetchCustomerCart({ customerId, token });
        const nextHasCartItems = items.length > 0;

        setHasCartItems(nextHasCartItems);

        if (nextHasCartItems) {
          if (openWhenPresent) {
            setIsOpen(true);
          }
          return;
        }

        setIsOpen(false);
      } catch {
        setHasCartItems(false);
        setIsOpen(false);
      }
    },
    [customerId, loading, token]
  );

  useEffect(() => {
    void refreshCartPresence();
  }, [refreshCartPresence]);

  useEffect(() => {
    setStoredCheckoutType(getStoredCheckoutTypePreference());

    const handleCartChanged = () => {
      setStoredCheckoutType(getStoredCheckoutTypePreference());
      refreshCart();
      void refreshCartPresence({ openWhenPresent: true });
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [refreshCart, refreshCartPresence]);

  if (loading || !customerId || isHiddenRoute || !hasCartItems) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-5 right-4 z-40 flex items-end justify-end sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8",
        hideOnMobileHome && "hidden md:flex"
      )}
    >
      {isOpen ? (
        <div className="relative h-[min(720px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))]">
          <Button
            type="button"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="absolute -left-3 -top-3 z-10 h-9 w-9 rounded-full border border-black/10 bg-white text-[#222] shadow-[0_12px_30px_rgba(15,23,42,0.16)] hover:bg-[#f7f7f7]"
            aria-label={t("minimizeCart")}
          >
            <X className="h-4 w-4" />
          </Button>

          <OrderCartSidebar
            customerId={customerId}
            cartRefreshKey={cartRefreshKey}
            onCartRefresh={refreshCart}
            presentation="floating"
            checkoutType={checkoutType}
            currency={currency}
          />
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setIsOpen(true)}
          className="h-11 rounded-full border border-black/10 bg-white pl-2 pr-3.5 text-[#222] shadow-[0_14px_38px_rgba(15,23,42,0.16)] hover:bg-[#f7f7f7] sm:h-12 sm:pl-2.5 sm:pr-4"
          aria-label={t("openCart")}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 sm:h-8 sm:w-8">
            <ShoppingBag className="h-4 w-4 text-primary" />
          </span>
          <span className="text-[13px] font-semibold sm:text-sm">{t("yourOrder")}</span>
        </Button>
      )}
    </div>
  );
}
