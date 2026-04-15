"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
}

export default function ExploreCategories() {
  const router = useRouter();
  
const { token, user, loading: authLoading } = useAuth();
  const { get , post} = useApi(token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const getStoredAuth = () => {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  };

  /* ================= FETCH ================= */
  const fetchCategories = async (pageNumber = 1) => {
    try {
      const stored = getStoredAuth();
      const restaurantId = stored?.user?.restaurantId;
console.log("res id", restaurantId);
console.log("tok is", token);
      if (!restaurantId || !token) return;

      if (pageNumber === 1) setLoading(true);

      const res = await get(
        `/v1/menu/categories?restaurantId=${restaurantId}&page=${pageNumber}&limit=10`
      );

      if (res?.data) {
        setCategories((prev) =>
          pageNumber === 1 ? res.data : [...prev, ...res.data]
        );

        setHasNext(res.meta?.hasNext || false);
        setPage(res.meta?.page || 1);
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
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
    const res = await get(`/v1/group-orders?search=${code}`);
    const order = res?.data?.find((o: any) => o.inviteCode === code);

    if (!order) return false;

    // ✅ if user is host
    if (order.hostUserId === user?.id) return true;

    // ✅ if user already participant
    const exists = order.participants?.some(
      (p: any) => p.userId === user?.id
    );

    return exists;
  } catch (err) {
    console.error("Check participant error", err);
    return false;
  }
};

const handleJoinGroupOrder = async (inviteCode: string) => {
  const res = await post("/v1/group-orders/join", { inviteCode });

  if (!res || res.error) {
    // ✅ show real backend message
    toast.error(res?.message || "Failed to join group order");

    // optional debug (very useful in dev)
    console.log("Join error details:", res?.details);

    return false;
  }

  return true;
};


useEffect(() => {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (code) {
    localStorage.setItem("groupOrderCode", code);
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
            Explore Categories
          </h2>
          <p className="text-[#8B5E57] mt-2 text-sm">
            Curated collections from the finest kitchens.
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
          <p className="text-gray-400">No categories found</p>
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
  const code = localStorage.getItem("groupOrderCode");

  if (code) {
    // ✅ check first
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
              Load More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}