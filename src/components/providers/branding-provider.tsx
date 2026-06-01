"use client";

import { useEffect, useMemo, type ReactNode } from "react";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import { useAuthContext } from "@/hooks/useAuth";
import { BrandingContext } from "@/hooks/useBranding";
import { useHome } from "@/hooks/useHome";
import { getBrandingCssVariables } from "@/lib/branding";

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

  const value = useMemo(
    () => ({
      branding,
      isLoading: homeQuery.isLoading,
    }),
    [branding, homeQuery.isLoading]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};
