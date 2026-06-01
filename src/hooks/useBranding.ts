"use client";

import { createContext, useContext } from "react";

import { DEFAULT_BRANDING } from "@/config/default-branding";
import type { BrandingContextValue } from "@/types/branding";

export const BrandingContext = createContext<BrandingContextValue>({
  branding: DEFAULT_BRANDING,
  isLoading: false,
});

export const useBranding = () => useContext(BrandingContext);
