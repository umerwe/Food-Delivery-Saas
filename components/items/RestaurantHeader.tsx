"use client";

import Image from "next/image";
import { Star, MapPin, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

export default function RestaurantHeader() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
const router = useRouter();
  const { token } = useAuth();
  const { get } = useApi(token);

  const [category, setCategory] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const auth = JSON.parse(localStorage.getItem("auth") || "{}");
        const restaurantId = auth?.user?.restaurantId;

        if (!restaurantId) return;

        const catRes = await get(
          `/v1/menu/categories?restaurantId=${restaurantId}`
        );

        const categories = catRes?.data || [];
        const selectedCategory = categories.find(
          (c: any) => c.id === categoryId
        );

        setCategory(selectedCategory);

        setRestaurant({
          name: auth?.user?.restaurantName || "McDonald's",
          address:
            auth?.user?.address ||
            "Connaught Place, Central Delhi",
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
  }, [categoryId, token]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="bg-white border-b border-gray-300 py-6 md:py-6 md:pb-10 mx-4 md:mx-10 mt-6 flex flex-col lg:flex-row gap-8 items-start">
      
      {/* LEFT CONTENT */}
      <div className="flex-1 w-full pt-5">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
         Category of {category?.name || "Menu"}
        </h1>

        {/* <p className="text-lg text-gray-500 mb-3">
          {category?.name || "Menu"}
        </p> */}

        {/* RATING */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Star className="text-yellow-500 fill-yellow-500" size={16} />
          <span className="font-medium">4.5</span>
          <span className="text-[#EC5834]">| 450 Reviews</span>
        </div>

        {/* BUTTON */}
        <button onClick={()=>router.push("/reservetable")} className="cursor-pointer bg-[#EC5834] hover:bg-[#d94e2d] transition text-white px-12 py-2.5 rounded-[10px] mb-5 text-sm font-medium">
          Reserve Table
        </button>

        {/* INFO */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            {restaurant?.address}
          </div>

          <div className="flex items-center gap-2">
            <Clock size={14} />
            Open from 10:00 AM - 11:00 PM
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE (BIGGER LIKE DESIGN) */}
      <div className="w-full lg:w-[520px] h-[260px] md:h-[300px] relative rounded-3xl overflow-hidden">
        <Image
          src={
            category?.imageUrl ||
            "/categories/background_banner.png"
          }
          alt={category?.name || "food"}
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}