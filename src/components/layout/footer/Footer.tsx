"use client";

import { Twitter, Instagram, Linkedin, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export const Footer = () => {
  const t = useTranslations("footer");

  const quickLinks = [
    // { label: "Menu", href: "/menu" },
    { label: t("categories"), href: "/#categories" },
    { label: t("contact"), href: "/contact" },
    { label: t("orderNow"), href: "/categories" },
  ];

  const companyLinks = [
    { label: t("about"), href: "/about" },
    { label: t("terms"), href: "/terms" },
    { label: t("privacyPolicy"), href: "/privacy" },
    { label: t("refundPolicy"), href: "/refund" },
  ];

  const socialLinks = [
    { icon: Globe, href: "/" },
    { icon: Twitter, href: "https://twitter.com" },
    { icon: Instagram, href: "https://instagram.com" },
    { icon: Linkedin, href: "https://linkedin.com" },
  ];

  return (
    <footer className="bg-[#111116] pt-[94.39px] pb-8 px-4 transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* BRAND */}
          <div className="flex flex-col">
            <h2 className="text-[28px] font-bold text-white">
              FoodLover.club
            </h2>

            <p
              className="text-gray-300 text-sm leading-relaxed max-w-[300px] mt-[16px] mb-[24px]"
            >
              {t("brandDescription")}
            </p>

            {/* SOCIAL */}
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href }, index) => (
                <Link
                  key={index}
                  href={href}
                  target="_blank"
                  className="w-10 h-10 rounded-full bg-[#29292D] flex items-center justify-center hover:bg-[#F15A2B15] transition-colors"
                >
                  <Icon size={18} className="text-white" />
                </Link>
              ))}
            </div>
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
              <p className="text-white font-medium">
                {t("call")} :{" "}
                <a
                  href="tel:+919512212240"
                  className="text-gray-300 font-normal hover:text-primary"
                >
                  +91 9512212240
                </a>
              </p>

              <p className="text-white font-medium">
                {t("email")} :{" "}
                <a
                  href="mailto:foodloversksb@gmail.com"
                  className="text-gray-300 font-normal hover:text-primary"
                >
                  foodloversksb@gmail.com
                </a>
              </p>

              <p className="text-white font-medium leading-relaxed">
                {t("address")} :{" "}
                <span className="text-gray-300 font-normal">
                  Food Lovers, The Family Garden Restaurant, Kuwarda Chowkdi,
                  Kosamba.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <p className="text-center text-gray-300 text-sm md:text-base">
            {t("copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};
