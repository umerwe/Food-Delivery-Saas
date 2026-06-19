"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { AboutHeroContent } from "@/services/public-content";
import { isRemoteHttpsImageUrl } from "@/lib/image-fallback";

type AboutBannerProps = {
  content?: AboutHeroContent;
  coverImage?: string | null;
};

const getHttpsImageUrl = (...values: Array<string | null | undefined>) =>
  values.find((value) => value?.startsWith("https://")) ?? "/about/banner.png";

export default function AboutBanner({ content, coverImage }: AboutBannerProps) {
  const t = useTranslations("about.banner");
  const commonT = useTranslations("common");
  const imageUrl = getHttpsImageUrl(content?.imageUrl, coverImage);
  const title = content?.title || t("title");
  const description = content?.subtitle || t("description");
  const ctaLabel = content?.ctaLabel || commonT("orderNow");
  const ctaHref = content?.ctaHref || "/items";

  return (
    <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden">
      {/* Background Image */}
      <Image
        src={imageUrl}
        alt={t("imageAlt")}
        fill
        priority
        unoptimized={isRemoteHttpsImageUrl(imageUrl)}
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#333333]/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">

        <h1 className="text-white text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
          {title}
        </h1>

        <p className="text-white/80 mt-4 text-base md:text-lg lg:text-xl max-w-2xl">
          {description}
        </p>

        <Link href={ctaHref}
          className="mt-8 bg-[#FF5A2C] hover:bg-[#e14e25] text-white px-8 py-3 text-base md:text-lg rounded-md"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
