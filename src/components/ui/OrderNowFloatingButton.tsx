"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";

export function OrderNowFloatingButton() {
  const t = useTranslations("common");

  return (
    <Link
      href="/menu"
      className="
        fixed bottom-5 right-5 z-[9999]
        inline-flex items-center gap-2
        rounded-full bg-primary px-5 py-3
        text-sm font-semibold text-white
        shadow-lg transition-all duration-200
        hover:scale-[1.03] hover:bg-primary-300
        active:scale-[0.98]
      "
      aria-label={t("orderNow")}
    >
      <ShoppingBag size={18} />
      <span>{t("orderNow")}</span>
    </Link>
  );
}
