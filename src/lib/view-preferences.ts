import { safeGetLocalStorageItem, safeSetLocalStorageItem } from "@/lib/browser-storage";

const MENU_VIEW_MODE_KEY = "menuViewMode";
const SIGNATURE_MENU_VIEW_MODE_KEY = "signatureMenuViewMode";

export type MenuViewMode = "multiple" | "onePage";
export type SignatureMenuViewMode = "multiple" | "onePage";

export const getItemsMenuViewMode = (): MenuViewMode => {
  const stored = safeGetLocalStorageItem(MENU_VIEW_MODE_KEY);

  return stored === "onePage" || stored === "multiple" ? stored : "multiple";
};

export const setItemsMenuViewMode = (viewMode: MenuViewMode) => {
  safeSetLocalStorageItem(MENU_VIEW_MODE_KEY, viewMode);
};

export const getSignatureMenuViewMode = (): SignatureMenuViewMode => {
  const stored = safeGetLocalStorageItem(SIGNATURE_MENU_VIEW_MODE_KEY);

  return stored === "onePage" || stored === "multiple" ? stored : "multiple";
};

export const setSignatureMenuViewMode = (viewMode: SignatureMenuViewMode) => {
  safeSetLocalStorageItem(SIGNATURE_MENU_VIEW_MODE_KEY, viewMode);
};
