"use client";

import { Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import {
  LANGUAGE_LABELS,
  SUPPORTED_LOCALES,
  type AppLocale,
  isSupportedLocale,
} from "@/config/i18n";
import { useAppLocale } from "@/hooks/useAppLocale";
import { cn } from "@/lib/utils";

type LanguageSelectorProps = {
  className?: string;
};

const getShortLocaleLabel = (locale: AppLocale) => locale.toUpperCase();

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale, isLocaleReady } = useAppLocale();
  const t = useTranslations("navigation");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleValueChange = (value: string) => {
    if (isSupportedLocale(value)) {
      setLocale(value);
      setOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        aria-label={t("changeLanguage")}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-10 w-fit items-center justify-between gap-2 rounded-2xl border border-[#E8ECF0] bg-white px-3 text-xs font-semibold text-primary shadow-sm transition-colors hover:border-[var(--primary)]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          className
        )}
      >
        <span>{isLocaleReady ? getShortLocaleLabel(locale) : "EN"}</span>
        <ChevronDown
          className={cn(
            "size-4 opacity-50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("changeLanguage")}
          className="absolute right-0 top-[calc(100%+8px)] z-[99999] min-w-[8rem] overflow-hidden rounded-md border border-gray-100 bg-white p-1 shadow-md"
        >
          {SUPPORTED_LOCALES.map((supportedLocale) => {
            const selected = locale === supportedLocale;

            return (
              <button
                key={supportedLocale}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleValueChange(supportedLocale)}
                className="flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-sm text-gray-900 outline-none transition-colors hover:bg-gray-100 focus-visible:bg-gray-100"
              >
                <span>{LANGUAGE_LABELS[supportedLocale]}</span>
                {selected && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
