"use client";

import Image from "next/image";
import { Star, MapPin, Clock, Utensils, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const CATEGORY_PAGE_LIMIT = 50;
const FALLBACK_BANNER = "/categories/background_banner.png";

const normalizeApiArray = (res: any) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
};

const normalizeApiMeta = (res: any) => {
  return (
    res?.data?.pagination ||
    res?.data?.meta ||
    res?.data?.data?.pagination ||
    res?.data?.data?.meta ||
    res?.pagination ||
    res?.meta ||
    {}
  );
};

const hasNextPage = ({
  meta,
  page,
  limit,
  receivedCount,
  totalLoaded,
}: {
  meta: any;
  page: number;
  limit: number;
  receivedCount: number;
  totalLoaded: number;
}) => {
  if (typeof meta?.hasNext === "boolean") return meta.hasNext;
  if (typeof meta?.hasMore === "boolean") return meta.hasMore;

  const currentPage = Number(meta?.page ?? page);
  const totalPages = Number(meta?.totalPages ?? meta?.pages ?? 0);
  const total = Number(meta?.total ?? 0);

  if (totalPages > 0) return currentPage < totalPages;
  if (total > 0) return totalLoaded < total;

  return receivedCount >= limit;
};

const getStoredAuth = () => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const hasText = (value: any) => {
  const text = String(value ?? "").trim();
  return text !== "" && text.toLowerCase() !== "null";
};

const getImageUrl = (category: any, restaurant: any) => {
  const candidates = [
    category?.imageUrl,
    category?.coverImage,
    category?.bannerUrl,
    restaurant?.coverImage,
    restaurant?.coverImageUrl,
    restaurant?.bannerUrl,
    restaurant?.imageUrl,
  ];

  return candidates.find((value) => hasText(value)) || FALLBACK_BANNER;
};

const formatAddress = (value: any) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    return [
      value.street,
      value.area,
      value.city,
      value.state,
      value.country,
    ]
      .filter(hasText)
      .join(", ");
  }

  return "";
};

const getRestaurantName = (authUser: any, storedAuth: any) => {
  const candidates = [
    authUser?.restaurant?.name,
    authUser?.restaurantName,
    authUser?.profile?.restaurantName,
    authUser?.tenant?.restaurant?.name,
    storedAuth?.user?.restaurant?.name,
    storedAuth?.user?.restaurantName,
    storedAuth?.user?.profile?.restaurantName,
  ];

  return candidates.find(hasText) || "Restaurant";
};

const getRestaurantAddress = (authUser: any, storedAuth: any) => {
  const candidates = [
    authUser?.restaurant?.address,
    authUser?.branch?.address,
    authUser?.address,
    authUser?.profile?.address,
    storedAuth?.user?.restaurant?.address,
    storedAuth?.user?.branch?.address,
    storedAuth?.user?.address,
    storedAuth?.user?.profile?.address,
  ];

  for (const candidate of candidates) {
    const address = formatAddress(candidate);
    if (hasText(address)) return address;
  }

  return "Address not available";
};

const getOperatingHours = (authUser: any, storedAuth: any) => {
  const restaurant =
    authUser?.restaurant ||
    authUser?.profile?.restaurant ||
    storedAuth?.user?.restaurant ||
    storedAuth?.user?.profile?.restaurant ||
    {};

  const branch =
    authUser?.branch ||
    authUser?.profile?.branch ||
    storedAuth?.user?.branch ||
    storedAuth?.user?.profile?.branch ||
    {};

  const directCandidates = [
    restaurant?.operatingHours,
    restaurant?.openingHours,
    restaurant?.businessHours,
    branch?.operatingHours,
    branch?.openingHours,
    branch?.businessHours,
  ];

  const direct = directCandidates.find(hasText);

  if (direct) return String(direct);

  const openingTime =
    restaurant?.openingTime ||
    restaurant?.opensAt ||
    branch?.openingTime ||
    branch?.opensAt;

  const closingTime =
    restaurant?.closingTime ||
    restaurant?.closesAt ||
    branch?.closingTime ||
    branch?.closesAt;

  if (hasText(openingTime) && hasText(closingTime)) {
    return `${openingTime} - ${closingTime}`;
  }

  return "Operating hours not specified";
};

const getRatingInfo = (authUser: any, storedAuth: any) => {
  const restaurant =
    authUser?.restaurant ||
    authUser?.profile?.restaurant ||
    storedAuth?.user?.restaurant ||
    storedAuth?.user?.profile?.restaurant ||
    {};

  const rating = Number(
    restaurant?.rating ??
      restaurant?.averageRating ??
      restaurant?.stats?.averageRating
  );

  const reviews = Number(
    restaurant?.reviewCount ??
      restaurant?.reviewsCount ??
      restaurant?.stats?.reviewCount
  );

  if (!Number.isFinite(rating) || rating <= 0) {
    return null;
  }

  return {
    rating,
    reviews: Number.isFinite(reviews) && reviews > 0 ? reviews : null,
  };
};

const getCategoryItemCount = (category: any) => {
  const count = Number(
    category?._count?.items ??
      category?.itemsCount ??
      category?.itemCount ??
      category?.items?.length
  );

  return Number.isFinite(count) && count >= 0 ? count : null;
};

