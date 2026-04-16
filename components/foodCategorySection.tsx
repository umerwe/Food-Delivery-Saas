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
  <section className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-[40px] sm:pt-[80px]">
    {/* Header */}
    <div className="flex items-center justify-between mb-[30px] sm:mb-[60px]">
      <h2 className="text-[24px] sm:text-[32px] lg:text-[42px] font-semibold text-[#212121]">
        Categories
      </h2>

      <div className="flex items-center gap-3 sm:gap-[16.5px]">
        <Button
          variant="link"
          className="text-primary font-bold text-sm sm:text-lg p-0"
          onClick={() => router.push("/categories")}
        >
          View All
          <ChevronRight className="w-[10px] h-[16px]" strokeWidth={3} />
        </Button>

        {/* Arrows (hide on mobile) */}
        <div className="hidden sm:flex gap-2">
          <div
            onClick={scrollLeft}
            className="w-[50px] h-[50px] lg:w-[76px] lg:h-[76px] rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-[#FFB20E4A] cursor-pointer"
          >
            <ChevronLeft size={24} className="lg:w-[40px] lg:h-[40px]" />
          </div>

          <div
            onClick={scrollRight}
            className="w-[50px] h-[50px] lg:w-[76px] lg:h-[76px] rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-[#FFB20E4A] cursor-pointer"
          >
            <ChevronRight size={24} className="lg:w-[40px] lg:h-[40px]" />
          </div>
        </div>
      </div>
    </div>

    {/* Categories */}
    {loading ? (
      <div className="flex gap-4 sm:gap-6 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-3">
            <div className="w-[120px] h-[120px] sm:w-[180px] sm:h-[180px] rounded-full bg-gray-200 animate-pulse" />
            <div className="w-[80px] h-[16px] bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    ) : categories.length === 0 ? (
      <p className="text-gray-400 text-sm">No categories found</p>
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
                className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
                onClick={() =>
                  router.push(`/items?categoryId=${item.id}`)
                }
              >
                <div className="flex flex-col items-center gap-3 sm:gap-4 cursor-pointer group">
                  <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] lg:w-[200px] lg:h-[200px] rounded-full overflow-hidden border-2 sm:border-4 border-transparent group-hover:border-primary transition-all">
                    <Image
                      src={image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 text-center">
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
   <div className="flex flex-col sm:flex-row justify-center sm:justify-end gap-3 mt-[30px] sm:mt-[60px] mb-[50px] sm:mb-[80px]">

  {/* Group Order (Secondary CTA) */}
  <Button
    variant="ghost"
    className="w-full sm:w-auto bg-orange-50 text-primary border border-orange-200 hover:bg-orange-100 transition rounded-full"
    onClick={() => router.push("/group-order")}
  >
    Group Order
  </Button>

  {/* Order Now (Primary CTA) */}
  <Button
    variant="primary"
    className="w-full sm:w-auto "
    onClick={() => router.push("/categories")}
  >
    Order Now
  </Button>

</div>

    {/* Banners */}
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
      {banners.map((banner, index) => (
        <div
          onClick={() => router.push("/details")}
          key={index}
          className="space-y-3 sm:space-y-4 cursor-pointer"
        >
          <div className="relative aspect-[4/3] rounded-[16px] sm:rounded-[20px] overflow-hidden shadow-md">
            <Image
              src={banner.image}
              alt="Promotion"
              fill
              className="object-cover object-top"
            />
          </div>
          <p className="text-[#424242] text-center text-[16px] sm:text-[18px] lg:text-[18px] font-semibold leading-tight">
            {banner.text}
          </p>
        </div>
      ))}
    </div>
  </section>
);
}