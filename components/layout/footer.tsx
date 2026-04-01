"use client";

import { Twitter, Instagram, Linkedin, Globe } from "lucide-react";
import Link from "next/link";

const Footer = ({ isHome = false }: { isHome?: boolean }) => {
  const quickLinks = [
    // { label: "Menu", href: "/menu" },
    { label: "Categories", href: "/#categories" },
    { label: "Contact", href: "/contact" },
    { label: "Order Now", href: "/categories" },
  ];

  const companyLinks = [
    { label: "About", href: "/about" },
    { label: "Terms", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Refund Policy", href: "/refund" },
  ];

  const socialLinks = [
    { icon: Globe, href: "/" },
    { icon: Twitter, href: "https://twitter.com" },
    { icon: Instagram, href: "https://instagram.com" },
    { icon: Linkedin, href: "https://linkedin.com" },
  ];

  // Dynamic theme styles
  const textColor = isHome ? "text-gray-800" : "text-gray-300";
  const headingColor = isHome ? "text-[#2D2D2D]" : "text-white";
  const borderColor = isHome ? "border-gray-200" : "border-gray-800";

  return (
    <footer
      className={`${
        !isHome ? "bg-[#111116]" : ""
      } pt-[94.39px] pb-8 px-4 transition-colors duration-300`}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* BRAND */}
          <div className="flex flex-col">
            <h2 className={`text-[28px] font-bold ${headingColor}`}>
              FoodLover.club
            </h2>

            <p
              className={`${textColor} text-sm leading-relaxed max-w-[300px] mt-[16px] mb-[24px]`}
            >
              A perfect place for perfect food, all kind of parties and any other
              gathering as well, for our guests to simply unwind and relax in
              complete serenity.
            </p>

            {/* SOCIAL */}
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href }, index) => (
                <Link
                  key={index}
                  href={href}
                  target="_blank"
                  className={`w-10 h-10 rounded-full ${
                    isHome ? "bg-[#FDEEE9]" : "bg-[#29292D]"
                  } flex items-center justify-center hover:bg-[#F15A2B15] transition-colors`}
                >
                  <Icon
                    size={18}
                    className={isHome ? "text-primary" : "text-white"}
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="lg:pl-30">
            <h3 className={`text-xl font-bold ${headingColor} mb-[26px]`}>
              Quick Links
            </h3>

            <ul className="flex flex-col gap-[22px]">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`${textColor} text-base hover:text-primary transition-colors`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY */}
          <div className="lg:pl-10">
            <h3 className={`text-xl font-bold ${headingColor} mb-[26px]`}>
              Company
            </h3>

            <ul className="flex flex-col gap-[22px]">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className={`${textColor} text-base hover:text-primary transition-colors`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className={`text-xl font-bold ${headingColor} mb-[26px]`}>
              Contact
            </h3>

            <div className="flex flex-col gap-[22px] text-base">
              <p className={`${headingColor} font-medium`}>
                Call :{" "}
                <a
                  href="tel:+919512212240"
                  className={`${textColor} font-normal hover:text-primary`}
                >
                  +91 9512212240
                </a>
              </p>

              <p className={`${headingColor} font-medium`}>
                Email :{" "}
                <a
                  href="mailto:foodloversksb@gmail.com"
                  className={`${textColor} font-normal hover:text-primary`}
                >
                  foodloversksb@gmail.com
                </a>
              </p>

              <p className={`${headingColor} font-medium leading-relaxed`}>
                Address :{" "}
                <span className={`${textColor} font-normal`}>
                  Food Lovers, The Family Garden Restaurant, Kuwarda Chowkdi,
                  Kosamba.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM */}
        <div className={`border-t ${borderColor} pt-8 mt-8`}>
          <p
            className={`text-center ${textColor} text-sm md:text-base`}
          >
            Copyright © 2026 Food Lovers. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;