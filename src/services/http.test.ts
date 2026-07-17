import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { request } from "./http";

vi.mock("@/lib/axios", () => ({
  httpClient: {
    request: vi.fn(),
  },
  normalizeApiEndpoint: (endpoint: string) => endpoint,
}));

const { httpClient } = await import("@/lib/axios");
const requestMock = vi.mocked(httpClient.request);

describe("http service", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("preserves backend error response bodies from Axios failures", async () => {
    requestMock.mockRejectedValue(
      new axios.AxiosError(
        "Request failed with status code 400",
        "ERR_BAD_REQUEST",
        undefined,
        undefined,
        {
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {
            headers: new axios.AxiosHeaders(),
          },
          data: {
            success: false,
            message: "deliveryAddressId is required for delivery orders",
            error: {
              code: "Bad Request",
              message: "deliveryAddressId is required for delivery orders",
            },
          },
        }
      )
    );

    await expect(request("GET", "/v1/cart")).resolves.toMatchObject({
      success: false,
      message: "deliveryAddressId is required for delivery orders",
      error: {
        code: "Bad Request",
        message: "deliveryAddressId is required for delivery orders",
      },
      status: 400,
    });
  });

});
