"use client";

import { useEffect, useMemo, type ReactNode } from "react";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import { useAuthContext } from "@/hooks/useAuth";
import { BrandingContext } from "@/hooks/useBranding";
import { useHome } from "@/hooks/useHome";
import { getBrandingCssVariables } from "@/lib/branding";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";

const getUserRestaurantId = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.restaurantId ?? user?.branch?.restaurantId ?? null;

const getUserBranchId = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.branchId ?? user?.branch?.id ?? null;

type BrandingProviderProps = {
  children: ReactNode;
};

export const BrandingProvider = ({ children }: BrandingProviderProps) => {
  const { user, loading } = useAuthContext();
  const restaurantId = getUserRestaurantId(user);
  const branchId = getUserBranchId(user);
  const homeQuery = useHome(restaurantId, branchId, !loading);
  const branding = homeQuery.data?.data.branding ?? DEFAULT_BRANDING;

  useEffect(() => {
    const root = document.documentElement;
    const variables = getBrandingCssVariables(branding);

    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value);
    }
  }, [branding]);

  useEffect(() => {
    const faviconHref = user
      ? resolveHttpsImageUrl(branding.logo.default, "/logo.png")
      : "/logo.png";
    const iconLinks = document.querySelectorAll<HTMLLinkElement>(
      "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
    );

    if (iconLinks.length === 0) {
      const link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
      link.href = faviconHref;
      return;
    }

    iconLinks.forEach((link) => {
      link.href = faviconHref;
    });
  }, [branding.logo.default, user]);

  const value = useMemo(
    () => ({
      branding,
      isLoading: homeQuery.isLoading,
    }),
    [branding, homeQuery.isLoading]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};
