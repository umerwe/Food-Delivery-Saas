"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { AboutStoryContent } from "@/services/public-content";

type OurStorySectionProps = {
  content?: string | null;
  story?: AboutStoryContent;
};

const ALLOWED_ABOUT_TAGS = new Set([
  "a",
  "b",
  "br",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "strong",
  "u",
  "ul",
]);

const ALLOWED_ABOUT_ATTRIBUTES = new Set(["href", "rel", "target"]);

const sanitizeAboutHtml = (value: string) => {
  let sanitized = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link)[^>]*>/gi, "")
    .replace(/\s(on[a-z]+|style|src|srcset)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href)\s*=\s*(["'])\s*(javascript:|data:)[^"']*\2/gi, "");

  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi, (match, tagName: string, rawAttributes: string) => {
    const tag = tagName.toLowerCase();

    if (!ALLOWED_ABOUT_TAGS.has(tag)) {
      return "";
    }

    if (match.startsWith("</")) {
      return `</${tag}>`;
    }

    const attributes = Array.from(rawAttributes.matchAll(/\s([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi))
      .map(([, name, doubleQuotedValue, singleQuotedValue, unquotedValue]) => {
        const attributeName = name.toLowerCase();
        const attributeValue = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? "";

        if (!ALLOWED_ABOUT_ATTRIBUTES.has(attributeName)) {
          return null;
        }

        if (attributeName === "href" && /^(javascript:|data:)/i.test(attributeValue.trim())) {
          return null;
        }

        return `${attributeName}="${attributeValue.replace(/"/g, "&quot;")}"`;
      })
      .filter(Boolean)
      .join(" ");

    const safeAttributes = attributes ? ` ${attributes}` : "";

    if (tag === "a") {
      const hasTarget = /\starget=/.test(safeAttributes);
      const hasRel = /\srel=/.test(safeAttributes);

      return `<${tag}${safeAttributes}${hasTarget ? "" : ' target="_blank"'}${hasRel ? "" : ' rel="noopener noreferrer"'}>`;
    }

    return `<${tag}${safeAttributes}>`;
  });

  return sanitized;
};

const stripAboutMetadataComment = (value: string) =>
  value.replace(/<!--\s*deliveryway-about-page:[\s\S]*?-->/i, "").trim();

const getStoryParagraphs = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

export default function OurStorySection({ content, story }: OurStorySectionProps) {
  const t = useTranslations("about.story");
  const safeContent = useMemo(
    () => sanitizeAboutHtml(story ? "" : stripAboutMetadataComment(content?.trim() ?? "")),
    [content, story]
  );
  const storyParagraphs = useMemo(() => getStoryParagraphs(story?.paragraphs ?? ""), [story?.paragraphs]);
  const imageUrl = story?.imageUrl || "/about/delivery_service.png";
  const badge = story?.badge || t("established");
  const eyebrow = story?.eyebrow || t("eyebrow");
  const title = story?.title;

  return (
    <section className="w-full py-16 md:py-20">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT: Image Card */}
        <div className="relative">
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src={imageUrl}
              alt={t("imageAlt")}
              width={500}
              height={500}
              className="object-cover w-full h-auto"
            />
          </div>

          {/* Floating Badge */}
          <div className="absolute bottom-[30px] right-[10px]">
            <div className="bg-[#FF5A2C] text-white px-6 py-4 rounded-md shadow-lg">
            <span className="text-lg md:text-xl font-semibold">
                {badge}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Content */}
        <div>
          <p className="text-[#FF5A2C] text-sm font-semibold tracking-wider uppercase">
            {eyebrow}
          </p>

          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
            {title || (
              <>
                {t("titleLineOne")} <br className="hidden md:block" />
                {t("titleLineTwo")}
              </>
            )}
          </h2>

          {storyParagraphs.length ? (
            <div className="mt-4 space-y-4 text-gray-600 text-sm md:text-base leading-relaxed">
              {storyParagraphs.map((paragraph) => (
                <p key={paragraph} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : safeContent ? (
            <div
              className="mt-4 space-y-4 text-gray-600 text-sm md:text-base leading-relaxed [&_p]:mt-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
          ) : (
            <>
              <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
                {t("paragraphOne")}
              </p>

              <p className="mt-4 text-gray-600 text-sm md:text-base leading-relaxed">
                {t("paragraphTwo")}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
