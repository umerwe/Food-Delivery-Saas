import { describe, expect, it } from "vitest";

import {
  getOrderProgressStep,
  getOrderProgressStepKeys,
} from "@/components/pages/Order/order-status-progress";

describe("order status progress", () => {
  it("maps delivery out for delivery to the fourth achieved step", () => {
    expect(getOrderProgressStep("OUT_FOR_DELIVERY", "DELIVERY")).toBe(4);
    expect(getOrderProgressStepKeys("DELIVERY")).toEqual([
      "placed",
      "confirmed",
      "preparing",
      "outForDelivery",
      "delivered",
    ]);
  });

  it("keeps pickup and takeaway progress separate from delivery", () => {
    expect(getOrderProgressStep("READY_FOR_PICKUP", "TAKEAWAY")).toBe(4);
    expect(getOrderProgressStep("PICKED_UP", "TAKEAWAY")).toBe(5);
    expect(getOrderProgressStepKeys("TAKEAWAY")).toEqual([
      "placed",
      "confirmed",
      "preparing",
      "readyForPickup",
      "pickedUp",
    ]);
  });

  it("handles delivered/completed terminal statuses", () => {
    expect(getOrderProgressStep("DELIVERED", "DELIVERY")).toBe(5);
    expect(getOrderProgressStep("COMPLETED", "PICKUP")).toBe(5);
  });
});
