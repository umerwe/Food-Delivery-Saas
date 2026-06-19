import { describe, expect, it } from "vitest";

import { formatDisplayAddress } from "@/lib/address-display";

describe("formatDisplayAddress", () => {
  it("uses street, house or shop number, postal code, and city", () => {
    expect(
      formatDisplayAddress({
        street: "Main Road",
        houseNumber: "40",
        postalCode: "45475",
        city: "Essen",
        state: "NRW",
        country: "Germany",
      })
    ).toBe("Main Road, 40, 45475, Essen");
  });

  it("removes the comma between a dotted street and house number", () => {
    expect(
      formatDisplayAddress(
        {
          street: "Teststr.",
          houseNumber: "40",
          postalCode: "45475",
          city: "Essen",
          state: "NRW",
          country: "Germany",
        },
        { includeRegionCountry: true }
      )
    ).toBe("Teststr. 40, 45475, Essen, NRW, Germany");
  });
});
