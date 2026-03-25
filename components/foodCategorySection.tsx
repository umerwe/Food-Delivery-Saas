"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

const banners = [
  {
    image: "/promo1.jpg",
    text: "Made with fresh, local ingredients and love",
  },
  {
    image: "/promo2.jpg",
    text: "Made with fresh, local ingredients and love",
  },
  {
    image: "/promo3.jpg",
    text: "Made with fresh, local ingredients and love",
  },
];

export default function FoodCategorySection() {
  const router = useRouter();
  const { token } = useAuth();
  const { get } = useApi(token);

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carouselApi = useRef<any>(null);

  const getStoredAuth = () => {
    const stored = localStorage.getItem("auth");
    return stored ? JSON.parse(stored) : null;
  };

  /* ================= FETCH CATEGORIES ================= */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const stored = getStoredAuth();
        const restaurantId = stored?.user?.restaurantId;

        if (!restaurantId || !token) return;

        setLoading(true);

        const res = await get(
          `/v1/menu/categories?restaurantId=${restaurantId}`
        );

        if (res) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [token]);

  /* ================= NAVIGATION ================= */
  const scrollLeft = () => {
    carouselApi.current?.scrollPrev();
  };

  const scrollRight = () => {
    carouselApi.current?.scrollNext();
  };

  return (
    <section className="max-w-[1400px] mx-auto px-6 pt-[80px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[60px]">
        <h2 className="text-[42px] font-semibold text-[#212121]">
          Categories
        </h2>

        <div className="flex items-center gap-[16.5px]">
          <Button
            variant="link"
            className="text-[#F15A2B] font-bold text-lg p-0 cursor-pointer"
            onClick={() => router.push("/categories")}
          >
            View All
            <ChevronRight className="w-[10px] h-[16px]" strokeWidth={3} />
          </Button>

          {/* Arrows */}
          <div className="flex gap-2">
            <div
              onClick={scrollLeft}
              className="w-[76px] h-[76px] rounded-full bg-[#F15A2B] flex items-center justify-center text-white shadow-lg shadow-[#FFB20E4A] cursor-pointer"
            >
              <ChevronLeft size={40} strokeWidth={2} />
            </div>

            <div
              onClick={scrollRight}
              className="w-[76px] h-[76px] rounded-full bg-[#F15A2B] flex items-center justify-center text-white shadow-lg shadow-[#FFB20E4A] cursor-pointer"
            >
              <ChevronRight size={40} strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      {/* ================= CATEGORIES ================= */}
      {loading ? (
        // ✅ Loading Skeleton
        <div className="flex gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-4">
              <div className="w-[200px] h-[200px] rounded-full bg-gray-200 animate-pulse" />
              <div className="w-[100px] h-[20px] bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-gray-400">No categories found</p>
      ) : (
        <Carousel
          className="w-full"
          setApi={(api) => (carouselApi.current = api)}
        >
          <CarouselContent>
            {categories.map((item) => {
              const image =
                item.imageUrl && item.imageUrl.startsWith("http")
                  ? item.imageUrl
                  : "/burger.png";

              return (
                <CarouselItem
                  key={item.id}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/5"
                  onClick={() =>
                    router.push(`/items?categoryId=${item.id}`)
                  }
                >
                  <div className="flex flex-col items-center gap-4 cursor-pointer group">
                    <div className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-4 border-transparent group-hover:border-[#F15A2B] transition-all">
                      <Image
                        src={image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <span className="text-lg font-bold text-gray-800">
                      {item.name}
                    </span>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      )}

      {/* CTA */}
      <div className="flex justify-end mt-[60px] mb-[80px]">
        <Button
          variant="primary"
          onClick={() => router.push("/details")}
        >
          Order Now
        </Button>
      </div>

      {/* ================= BANNERS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {banners.map((banner, index) => (
          <div
            onClick={() => router.push("/details")}
            key={index}
            className="space-y-4"
          >
            <div className="relative aspect-4/3 rounded-[20px] overflow-hidden shadow-md">
              <Image
                src={banner.image}
                alt="Promotion"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-[#424242] text-[22px] font-semibold leading-tight">
              {banner.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}