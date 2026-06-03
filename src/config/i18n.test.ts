import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  resolveLocale,
} from "@/config/i18n";

describe("i18n config", () => {
  it("uses English as the default locale", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("supports English and German", () => {
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("de");
  });

  it("resolves unsupported locales to English", () => {
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale(null)).toBe("en");
  });

  it("resolves a valid locale to itself", () => {
    expect(resolveLocale("de")).toBe("de");
    expect(resolveLocale("en")).toBe("en");
  });

  it("uses the Deliveryway customer locale storage key", () => {
    expect(LOCALE_STORAGE_KEY).toBe("deliveryway-customer-locale");
  });
});
