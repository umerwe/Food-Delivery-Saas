import { describe, expect, it } from "vitest";

import {
  buildGiftCardRedeemPayload,
  giftCardRedeemSchema,
} from "./gift-cards";

describe("giftCardRedeemSchema", () => {
  it("rejects empty code", () => {
    expect(giftCardRedeemSchema.safeParse({ code: "   " }).success).toBe(false);
  });

  it("accepts lowercase code and builder uppercases it", () => {
    const result = giftCardRedeemSchema.safeParse({
      code: " gift-abcd1234 ",
      branchId: "",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(buildGiftCardRedeemPayload(result.data)).toEqual({
        code: "GIFT-ABCD1234",
      });
    }
  });

  it("keeps non-empty branch id", () => {
    expect(
      buildGiftCardRedeemPayload({
        code: "gift-abcd1234",
        branchId: " branch-1 ",
      })
    ).toEqual({
      code: "GIFT-ABCD1234",
      branchId: "branch-1",
    });
  });
});
