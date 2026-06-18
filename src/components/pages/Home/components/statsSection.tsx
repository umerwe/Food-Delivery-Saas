import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Star,
  ThumbsUp,
  Utensils,
} from "lucide-react";

import { queryKeys } from "@/config/query-keys";
import { useAuth } from "@/hooks/useAuth";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";
import { fetchBranchStats } from "@/services/public-content";

const compactNumber = (value: number) =>
  new Intl.NumberFormat("en", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);

export default function Stats() {
  const t = useTranslations("home.stats");
  const { user, restaurantId: authRestaurantId } = useAuth();
  const restaurantId = resolveHomeRestaurantId(user, authRestaurantId);
  const branchId = resolveHomeBranchId(user);
  const statsQuery = useQuery({
    queryKey: queryKeys.home.branchStats(restaurantId, branchId),
    queryFn: () => fetchBranchStats(restaurantId, branchId),
    enabled: Boolean(restaurantId && branchId),
    staleTime: 5 * 60 * 1000,
  });
  const branchStats = statsQuery.data;
  const stats = [
    {
      icon: ClipboardCheck,
      labelKey: "completedOrders",
      value: branchStats ? `${compactNumber(branchStats.completedOrders)}+` : "2M+",
    },
    {
      icon: ThumbsUp,
      labelKey: "averageRating",
      value: branchStats?.averageRating
        ? `${branchStats.averageRating.toFixed(1)}/5`
        : "98%",
    },
    {
      icon: Utensils,
      labelKey: "activeMenuItems",
      value: branchStats ? `${compactNumber(branchStats.activeMenuItems)}+` : "20+",
    },
    {
      icon: Star,
      labelKey: "fiveStarReviews",
      value: branchStats ? `${compactNumber(branchStats.fiveStarReviews)}+` : "100+",
    },
  ] as const;

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 md:py-14">
      <div className="grid grid-cols-2 gap-4 rounded-[30px] bg-white px-4 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:px-6 md:grid-cols-4 md:gap-6 md:px-8 md:py-7">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.labelKey}
              className="flex items-center gap-3 rounded-[22px] px-1 py-2 text-left sm:gap-4 md:justify-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-12 sm:w-12">
                <Icon size={22} strokeWidth={2.4} />
              </span>

              <span className="min-w-0">
                <span className="block text-[28px] font-black leading-none tracking-tight text-primary sm:text-[34px] md:text-[38px]">
                  {stat.value}
                </span>
                <span className="mt-1 block text-xs font-semibold leading-4 text-gray-700 sm:text-sm">
                  {t(stat.labelKey)}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
