"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

import { useBranding } from "@/hooks/useBranding";
import { isRemoteHttpsImageUrl, resolveHttpsImageUrl } from "@/lib/image-fallback";

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
  const fallbackLogo = useMemo(
    () => resolveHttpsImageUrl(variantLogo ?? branding.logo.default, "/logo.png"),
    [branding.logo.default, variantLogo]
  );
  const src = useMemo(
    () => resolveHttpsImageUrl(restaurantLogoUrl, fallbackLogo),
    [fallbackLogo, restaurantLogoUrl]
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
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={className}
        priority={priority}
        unoptimized={isRemoteHttpsImageUrl(src)}
        onError={handleImageError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized={isRemoteHttpsImageUrl(src)}
      onError={handleImageError}
    />
  );
};
