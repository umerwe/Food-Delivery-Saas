import { describe, expect, it } from "vitest";

import { parseReverseGeocodeAddress } from "@/services/geocoding";

describe("parseReverseGeocodeAddress", () => {
  it("keeps house number separate from street for current location results", () => {
    expect(
      parseReverseGeocodeAddress(
        {
          house_number: "12",
          road: "Main Street",
          suburb: "Model Town",
          city: "Lahore",
          state: "Punjab",
          postcode: "54000",
          country: "Pakistan",
        },
        "12 Main Street, Model Town, Lahore"
      )
    ).toEqual({
      street: "Main Street",
      houseNumber: "12",
      area: "Model Town",
      city: "Lahore",
      state: "Punjab",
      postalCode: "54000",
      country: "Pakistan",
    });
  });

  it("does not use full display name when structured address fields exist", () => {
    const parsed = parseReverseGeocodeAddress(
      {
        house_number: "221B",
        road: "Baker Street",
        city: "London",
      },
      "221B Baker Street, London"
    );

    expect(parsed.street).toBe("Baker Street");
    expect(parsed.houseNumber).toBe("221B");
  });
});