export default function RestaurantHeader() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const router = useRouter();

  const { token, restaurantId: authRestaurantId, user } = useAuth();
  const { get } = useApi(token);

  const [category, setCategory] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const storedAuth = useMemo(() => getStoredAuth(), []);

  const restaurantId = useMemo(() => {
    return (
      authRestaurantId ||
      user?.restaurantId ||
      storedAuth?.user?.restaurantId ||
      ""
    );
  }, [authRestaurantId, user?.restaurantId, storedAuth]);

  useEffect(() => {
    let cancelled = false;

    const fetchCategory = async () => {
      if (!token || !restaurantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const resolvedRestaurant = {
          name: getRestaurantName(user, storedAuth),
          address: getRestaurantAddress(user, storedAuth),
          operatingHours: getOperatingHours(user, storedAuth),
          ratingInfo: getRatingInfo(user, storedAuth),
          coverImage:
            storedAuth?.user?.restaurant?.coverImage ||
            storedAuth?.user?.restaurant?.coverImageUrl ||
            storedAuth?.user?.restaurant?.bannerUrl ||
            "",
        };

        let page = 1;
        let totalLoaded = 0;
        let selectedCategory: any = null;
        let firstCategory: any = null;
        let shouldContinue = true;

        while (shouldContinue) {
          const params = new URLSearchParams({
            restaurantId: String(restaurantId),
            page: String(page),
            limit: String(CATEGORY_PAGE_LIMIT),
            sortBy: "sortOrder",
            sortOrder: "ASC",
          });

          const res = await get(`/v1/menu/categories?${params.toString()}`);
          const fetchedCategories = normalizeApiArray(res);
          const meta = normalizeApiMeta(res);

          if (!firstCategory && fetchedCategories.length > 0) {
            firstCategory = fetchedCategories[0];
          }

          if (categoryId) {
            selectedCategory = fetchedCategories.find(
              (item: any) => String(item?.id) === String(categoryId)
            );
          }

          totalLoaded += fetchedCategories.length;

          if (selectedCategory || !categoryId) {
            shouldContinue = false;
          } else {
            shouldContinue = hasNextPage({
              meta,
              page,
              limit: CATEGORY_PAGE_LIMIT,
              receivedCount: fetchedCategories.length,
              totalLoaded,
            });

            page += 1;
          }

          if (page > 30) {
            shouldContinue = false;
          }
        }

        if (cancelled) return;

        setRestaurant(resolvedRestaurant);
        setCategory(categoryId ? selectedCategory : null);
      } catch (err) {
        console.error("Failed to fetch restaurant header data:", err);

        if (!cancelled) {
          setRestaurant({
            name: getRestaurantName(user, storedAuth),
            address: getRestaurantAddress(user, storedAuth),
            operatingHours: getOperatingHours(user, storedAuth),
            ratingInfo: getRatingInfo(user, storedAuth),
          });
          setCategory(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategory();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, token, restaurantId]);

  const categoryItemCount = getCategoryItemCount(category);
  const ratingInfo = restaurant?.ratingInfo;
  const bannerImage = getImageUrl(category, restaurant);

  const title = category?.name ? category.name : "Full Menu";

  const description = hasText(category?.description)
    ? category.description
    : category?.name
    ? "Explore freshly prepared items in this category."
    : "Browse all available categories and menu items from this restaurant.";

  if (loading) {
    return (
      <div className="mx-4 mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:mx-10">
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm md:mx-10">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_520px]">
        {/* LEFT CONTENT */}
        <div className="flex min-w-0 flex-col justify-center p-6 md:p-8 lg:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {category?.name ? "Category" : "Restaurant Menu"}
            </span>

            {categoryItemCount !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                <Utensils size={13} />
                {categoryItemCount} item{categoryItemCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-gray-950 md:text-4xl">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
            {description}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            {ratingInfo ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1.5 text-yellow-700">
                <Star className="fill-yellow-500 text-yellow-500" size={16} />
                <span className="font-semibold">
                  {ratingInfo.rating.toFixed(1)}
                </span>

                {ratingInfo.reviews ? (
                  <span className="text-yellow-700/80">
                    · {ratingInfo.reviews} review
                    {ratingInfo.reviews === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5">
              <Clock size={15} className="text-gray-500" />
              <span>{restaurant?.operatingHours}</span>
            </div>
          </div>

          <div className="mt-5 space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
              <span>{restaurant?.address}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/reservetable")}
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Reserve Table
            </button>

            <div className="text-xs text-gray-400">
              {restaurant?.name ? `Serving from ${restaurant.name}` : null}
            </div>
          </div>
        </div>

        {/* RIGHT IMAGE */}
        <div className="relative h-[260px] w-full overflow-hidden bg-gray-100 md:h-[340px] lg:h-auto">
          <Image
            src={bannerImage}
            alt={category?.name || restaurant?.name || "Restaurant menu"}
            fill
            className="object-cover"
            priority
            unoptimized
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />

          {category?.name ? (
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/90 p-4 shadow-sm backdrop-blur">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Current Category
              </p>
              <p className="mt-1 truncate text-base font-semibold text-gray-900">
                {category.name}
              </p>

              {hasText(category?.description) ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                  {category.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}