export const SUPPORTED_LOCALES = ["en", "de"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LANGUAGE_LABELS: Record<AppLocale, string> = {
  en: "English",
  de: "Deutsch",
};

export const LOCALE_STORAGE_KEY = "deliveryway-customer-locale";

export const isSupportedLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" &&
  SUPPORTED_LOCALES.includes(value as AppLocale);

export const resolveLocale = (value: unknown): AppLocale =>
  isSupportedLocale(value) ? value : DEFAULT_LOCALE;
