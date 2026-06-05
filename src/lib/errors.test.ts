import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "./errors";

describe("getApiErrorMessage", () => {
  it("uses the API response message before nested error objects", () => {
    expect(
      getApiErrorMessage({
        success: false,
        message: "Table reservations are not enabled for this branch",
        error: {
          code: "Bad Request",
          message: "Nested error message",
        },
      })
    ).toBe("Table reservations are not enabled for this branch");
  });

  it("uses nested API error messages when no top-level message is available", () => {
    expect(
      getApiErrorMessage({
        success: false,
        error: {
          code: "Bad Request",
          message: "Table reservations are not enabled for this branch",
        },
      })
    ).toBe("Table reservations are not enabled for this branch");
  });

  it("uses backend response data message before generic Error messages", () => {
    const error = Object.assign(new Error("Request failed with status code 400"), {
      response: {
        data: {
          message: "Buyer cannot redeem their own purchased gift card",
        },
      },
    });

    expect(getApiErrorMessage(error)).toBe(
      "Buyer cannot redeem their own purchased gift card"
    );
  });
});
