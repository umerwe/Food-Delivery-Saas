"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"

export function AuthHero() {
  const t = useTranslations("auth")

  return (
    <div className="hidden lg:flex w-1/2 relative">
      <Image
        src="/auth-hero.jpg"
        alt={t("brandHeroAlt")}
        fill
        className="object-cover"
        priority
      />
    </div>
  )
}
