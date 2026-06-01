import { describe, expect, it } from "vitest";

import { checkoutAddressSchema, checkoutCustomerSchema, checkoutNotesSchema } from "./checkout";

describe("checkout validation", () => {
  it("validates checkout address requirements", () => {
    expect(checkoutAddressSchema.safeParse({ street: "", city: "", state: "", country: "", area: "", lat: "", lng: "" }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ street: "A", city: "B", state: "", country: "C", area: "", lat: "", lng: "" }).success).toBe(true);
  });

  it("validates customer and notes shapes", () => {
    expect(checkoutCustomerSchema.safeParse({ name: "A", phone: "1", email: "" }).success).toBe(true);
    expect(checkoutNotesSchema.parse({ note: "Leave at door" })).toEqual({ note: "Leave at door" });
  });
});
