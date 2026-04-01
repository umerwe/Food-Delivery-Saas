"use client";

import RestaurantHeader from "@/components/items/RestaurantHeader";
import ItemsLayout from "@/components/items/ItemsLayout";
import { useSearchParams } from "next/navigation";

export default function ItemsPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";

  return (
    <div className="min-h-screen md:px-35">
      <RestaurantHeader />
      <ItemsLayout categoryId={categoryId} />
    </div>
  );
}