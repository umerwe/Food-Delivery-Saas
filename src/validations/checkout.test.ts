import { describe, expect, it } from "vitest";

import {
  checkoutAddressSchema,
  checkoutCustomerSchema,
  checkoutTipSchema,
  checkoutNotesSchema,
  createCheckoutAddressSchema,
  normalizeCheckoutTipAmount,
} from "./checkout";

const validAddress = {
  street: "A",
  houseNumber: "12",
  postalCode: "12345",
  city: "B",
  state: "S",
  country: "C",
  area: "",
  lat: "31.5204",
  lng: "74.3587",
  isDefault: false,
};

describe("checkout validation", () => {
  it("validates checkout address requirements", () => {
    expect(checkoutAddressSchema.safeParse({ ...validAddress, street: "" }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ ...validAddress, isDefault: true }).success).toBe(true);
    expect(checkoutAddressSchema.safeParse({ ...validAddress, postalCode: "" }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ ...validAddress, state: "" }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ ...validAddress, lat: "" }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ ...validAddress, lng: "" }).success).toBe(false);
    expect(checkoutAddressSchema.safeParse({ ...validAddress, isDefault: undefined }).success).toBe(false);
  });

  it("validates customer and notes shapes", () => {
    expect(checkoutCustomerSchema.safeParse({ name: "A", phone: "1", email: "" }).success).toBe(true);
    expect(checkoutNotesSchema.parse({ note: "Leave at door" })).toEqual({ note: "Leave at door" });
  });

  it("allows optional non-negative tip amounts", () => {
    expect(checkoutTipSchema.safeParse({}).success).toBe(true);
    expect(checkoutTipSchema.safeParse({ tipAmount: 0 }).success).toBe(true);
    expect(checkoutTipSchema.safeParse({ tipAmount: 150 }).success).toBe(true);
  });

  it("rejects negative tip amounts", () => {
    expect(checkoutTipSchema.safeParse({ tipAmount: -1 }).success).toBe(false);
  });

  it("normalizes empty tip input safely", () => {
    expect(normalizeCheckoutTipAmount("")).toBe(0);
    expect(normalizeCheckoutTipAmount("150")).toBe(150);
    expect(normalizeCheckoutTipAmount("-1")).toBeNull();
  });

  it("uses translated checkout address messages from schema factories", () => {
    const schema = createCheckoutAddressSchema({
      streetRequired: "Street translated",
      postalCodeRequired: "Postal translated",
      cityRequired: "City translated",
      stateRequired: "State translated",
      countryRequired: "Country translated",
      latitudeRequired: "Latitude translated",
      longitudeRequired: "Longitude translated",
    });

    const result = schema.safeParse({
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      state: "",
      country: "",
      area: "",
      lat: "",
      lng: "",
      isDefault: false,
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.street).toContain("Street translated");
      expect(result.error.flatten().fieldErrors.postalCode).toContain("Postal translated");
      expect(result.error.flatten().fieldErrors.city).toContain("City translated");
      expect(result.error.flatten().fieldErrors.state).toContain("State translated");
      expect(result.error.flatten().fieldErrors.country).toContain("Country translated");
      expect(result.error.flatten().fieldErrors.lat).toContain("Latitude translated");
      expect(result.error.flatten().fieldErrors.lng).toContain("Longitude translated");
    }
  });
});
