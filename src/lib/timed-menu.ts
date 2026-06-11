const SELECTED_RESTAURANT_MENU_ID_KEY = "deliveryway-selected-restaurant-menu-id";

export const getStoredRestaurantMenuId = () => {
  if (typeof window === "undefined") return "";

  return window.localStorage.getItem(SELECTED_RESTAURANT_MENU_ID_KEY) || "";
};

export const setStoredRestaurantMenuId = (restaurantMenuId: string | number | null | undefined) => {
  if (typeof window === "undefined") return;

  const normalizedMenuId = String(restaurantMenuId ?? "").trim();

  if (!normalizedMenuId) {
    window.localStorage.removeItem(SELECTED_RESTAURANT_MENU_ID_KEY);
    return;
  }

  window.localStorage.setItem(SELECTED_RESTAURANT_MENU_ID_KEY, normalizedMenuId);
};

export const clearStoredRestaurantMenuId = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(SELECTED_RESTAURANT_MENU_ID_KEY);
};
