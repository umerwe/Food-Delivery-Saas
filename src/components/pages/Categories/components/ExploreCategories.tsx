"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useItems from "@/hooks/useItems";
import { useGroupOrderApi } from "@/hooks/useGroupOrder";
import { useAuth } from "@/hooks/useAuth";
import { getStoredRestaurantId } from "@/lib/auth";
import { getStoredGroupOrderCode, setStoredGroupOrderCode } from "@/lib/group-order";
import type { GroupOrderParticipant } from "@/types/group-order";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

export default function ExploreCategories() {
  const t = useTranslations("categories.explore");
  const router = useRouter();

const { token, user, loading: authLoading } = useAuth();
  const { get } = useItems(token);
  const { joinGroupOrder, searchGroupOrdersByInviteCode } = useGroupOrderApi(token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  /* ================= FETCH ================= */
  const fetchCategories = async (pageNumber = 1) => {
    try {
      const restaurantId = getStoredRestaurantId();
      if (!restaurantId || !token) return;

      if (pageNumber === 1) setLoading(true);

      const res = await get(
        `/v1/menu/categories?restaurantId=${restaurantId}&page=${pageNumber}&limit=10`
      );
      const data = Array.isArray(res.data) ? res.data as Category[] : [];
      const meta = res.meta as { hasNext?: boolean; page?: number } | undefined;

      if (data.length > 0) {
        setCategories((prev) =>
          pageNumber === 1 ? data : [...prev, ...data]
        );

        setHasNext(meta?.hasNext || false);
        setPage(meta?.page || 1);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (!authLoading && !user) {
    router.push("/auth/login");
  }
}, [authLoading, user]);

const isUserAlreadyInOrder = async (code: string) => {
  try {
    const { groupOrder: order } = await searchGroupOrdersByInviteCode({ inviteCode: code });

    if (!order) return false;

    //  if user is host
    if (order.hostUserId === user?.id) return true;

    //  if user already participant
    const exists = order.participants?.some(
      (p: GroupOrderParticipant) => p.userId === user?.id
    );

    return exists;
  } catch {
    return false;
  }
};

const handleJoinGroupOrder = async (inviteCode: string) => {
  const res = await joinGroupOrder({ inviteCode });

  if (!res || res.error) {
    toast.error(res?.message || t("failedJoinGroupOrder"));

    return false;
  }

  return true;
};


useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    setStoredGroupOrderCode(code);
  }
}, []);

  useEffect(() => {
    fetchCategories(1);
  }, [token]);

  /* ================= LOAD MORE ================= */
  const handleLoadMore = () => {
    fetchCategories(page + 1);
  };

  return (
    <section className="w-full bg-[#FFF4F3] py-[60px] px-6">
      <div className="max-w-[1200px] mx-auto">

        {/* HEADER */}
        <div className="mb-10">
          <h2 className="text-[32px] md:text-[36px] font-semibold text-[#4A1F1A]">
            {t("title")}
          </h2>
          <p className="text-[#8B5E57] mt-2 text-sm">
            {t("description")}
          </p>
        </div>

        {/* ================= GRID ================= */}
        {loading ? (
          <div className="flex gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-[120px] h-[120px] rounded-full bg-gray-200 animate-pulse" />
                <div className="w-[80px] h-[14px] bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-gray-400">{t("empty")}</p>
        ) : (
           <div className="flex flex-wrap justify-between gap-y-10 w-full">
           {categories.map((item) => {
              const image =
                item.imageUrl && item.imageUrl.startsWith("http")
                  ? item.imageUrl
                  : "/placeholder.png";

              return (
                <div
                  key={item.id}
              onClick={async () => {
  const code = getStoredGroupOrderCode();

  if (code) {
    //  check first
    const alreadyIn = await isUserAlreadyInOrder(code);

    if (!alreadyIn) {
      const joined = await handleJoinGroupOrder(code);

      if (!joined) return;
    }

    router.push(`/items?categoryId=${item.id}&code=${code}`);
  } else {
    router.push(`/items?categoryId=${item.id}`);
  }
}}
               className="flex flex-col items-center cursor-pointer group w-[120px]"
                >
                  {/* Circle Image */}
                  <div className="relative w-[120px] h-[120px] rounded-full overflow-hidden shadow-md group-hover:scale-105 transition">
                    <Image
                      src={image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Label */}
                  <span className="mt-3 text-sm font-medium text-[#4A1F1A]">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= LOAD MORE ================= */}
        {hasNext && (
          <div className="flex justify-center mt-10">
            <Button onClick={handleLoadMore}>
              {t("loadMore")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
