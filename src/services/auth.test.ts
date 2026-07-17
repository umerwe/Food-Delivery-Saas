import { afterEach, describe, expect, it, vi } from "vitest";

import { googleLoginCustomer } from "./auth";

const authResponse = {
  success: true,
  data: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    user: {
      id: "customer-1",
      email: "customer@example.com",
      role: "CUSTOMER",
      tenantId: "tenant-1",
      restaurantId: "restaurant-1",
    },
  },
};

describe("auth service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends Google login credentials to the customer auth endpoint", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(authResponse), { status: 200 }));

    const session = await googleLoginCustomer({
      idToken: "google-id-token",
      restaurantId: "restaurant-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://deliveryway.dcodax.co/api/v1/auth/google-login",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Accept-Language": "en",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: "google-id-token",
          restaurantId: "restaurant-1",
        }),
      })
    );
    expect(session.accessToken).toBe("access-token");
  });
});
