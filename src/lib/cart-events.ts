"use client";

export const CART_CHANGED_EVENT = "deliveryway:cart-changed";

export const dispatchCartChanged = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};
