export {
  getBrowserStorage,
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem,
} from "@/lib/browser-storage";
export { getAuthToken, getStoredAuthState, getStoredRestaurantId } from "@/lib/auth";
export {
  getStoredGroupOrderCode,
  setStoredGroupOrderCode,
  clearStoredGroupOrderCode,
} from "@/lib/group-order";
export {
  checkoutTypeToOrderType,
  getStoredCheckoutTypePreference,
  orderTypeToCheckoutType,
  setStoredCheckoutTypePreference,
} from "@/lib/checkout-type-preference";
export type { CheckoutTypePreference } from "@/lib/checkout-type-preference";
export {
  getItemsMenuViewMode,
  setItemsMenuViewMode,
  getSignatureMenuViewMode,
  setSignatureMenuViewMode,
} from "@/lib/view-preferences";
export type { MenuViewMode, SignatureMenuViewMode } from "@/lib/view-preferences";
