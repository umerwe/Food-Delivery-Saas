import { describe, expect, it } from "vitest";

import { getItemQuantityLimits, getProductDetailsQuantityLimits, normalizeArray, normalizeApiList, getSplitPizzaSelectedSectionId } from "./product-normalizers";

describe("product normalizers", () => {
  it("normalizes arrays and API list shapes", () => {
    expect(normalizeArray([1, 2])).toEqual([1, 2]);
    expect(normalizeArray(null)).toEqual([]);
    expect(normalizeApiList({ data: { items: [{ id: "1" }] } })).toEqual([{ id: "1" }]);
  });

  it("normalizes quantity limits", () => {
    expect(getItemQuantityLimits({ minQuantity: 0, maxQuantity: 0 })).toEqual({ minQuantity: 1, maxQuantity: 99 });
    expect(getItemQuantityLimits({ minQuantity: 2, maxQuantity: 5 })).toEqual({ minQuantity: 2, maxQuantity: 5 });
  });

  it("normalizes product details quantity limits without changing unlimited max behavior", () => {
    expect(getProductDetailsQuantityLimits({ minQuantity: 0, maxQuantity: 0 })).toEqual({ minQuantity: 1, maxQuantity: undefined });
    expect(getProductDetailsQuantityLimits({ minQuantity: 2, maxQuantity: 5 })).toEqual({ minQuantity: 2, maxQuantity: 5 });
  });

  it("normalizes split pizza selected section ids", () => {
    expect(getSplitPizzaSelectedSectionId(123)).toBe("123");
    expect(getSplitPizzaSelectedSectionId(" left ")).toBe("left");
    expect(getSplitPizzaSelectedSectionId(null)).toBe("");
  });
});
