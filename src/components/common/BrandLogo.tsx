"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { useBranding } from "@/hooks/useBranding";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";

type BrandLogoProps = {
  restaurantLogoUrl?: string | null;
  variant?: "light" | "dark";
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export const BrandLogo = ({
  restaurantLogoUrl,
  variant = "light",
  alt = "Logo",
  fill = false,
  width = 160,
  height = 32,
  className = "object-contain",
  priority = false,
}: BrandLogoProps) => {
  const { branding } = useBranding();
  const [hasImageError, setHasImageError] = useState(false);
  const variantLogo = variant === "dark" ? branding.logo.dark : branding.logo.light;
  const src = useMemo(
    () => resolveHttpsImageUrl(variantLogo ?? restaurantLogoUrl ?? branding.logo.default, "/logo.png"),
    [branding.logo.default, restaurantLogoUrl, variantLogo]
  );
  useEffect(() => {
    setHasImageError(false);
  }, [src]);

  const fallbackText = branding.restaurantName?.trim() || alt;
  const shouldShowTextFallback = hasImageError && src !== "/logo.png";

  if (shouldShowTextFallback) {
    return (
      <span aria-label={alt} className={className}>
        {fallbackText}
      </span>
    );
  }

  const handleImageError = () => {
    if (src === "/logo.png") return;
    setHasImageError(true);
  };

  if (fill) {
    return <Image src={src} alt={alt} fill className={className} priority={priority} onError={handleImageError} />;
  }

  return <Image src={src} alt={alt} width={width} height={height} className={className} priority={priority} onError={handleImageError} />;
};
