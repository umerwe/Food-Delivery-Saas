"use client";

import CategoryTabs from "@/components/items/CategoryTabs";
import ItemsListing from "@/components/items/Items";
import PizzaBanner from "@/components/items/PizzaBanner";
import { useSearchParams } from "next/navigation";

export default function ItemsPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || "";

  return (
    <div>
      <PizzaBanner />
      <CategoryTabs activeCategoryId={categoryId} />
      <ItemsListing categoryId={categoryId} />
    </div>
  );
}