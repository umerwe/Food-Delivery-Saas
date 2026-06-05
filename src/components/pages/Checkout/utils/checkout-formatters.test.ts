import { describe, expect, it } from "vitest";

import {
  getDisplayTotalAmount,
  getServiceChargeLabel,
  getTipAdjustedDisplayTotalAmount,
  shouldShowPositiveAmountLine,
} from "./checkout-formatters";

describe("checkout formatters", () => {
  it("formats service charge label with percentage", () => {
    expect(
      getServiceChargeLabel({
        serviceChargeType: "PERCENTAGE",
        serviceChargeValue: 10,
        serviceChargeLabel: "Service Charge",
        serviceChargeWithPercentageLabel: (value) => `Service Charge (${value}%)`,
      })
    ).toBe("Service Charge (10%)");
  });

  it("formats service charge label with amount type", () => {
    expect(
      getServiceChargeLabel({
        serviceChargeType: "AMOUNT",
        serviceChargeValue: 10,
        serviceChargeLabel: "Service Charge",
        serviceChargeWithPercentageLabel: (value) => `Service Charge (${value}%)`,
      })
    ).toBe("Service Charge");
  });

  it("prefers payableAmount over totalAmount", () => {
    expect(getDisplayTotalAmount({ totalAmount: 1200, payableAmount: 900 })).toBe(900);
  });

  it("adds tip to display total only when quoted total is still pre-tip", () => {
    expect(
      getTipAdjustedDisplayTotalAmount({
        displayTotal: 1000,
        tipAmount: 150,
        totalWithoutTip: 1000,
      })
    ).toBe(1150);

    expect(
      getTipAdjustedDisplayTotalAmount({
        displayTotal: 1150,
        tipAmount: 150,
        totalWithoutTip: 1000,
      })
    ).toBe(1150);
  });

  it("hides zero amount lines", () => {
    expect(shouldShowPositiveAmountLine(0)).toBe(false);
    expect(shouldShowPositiveAmountLine(1)).toBe(true);
  });
});
