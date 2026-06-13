import { safeGetLocalStorageItem, safeSetLocalStorageItem } from "@/lib/browser-storage";
import type { BranchOrderType } from "@/types/branches";

const CHECKOUT_TYPE_PREFERENCE_KEY = "deliveryway.checkoutType";

export type CheckoutTypePreference = "delivery" | "pickup";

export const orderTypeToCheckoutType = (
  orderType?: BranchOrderType | null
): CheckoutTypePreference | null => {
  if (orderType === "TAKEAWAY") return "pickup";
  if (orderType === "DELIVERY") return "delivery";
  return null;
};

export const checkoutTypeToOrderType = (
  checkoutType: CheckoutTypePreference
): BranchOrderType => (checkoutType === "pickup" ? "TAKEAWAY" : "DELIVERY");

export const getStoredCheckoutTypePreference = (): CheckoutTypePreference | null => {
  const stored = safeGetLocalStorageItem(CHECKOUT_TYPE_PREFERENCE_KEY);

  return stored === "delivery" || stored === "pickup" ? stored : null;
};

export const setStoredCheckoutTypePreference = (
  checkoutType: CheckoutTypePreference
) => {
  safeSetLocalStorageItem(CHECKOUT_TYPE_PREFERENCE_KEY, checkoutType);
};
