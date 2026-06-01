import { describe, expect, it } from "vitest";

import { contactMessageSchema, newsletterSchema } from "./contact";

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
});
