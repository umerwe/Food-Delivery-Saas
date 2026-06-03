import { describe, expect, it } from "vitest";

import {
  contactMessageSchema,
  createContactMessageSchema,
  createNewsletterSchema,
  newsletterSchema,
} from "./contact";

describe("contact validation schemas", () => {
  it("requires contact name, email, and message", () => {
    const result = contactMessageSchema.safeParse({ name: "", email: "", message: "" });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(
      expect.arrayContaining(["name", "email", "message"])
    );
  });

  it("rejects invalid emails", () => {
    expect(contactMessageSchema.safeParse({ name: "Ada", email: "bad", message: "Hi" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "bad" }).success).toBe(false);
  });

  it("accepts valid contact and newsletter payloads", () => {
    expect(contactMessageSchema.safeParse({ name: "Ada", email: "ada@example.com", message: "Hi" }).success).toBe(true);
    expect(newsletterSchema.safeParse({ email: "ada@example.com" }).success).toBe(true);
  });

  it("supports translated validation messages", () => {
    const translatedContactSchema = createContactMessageSchema({
      nameRequired: "Name erforderlich",
      emailRequired: "Gültige E-Mail erforderlich",
      messageRequired: "Nachricht erforderlich",
    });
    const translatedNewsletterSchema = createNewsletterSchema({
      emailRequired: "Gültige E-Mail erforderlich",
    });

    const contactResult = translatedContactSchema.safeParse({ name: "", email: "bad", message: "" });
    const newsletterResult = translatedNewsletterSchema.safeParse({ email: "bad" });

    expect(contactResult.success).toBe(false);
    expect(contactResult.error?.issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        "Name erforderlich",
        "Gültige E-Mail erforderlich",
        "Nachricht erforderlich",
      ])
    );
    expect(newsletterResult.success).toBe(false);
    expect(newsletterResult.error?.issues[0]?.message).toBe("Gültige E-Mail erforderlich");
  });
});
