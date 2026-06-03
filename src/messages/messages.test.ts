import { describe, expect, it } from "vitest";

import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";

const REQUIRED_ROOT_NAMESPACES = [
  "common",
  "navigation",
  "footer",
  "auth",
  "home",
  "about",
  "contact",
  "categories",
  "menu",
  "items",
  "productDetails",
  "cart",
  "checkout",
  "orders",
  "ordersHistory",
  "payments",
  "profile",
  "addresses",
  "reservations",
  "reserveTable",
  "orderStatus",
  "notifications",
  "groupOrder",
  "branchSelector",
  "legal",
  "validation",
  "errors",
] as const;

type MessageRecord = Record<string, unknown>;

const collectMessageKeys = (messages: MessageRecord, prefix = ""): string[] => {
  return Object.entries(messages).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return collectMessageKeys(value as MessageRecord, nextKey);
    }

    return [nextKey];
  });
};

describe("message catalog completeness", () => {
  it("keeps English and German message keys identical", () => {
    const enKeys = new Set(collectMessageKeys(enMessages));
    const deKeys = new Set(collectMessageKeys(deMessages));

    const missingInGerman = [...enKeys].filter((key) => !deKeys.has(key)).sort();
    const missingInEnglish = [...deKeys].filter((key) => !enKeys.has(key)).sort();

    expect(missingInGerman).toEqual([]);
    expect(missingInEnglish).toEqual([]);
  });

  it("contains every required root namespace in both locales", () => {
    for (const namespace of REQUIRED_ROOT_NAMESPACES) {
      expect(enMessages).toHaveProperty(namespace);
      expect(deMessages).toHaveProperty(namespace);
    }
  });
});
