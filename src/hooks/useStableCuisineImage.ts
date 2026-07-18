"use client";

import { useCallback, useEffect, useState } from "react";

import {
  CUISINE_FALLBACK_IMAGE,
  getCuisineRemoteImage,
} from "@/components/pages/Cuisines/components/cuisine-display";
import {
  readCachedCuisineImage,
  removeCachedCuisineImage,
  writeCachedCuisineImage,
} from "@/lib/cuisine-image-cache";
import type { CustomerCuisine } from "@/services/cuisines";

const loadedCuisineImages = new Map<string, string>();

export const useStableCuisineImage = (
  cuisine?: CustomerCuisine | null,
) => {
  const cuisineId = cuisine?.id ?? "";
  const remoteImageUrl = getCuisineRemoteImage(cuisine);
  const [imageUrl, setImageUrl] = useState(
    () => loadedCuisineImages.get(cuisineId) ?? CUISINE_FALLBACK_IMAGE,
  );

  useEffect(() => {
    if (!cuisineId) return;

    const candidate =
      remoteImageUrl ?? readCachedCuisineImage(cuisineId);

    if (!candidate) return;
    if (loadedCuisineImages.get(cuisineId) === candidate) {
      setImageUrl(candidate);
      return;
    }

    let cancelled = false;
    const preloadedImage = new window.Image();

    const activateImage = () => {
      if (cancelled) return;

      loadedCuisineImages.set(cuisineId, candidate);
      writeCachedCuisineImage(cuisineId, candidate);
      setImageUrl(candidate);
    };

    preloadedImage.onload = () => {
      void preloadedImage
        .decode()
        .catch(() => undefined)
        .then(activateImage);
    };
    preloadedImage.onerror = () => {
      removeCachedCuisineImage(cuisineId);
    };
    preloadedImage.src = candidate;

    return () => {
      cancelled = true;
      preloadedImage.onload = null;
      preloadedImage.onerror = null;
    };
  }, [cuisineId, remoteImageUrl]);

  const handleImageError = useCallback(() => {
    if (!cuisineId || imageUrl === CUISINE_FALLBACK_IMAGE) return;

    loadedCuisineImages.delete(cuisineId);
    removeCachedCuisineImage(cuisineId);
    setImageUrl(CUISINE_FALLBACK_IMAGE);
  }, [cuisineId, imageUrl]);

  return { imageUrl, handleImageError };
};
