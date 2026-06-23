"use client";

import Link from "next/link";
import { Heart, Loader2, RefreshCw } from "lucide-react";

import { RestaurantCard } from "@/components/pages/Items/components/RestaurantCard";
import { useAuthContext } from "@/hooks/useAuth";
import { useCustomerFavorites } from "@/hooks/useCustomerFavorites";
import { useHome } from "@/hooks/useHome";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { resolveCustomerCurrency } from "@/lib/money";

const SkeletonCard = () => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex justify-between gap-4">
      <div className="flex-1 space-y-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </div>
      <div className="h-[110px] w-[120px] animate-pulse rounded-xl bg-gray-100" />
    </div>
  </div>
);

export function FavouritesPage() {
  const { token, user } = useAuthContext();
  const favoritesQuery = useCustomerFavorites();
  const restaurantId = resolveHomeRestaurantId(user);
  const branchId = resolveHomeBranchId(user);
  const homeQuery = useHome(
    restaurantId,
    branchId,
    Boolean(token && restaurantId && branchId),
  );
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <section className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <Heart className="mb-4 h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold text-gray-900">
            Login to view favourites
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            Save menu items to your profile and find them again on any device.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
          >
            Login
          </Link>
        </section>
      </main>
    );
  }

  const favoriteItems = favoritesQuery.data?.items ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Heart size={14} fill="currentColor" />
              Saved items
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              Favourites
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Your saved menu items stay linked to your customer profile.
            </p>
          </div>

          <Link
            href="/items"
            className="inline-flex h-11 items-center justify-center rounded-full border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            Browse menu
          </Link>
        </div>

        {favoritesQuery.isLoading ? (
          <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : null}

        {favoritesQuery.isError ? (
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-900">
              Unable to load favourites.
            </p>
            <button
              type="button"
              onClick={() => favoritesQuery.refetch()}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        ) : null}

        {!favoritesQuery.isLoading &&
        !favoritesQuery.isError &&
        favoriteItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
            <Heart className="mx-auto mb-4 h-10 w-10 text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900">
              No favourites yet.
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Tap the heart on any item to save it here.
            </p>
            <Link
              href="/items"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-95"
            >
              Browse menu
            </Link>
          </div>
        ) : null}

        {!favoritesQuery.isLoading &&
        !favoritesQuery.isError &&
        favoriteItems.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2">
            {favoriteItems.map((item) => (
              <RestaurantCard key={String(item.id)} item={item} currency={currency} />
            ))}
          </div>
        ) : null}

        {favoritesQuery.isFetching && !favoritesQuery.isLoading ? (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 size={15} className="animate-spin" />
            Refreshing favourites
          </div>
        ) : null}
      </section>
    </main>
  );
}
