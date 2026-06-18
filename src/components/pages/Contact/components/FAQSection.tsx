"use client";

import { useState, ReactNode } from "react";
import Image from "next/image";
import {
  FaChevronDown,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CustomerFaqItem, HelpSupportContent } from "@/services/public-content";

type FAQSectionProps = {
  supportContent?: HelpSupportContent;
  faqs?: CustomerFaqItem[];
};

export default function FAQSection({ supportContent, faqs: dynamicFaqs }: FAQSectionProps) {
  const router = useRouter();
  const t = useTranslations("contact.faq");
  const fallbackFaqs = [
    {
      id: "credential",
      question: t("credentialQuestion"),
      answer: t("credentialAnswer"),
    },
    {
      id: "safety",
      question: t("safetyQuestion"),
      answer: t("safetyAnswer"),
    },
    {
      id: "compliance",
      question: t("complianceQuestion"),
      answer: t("complianceAnswer"),
    },
  ];
  const faqs = dynamicFaqs?.length ? dynamicFaqs : fallbackFaqs;
  const email = supportContent?.contacts.email;
  const phone = supportContent?.contacts.phone;
  const whatsapp = supportContent?.contacts.whatsapp;
  const phoneHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined;
  const whatsappHref = whatsapp ? `https://wa.me/${whatsapp.replace(/[^\d]/g, "")}` : undefined;

  return (
    <section className="bg-[#F4F4F4] py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-[1150px] mx-auto grid lg:grid-cols-[1fr_360px] gap-10">

        {/* LEFT SIDE */}
        <div>

          {/* HEADER */}
          <div className="mb-8">
            <h2 className="text-[28px] font-semibold text-gray-900">
              {t("title")}
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              {t("description")}
            </p>
          </div>

          {/* FAQ LIST */}
          <div className="space-y-4">
            {faqs.map((item) => (
              <FAQItem
                key={item.id}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* DIRECT ASSISTANCE */}
          <div>
            <h3 className="text-[18px] font-semibold text-gray-900">
              {t("directAssistanceTitle")}
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              {t("directAssistanceDescription")}
            </p>

            {/* CONTACT */}
            <div className="mt-6 space-y-4 text-sm">

              {email ? (
                <a href={`mailto:${email}`} className="flex items-center gap-3 text-gray-700 hover:text-primary">
                  <FaEnvelope className="text-gray-700" />
                  {email}
                </a>
              ) : null}

              {phone ? (
                <a href={phoneHref} className="flex items-center gap-3 text-gray-700 hover:text-primary">
                  <FaPhoneAlt className="text-gray-700" />
                  {phone}
                </a>
              ) : null}

              {whatsapp ? (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-primary">
                  <FaPhoneAlt className="text-gray-700" />
                  {whatsapp}
                </a>
              ) : null}

              {!email && !phone && !whatsapp ? (
                <>
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaEnvelope className="text-gray-700" />
                    concierge@editorialtrust.sys
                  </div>

                  <div className="flex items-center gap-3 text-gray-700">
                    <FaPhoneAlt className="text-gray-700" />
                    +1 (800) TRUST-SYS
                  </div>
                </>
              ) : null}
            </div>

            {/* CTA */}
            <button onClick={()=>router.push('/contact/chat')} className="cursor-pointer mt-6 w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition">
              {t("startLiveConsultation")}
            </button>
          </div>

          {/* FOUNDER NOTE */}
          <div className="bg-[#1C1C1C] text-white rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3">
              {t("archivistNoteTitle")}
            </h4>

            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              {t("archivistNote")}
            </p>

            <div className="flex items-center gap-3">
              <Image
                src="/contact/Founder.png"
                alt={t("founderAlt")}
                width={40}
                height={40}
                className="rounded-full object-cover"
              />

              <div>
                <p className="text-sm font-medium">Arthur P. Vance</p>
                <p className="text-xs text-gray-400">{t("chiefTrustOfficer")}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/*  FAQ ITEM (Accordion) */
type FAQItemProps = {
  question: string;
  answer: string;
};

function FAQItem({ question, answer }: FAQItemProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">

      {/* HEADER */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <p className="text-[14px] font-medium text-gray-800">
          {question}
        </p>

        <FaChevronDown
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {/* CONTENT */}
      {open && (
        <p className="text-gray-500 text-[13px] mt-3 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}
