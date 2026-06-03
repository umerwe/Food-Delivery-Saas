"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { NextIntlClientProvider } from "next-intl";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type AppLocale,
  resolveLocale,
} from "@/config/i18n";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";

type I18nProviderProps = {
  children: ReactNode;
};

type I18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  isLocaleReady: boolean;
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const messagesByLocale: Record<AppLocale, AbstractIntlMessages> = {
  en: enMessages,
  de: deMessages,
};

export const I18nContext = createContext<I18nContextValue | null>(null);

const readCookieLocale = () => {
  const localeCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_STORAGE_KEY}=`));

  return localeCookie ? decodeURIComponent(localeCookie.split("=")[1] || "") : null;
};

const persistLocale = (locale: AppLocale) => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_STORAGE_KEY}=${encodeURIComponent(
    locale
  )}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [isLocaleReady, setIsLocaleReady] = useState(false);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    const cookieLocale = readCookieLocale();
    const resolvedLocale = resolveLocale(storedLocale || cookieLocale);

    setLocaleState(resolvedLocale);
    document.documentElement.lang = resolvedLocale;
    persistLocale(resolvedLocale);
    setIsLocaleReady(true);
  }, []);

  const setLocale = useCallback((nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    persistLocale(nextLocale);
  }, []);

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      isLocaleReady,
    }),
    [isLocaleReady, locale, setLocale]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      <NextIntlClientProvider
        locale={locale}
        messages={messagesByLocale[locale]}
        timeZone="UTC"
      >
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
