import { describe, expect, it } from "vitest";

import {
  checkoutAddressSchema,
  checkoutCustomerSchema,
  checkoutNotesSchema,
  createCheckoutAddressSchema,
} from "./checkout";

describe("checkout validation", () => {
  it("validates checkout address requirements", () => {
    expect(checkoutAddressSchema.safeParse({ street: "", city: "", state: "", country: "", area: "", lat: "", lng: "" }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ street: "A", city: "B", state: "", country: "C", area: "", lat: "", lng: "" }).success).toBe(true);
  });

  it("validates customer and notes shapes", () => {
    expect(checkoutCustomerSchema.safeParse({ name: "A", phone: "1", email: "" }).success).toBe(true);
    expect(checkoutNotesSchema.parse({ note: "Leave at door" })).toEqual({ note: "Leave at door" });
  });

  it("uses translated checkout address messages from schema factories", () => {
    const schema = createCheckoutAddressSchema({
      streetRequired: "Street translated",
      cityRequired: "City translated",
      countryRequired: "Country translated",
    });

    const result = schema.safeParse({ street: "", city: "", state: "", country: "", area: "", lat: "", lng: "" });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.street).toContain("Street translated");
      expect(result.error.flatten().fieldErrors.city).toContain("City translated");
      expect(result.error.flatten().fieldErrors.country).toContain("Country translated");
    }
  });
});
