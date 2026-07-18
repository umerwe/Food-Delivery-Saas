const CUISINE_IMAGE_CACHE_PREFIX = "deliveryway-cuisine-image";
const CUISINE_IMAGE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type CuisineImageCacheEntry = {
  imageUrl: string;
  cachedAt: number;
};

const getCacheKey = (cuisineId: string) =>
  `${CUISINE_IMAGE_CACHE_PREFIX}:${cuisineId}`;

export const removeCachedCuisineImage = (cuisineId: string) => {
  if (!cuisineId || typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(getCacheKey(cuisineId));
  } catch {
    // Storage can be unavailable in private browsing or restricted embeds.
  }
};

export const readCachedCuisineImage = (
  cuisineId: string,
  now = Date.now(),
) => {
  if (!cuisineId || typeof window === "undefined") return null;

  try {
    const rawValue = window.localStorage.getItem(getCacheKey(cuisineId));
    if (!rawValue) return null;

    const entry = JSON.parse(rawValue) as Partial<CuisineImageCacheEntry>;
    const isFresh =
      typeof entry.cachedAt === "number" &&
      now - entry.cachedAt <= CUISINE_IMAGE_CACHE_MAX_AGE_MS;
    const isSafeUrl =
      typeof entry.imageUrl === "string" &&
      entry.imageUrl.startsWith("https://");

    if (!isFresh || !isSafeUrl) {
      removeCachedCuisineImage(cuisineId);
      return null;
    }

    return entry.imageUrl;
  } catch {
    removeCachedCuisineImage(cuisineId);
    return null;
  }
};

export const writeCachedCuisineImage = (
  cuisineId: string,
  imageUrl: string,
  cachedAt = Date.now(),
) => {
  if (
    !cuisineId ||
    !imageUrl.startsWith("https://") ||
    typeof window === "undefined"
  ) {
    return;
  }

  try {
    window.localStorage.setItem(
      getCacheKey(cuisineId),
      JSON.stringify({ imageUrl, cachedAt } satisfies CuisineImageCacheEntry),
    );
  } catch {
    // The fallback image remains available when storage is unavailable.
  }
};
