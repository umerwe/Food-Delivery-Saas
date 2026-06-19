import { describe, expect, it } from "vitest";

import { fetchAddresses } from "./profile";

describe("profile service", () => {
  it("keeps saved address coordinates and house number for edit forms", async () => {
    const addresses = await fetchAddresses({
      get: async () => ({
        data: [
          {
            id: "address-1",
            street: "Main Street",
            houseNumber: "12A",
            area: null,
            postalCode: "54000",
            city: "Lahore",
            state: "Punjab",
            country: "Pakistan",
            lat: 31.5204,
            lng: "74.3587",
            isDefault: true,
          },
        ],
      }),
    });

    expect(addresses).toEqual([
      {
        id: "address-1",
        street: "Main Street",
        houseNumber: "12A",
        area: "12A",
        postalCode: "54000",
        city: "Lahore",
        state: "Punjab",
        country: "Pakistan",
        lat: "31.5204",
        lng: "74.3587",
        isDefault: true,
      },
    ]);
  });
});
