"use client";

import type { LucideIcon } from "lucide-react";
import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Music2,
  Twitter,
} from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo } from "react";

import { useAuthContext } from "@/hooks/useAuth";
import { formatDisplayAddress } from "@/lib/address-display";
import { useHome } from "@/hooks/useHome";
import { normalizeBranch } from "@/lib/branch-selector";
import { resolveHomeBranchId, resolveHomeRestaurantId } from "@/lib/home";

type SocialLink = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

const SOCIAL_LINKS: Record<string, { label: string; icon: LucideIcon }> = {
  website: { label: "Website", icon: Globe },
  facebook: { label: "Facebook", icon: Facebook },
  instagram: { label: "Instagram", icon: Instagram },
  tiktok: { label: "TikTok", icon: Music2 },
  x: { label: "X", icon: Twitter },
  twitter: { label: "X", icon: Twitter },
  linkedin: { label: "LinkedIn", icon: Linkedin },
};

const normalizeExternalHref = (value?: string | null) => {
  const href = value?.trim();

  if (!href) return null;

  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }

  return href.includes(".") ? `https://${href}` : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getTextField = (record: unknown, keys: string[]) => {
  if (!isRecord(record)) return null;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return null;
};

const getNestedTextField = (record: unknown, keys: string[]) => {
  const directValue = getTextField(record, keys);

  if (directValue) return directValue;
  if (!isRecord(record)) return null;

  return getTextField(record.contactInfo, keys);
};

const buildSocialLinks = (
  links?: Record<string, string | null | undefined> | null
): SocialLink[] => {
  if (!links) return [];

  return Object.entries(links).reduce<SocialLink[]>((items, [key, value]) => {
    const normalizedKey = key.trim().toLowerCase();
    const meta = SOCIAL_LINKS[normalizedKey];
    const href = normalizeExternalHref(value);

    if (!meta || !href) return items;

    items.push({
      key: normalizedKey,
      label: meta.label,
      href,
      icon: meta.icon,
    });

    return items;
  }, []);
};

export const Footer = () => {
  const pathname = usePathname();
  const t = useTranslations("footer");
  const { user, loading } = useAuthContext();
  const restaurantId = resolveHomeRestaurantId(user);
  const branchId = resolveHomeBranchId(user);
  const homeQuery = useHome(
    restaurantId,
    branchId || null,
    Boolean(!loading && restaurantId)
  );
  const homeData = homeQuery.data?.data;
  const restaurant = homeData?.restaurant;
  const branch = useMemo(() => normalizeBranch(homeData?.branch), [homeData?.branch]);
  const restaurantName =
    restaurant?.name?.trim() || homeData?.branding.restaurantName || "FoodLover.club";
  const description =
    restaurant?.tagline?.trim() ||
    restaurant?.bio?.trim() ||
    restaurant?.description?.trim() ||
    homeData?.branding.tagline ||
    t("brandDescription");
  const logoUrl =
    restaurant?.logoUrl?.trim() ||
    homeData?.branding.logo.light ||
    homeData?.branding.logo.default ||
    null;
  const branchAddress =
    formatDisplayAddress(homeData?.branch) ||
    (branch?.address ? formatDisplayAddress(branch.address) : "");
  const branchPhone =
    getNestedTextField(homeData?.branch, ["phone", "phoneNumber", "contactPhone", "contactNumber", "mobile"]) ||
    getNestedTextField(restaurant, ["phone", "phoneNumber", "contactPhone", "contactNumber", "mobile"]);
  const socialLinks = buildSocialLinks(restaurant?.socialMediaLinks);
  const privacyHref = restaurantId
    ? `/privacy?restaurantId=${encodeURIComponent(restaurantId)}`
    : "/privacy";

  const quickLinks = [
    // { label: "Menu", href: "/menu" },
    { label: t("categories"), href: "/#categories" },
    { label: t("contact"), href: "/contact" },
    { label: t("orderNow"), href: "/items" },
  ];

  const companyLinks = [
    { label: t("about"), href: "/about" },
    { label: t("terms"), href: "/terms" },
    { label: t("privacyPolicy"), href: privacyHref },
    { label: t("refundPolicy"), href: "/refund" },
  ];

  const hideOnMobileHome = pathname === "/";

  return (
    <footer
      className={`bg-[#111116] pt-[94.39px] pb-8 px-4 transition-colors duration-300 ${
        hideOnMobileHome ? "hidden md:block" : ""
      }`}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* BRAND */}
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={restaurantName}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-2xl object-cover"
                />
              ) : null}
              <div>
                <h2 className="text-[28px] font-bold leading-tight text-white">
                  {restaurantName}
                </h2>
                {branch?.name ? (
                  <p className="mt-1 text-sm font-medium text-gray-400">
                    {branch.name}
                  </p>
                ) : null}
              </div>
            </div>

            <p
              className="text-gray-300 text-sm leading-relaxed max-w-[300px] mt-[16px] mb-[24px]"
            >
              {description}
            </p>

            {/* SOCIAL */}
            {socialLinks.length > 0 ? (
              <div className="flex gap-4">
                {socialLinks.map(({ icon: Icon, href, key, label }) => (
                  <Link
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full bg-[#29292D] flex items-center justify-center hover:bg-[#F15A2B15] transition-colors"
                  >
                    <Icon size={18} className="text-white" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* QUICK LINKS */}
          <div className="lg:pl-30">
            <h3 className="text-xl font-bold text-white mb-[26px]">
              {t("quickLinks")}
            </h3>

            <ul className="flex flex-col gap-[22px]">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-300 text-base hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY */}
          <div className="lg:pl-10">
            <h3 className="text-xl font-bold text-white mb-[26px]">
              {t("company")}
            </h3>

            <ul className="flex flex-col gap-[22px]">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-gray-300 text-base hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-xl font-bold text-white mb-[26px]">
              {t("contact")}
            </h3>

            <div className="flex flex-col gap-[22px] text-base">
              {branch?.name ? (
                <p className="text-white font-medium">
                  {t("branch")} :{" "}
                  <span className="text-gray-300 font-normal">{branch.name}</span>
                </p>
              ) : null}

              {branchAddress ? (
                <p className="text-white font-medium leading-relaxed">
                  {t("address")} :{" "}
                  <span className="text-gray-300 font-normal">{branchAddress}</span>
                </p>
              ) : null}

              {branchPhone ? (
                <p className="text-white font-medium">
                  {t("phone")} :{" "}
                  <a
                    href={`tel:${branchPhone.replace(/[^\d+]/g, "")}`}
                    className="text-gray-300 font-normal transition-colors hover:text-primary"
                  >
                    {branchPhone}
                  </a>
                </p>
              ) : null}

            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <p className="text-center text-gray-300 text-sm md:text-base">
            {t("copyright", { year: new Date().getFullYear(), name: restaurantName })}
          </p>
        </div>
      </div>
    </footer>
  );
};
