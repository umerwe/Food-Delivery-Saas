"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock3, Copy, TicketPercent, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { formatMoney } from "@/lib/money";
import type { CustomerCoupon } from "@/types/customer-coupons";

type CouponPerkBannerProps = {
  coupons?: CustomerCoupon[] | null;
  currency?: string | null;
};

const toMoney = (value?: number | null, currency?: string | null) => {
  if (!value || value <= 0) {
    return "";
  }

  return formatMoney(value, currency);
};

const formatDiscount = (coupon: CustomerCoupon, currency?: string | null) => {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountValue}%`;
  }

  if (coupon.discountType === "FLAT") {
    return toMoney(coupon.discountValue, currency);
  }

  return coupon.discountValue > 0 ? toMoney(coupon.discountValue, currency) : "";
};

const formatExpiryDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
  });
};

export const CouponPerkBanner = ({ coupons, currency }: CouponPerkBannerProps) => {
  const t = useTranslations("navigation.couponBanner");
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const visibleCoupons = coupons?.filter(Boolean) ?? [];
  const coupon = visibleCoupons[activeIndex] ?? visibleCoupons[0] ?? null;
  const hasMultipleCoupons = visibleCoupons.length > 1;

  useEffect(() => {
    if (activeIndex < visibleCoupons.length) {
      return;
    }

    setActiveIndex(0);
  }, [activeIndex, visibleCoupons.length]);

  useEffect(() => {
    if (isDismissed || !hasMultipleCoupons) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleCoupons.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [hasMultipleCoupons, isDismissed, visibleCoupons.length]);

  useEffect(() => {
    setCopiedCode(null);
  }, [coupon?.code]);

  useEffect(() => {
    if (!copiedCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedCode(null);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [copiedCode]);

  if (!coupon || isDismissed) {
    return null;
  }

  const discount = formatDiscount(coupon, currency);
  const minOrder = toMoney(coupon.minOrderAmount, currency);
  const maxDiscount = toMoney(coupon.maxDiscountAmount, currency);
  const expiryDate = formatExpiryDate(coupon.expiresAt);
  const description = coupon.description?.trim();
  const isCopied = copiedCode === coupon.code;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopiedCode(coupon.code);
    } catch {
      setCopiedCode(null);
    }
  };

  return (
    <section className="relative z-40 bg-[#FFF7F7] px-4 py-1.5 shadow-[0_10px_24px_rgba(121,34,42,0.08)]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2.5 rounded-[20px] border border-[#F4DCDD] bg-white/75 py-2.5 pl-3.5 pr-2.5 shadow-[0_7px_20px_rgba(121,34,42,0.045)] lg:gap-4 lg:pl-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1F2] text-primary ring-1 ring-[#F4C9CE]">
          <TicketPercent size={18} />
        </div>

        <div
          key={`${coupon.id}-${coupon.code}`}
          className="coupon-banner-slide min-w-0 flex-1 lg:flex lg:items-center lg:gap-4"
        >
          <div className="min-w-0 lg:min-w-[330px]">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
              {t("eyebrow")}
            </p>
            <h2 className="mt-0.5 truncate text-[15px] font-black leading-tight text-[#171717] sm:text-lg">
              {coupon.title || (discount ? t("headline", { discount }) : coupon.code)}
            </h2>
          </div>

          <div className="mt-2 hidden h-8 w-px bg-[#F0D5D6] lg:block" />

          <p className="mt-2 min-w-0 truncate text-xs font-semibold text-[#6B7078] lg:mt-0 lg:flex-1">
            {minOrder ? t("minimum", { amount: minOrder }) : description || t("browseOffer")}
            {maxDiscount ? ` · ${t("maxDiscount", { amount: maxDiscount })}` : ""}
            {coupon.maxUsesPerCustomer ? ` · ${t("perCustomer")}` : ""}
          </p>
        </div>

        <div className="hidden items-center overflow-hidden rounded-2xl border border-dashed border-[#EFA9B1] bg-white p-1 lg:flex">
          <span className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#A7747B]">
            {t("coupon")}
          </span>
          <span className="px-2.5 text-base font-black uppercase tracking-[0.13em] text-primary">
            {coupon.code}
          </span>
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="inline-flex h-9 min-w-[92px] items-center justify-center rounded-xl bg-primary px-3.5 text-center text-[10px] font-black uppercase leading-[1.05] text-white transition-colors hover:bg-primary/90"
            aria-label={isCopied ? t("copied") : t("copyCode")}
          >
            {isCopied ? (
              <Check size={16} className="shrink-0" />
            ) : (
              <>
                <Copy size={14} className="mr-1.5 shrink-0" />
                {t("copyCode")}
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleCopyCode()}
          className="inline-flex h-9 min-w-16 shrink-0 items-center justify-center rounded-xl bg-primary px-3 text-[10px] font-black uppercase text-white lg:hidden"
          aria-label={isCopied ? t("copied") : t("copyCode")}
        >
          {isCopied ? <Check size={16} /> : coupon.code}
        </button>

        {expiryDate ? (
          <div className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#5F6570] xl:flex">
            <Clock3 size={15} className="text-primary" />
            {t("ends", { date: expiryDate })}
          </div>
        ) : null}

        <Link
          href="/items"
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#171717] text-white shadow-lg shadow-black/20 transition-colors hover:bg-primary md:flex"
          aria-label={t("browse")}
        >
          <ArrowRight size={18} />
        </Link>

        {hasMultipleCoupons ? (
          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            {visibleCoupons.map((item, index) => (
              <button
                key={`${item.id}-${item.code}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === activeIndex ? "w-5 bg-primary" : "w-1.5 bg-[#E8B9BE]"
                }`}
                aria-label={`${t("coupon")} ${index + 1}`}
              />
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#B4A2A4] ring-1 ring-[#F0D8DA] transition-colors hover:text-primary"
          aria-label={t("dismiss")}
        >
          <X size={16} />
        </button>
      </div>
    </section>
  );
};
