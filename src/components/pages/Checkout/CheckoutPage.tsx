"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Tabs from "@/components/pages/Checkout/components/Tabs";
import { DeliverySection } from "@/components/pages/Checkout/components/DeliverySection";
import { PickupSection } from "@/components/pages/Checkout/components/PickupSection";
import { CartSummarySection } from "@/components/pages/Checkout/components/CartSummarySection";
import { useRouter, useSearchParams } from "next/navigation";
import { useCheckout } from "@/hooks/useCheckout";
import { useCart } from "@/hooks/useCart";
import { useHome } from "@/hooks/useHome";
import { useLoyalty } from "@/hooks/useLoyalty";
import { toast } from "sonner";
import { useAuthContext } from "@/hooks/useAuth";
import { X } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { ApiRecord, BackendErrorState, CartItem } from "@/components/pages/Checkout/utils/checkout-normalizers";
import { asRecord, getBackendErrorCode, getBackendErrorMessage, getBackendErrorMeta, hasBackendError, normalizeCartItem, normalizeCartQuote, normalizeCartResponse, recalculateCartItemQuantity, toNumber } from "@/components/pages/Checkout/utils/checkout-normalizers";
import type { BranchRecord } from "@/types/branch-selector";
import { useTranslations } from "next-intl";
import { normalizeCheckoutTipAmount, type CheckoutAddressValues } from "@/validations/checkout";
import { branchSupportsDelivery, branchSupportsPickup, getSelectedOrderType, normalizeBranch } from "@/lib/branch-selector";
import {
  getStoredCheckoutTypePreference,
  setStoredCheckoutTypePreference,
  type CheckoutTypePreference,
} from "@/lib/checkout-type-preference";
import { dispatchCartChanged } from "@/lib/cart-events";
import {
  addPreparationMinutesToScheduledDelivery,
  buildDeliveryTimeSlots,
  getBranchScheduleForDate,
  getScheduledDateTime,
  getDateValue,
  isPastDateValue,
} from "@/components/pages/Checkout/utils/pickup-schedule";
import type { LoyaltySummary } from "@/services/loyalty";

const emptyGuestDeliveryAddress: CheckoutAddressValues = {
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  state: "",
  country: "",
  area: "",
  lat: "",
  lng: "",
  isDefault: false,
};

type GuestPrivacyPolicy = {
  title: string;
  content: string;
  policyLink: string;
};

const getCheckoutOrderType = (checkoutType: string) =>
  checkoutType === "pickup" ? "TAKEAWAY" : "DELIVERY";

const isMeaningfulCartText = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" && value.trim() !== "Untitled Item";

const hasVariationDetails = (value: unknown) => {
  const variation = asRecord(value);

  return Boolean(
    isMeaningfulCartText(variation.displayText) ||
      isMeaningfulCartText(variation.name) ||
      variation.id
  );
};

const hasModifierDetails = (value: unknown) => {
  const modifier = asRecord(value);

  return Boolean(
    isMeaningfulCartText(modifier.name) &&
      String(modifier.name).trim() !== "Add-on"
  );
};

const hasDisplayableModifierDetails = (items: CartItem["selectedModifiers"]) =>
  items.some(hasModifierDetails);

const getMergedCartMenuItem = (
  currentItem: CartItem,
  incomingItem: CartItem
) => {
  const incomingMenuItem = asRecord(incomingItem.menuItem);
  const currentMenuItem = asRecord(currentItem.menuItem);
  const mergedMenuItem = {
    ...currentMenuItem,
    ...incomingMenuItem,
  };

  return {
    ...mergedMenuItem,
    name: isMeaningfulCartText(incomingMenuItem.name)
      ? incomingMenuItem.name
      : currentMenuItem.name,
    slug: isMeaningfulCartText(incomingMenuItem.slug)
      ? incomingMenuItem.slug
      : currentMenuItem.slug,
    description: isMeaningfulCartText(incomingMenuItem.description)
      ? incomingMenuItem.description
      : currentMenuItem.description,
    imageUrl: isMeaningfulCartText(incomingMenuItem.imageUrl)
      ? incomingMenuItem.imageUrl
      : currentMenuItem.imageUrl,
    selectedVariation: hasVariationDetails(incomingMenuItem.selectedVariation)
      ? incomingMenuItem.selectedVariation
      : currentMenuItem.selectedVariation,
  };
};

const mergeCartItemsWithExistingDetails = (
  currentItems: CartItem[],
  incomingItems: CartItem[]
) => {
  if (!currentItems.length || !incomingItems.length) return incomingItems;

  const currentById = new Map(
    currentItems
      .filter((item) => item.id !== undefined && item.id !== null)
      .map((item) => [String(item.id), item])
  );

  return incomingItems.map((incomingItem) => {
    const currentItem = incomingItem.id !== undefined && incomingItem.id !== null
      ? currentById.get(String(incomingItem.id))
      : undefined;

    if (!currentItem) return incomingItem;

    const hasIncomingModifiers =
      incomingItem.selectedModifiers.length > 0 &&
      (
        !currentItem.selectedModifiers.length ||
        hasDisplayableModifierDetails(incomingItem.selectedModifiers)
      );
    const hasIncomingSections = incomingItem.selectedSections.length > 0;
    const hasIncomingIncludedItems = Boolean(incomingItem.includedItems?.length);
    const mergedMenuItem = getMergedCartMenuItem(currentItem, incomingItem);

    return {
      ...currentItem,
      ...incomingItem,
      name: isMeaningfulCartText(incomingItem.name) ? incomingItem.name : currentItem.name,
      desc: isMeaningfulCartText(incomingItem.desc) ? incomingItem.desc : currentItem.desc,
      img: isMeaningfulCartText(incomingItem.img) ? incomingItem.img : currentItem.img,
      slug: isMeaningfulCartText(incomingItem.slug) ? incomingItem.slug : currentItem.slug,
      selectedVariationName: isMeaningfulCartText(incomingItem.selectedVariationName)
        ? incomingItem.selectedVariationName
        : currentItem.selectedVariationName,
      selectedVariation: hasVariationDetails(incomingItem.selectedVariation)
        ? incomingItem.selectedVariation
        : currentItem.selectedVariation,
      variationId: incomingItem.variationId ?? currentItem.variationId,
      selectedModifiers: hasIncomingModifiers
        ? incomingItem.selectedModifiers
        : currentItem.selectedModifiers,
      selectedSections: hasIncomingSections
        ? incomingItem.selectedSections
        : currentItem.selectedSections,
      sections: hasIncomingSections ? incomingItem.sections : currentItem.sections,
      includedItems: hasIncomingIncludedItems ? incomingItem.includedItems : currentItem.includedItems,
      menuItem: Object.keys(mergedMenuItem).length ? mergedMenuItem : incomingItem.menuItem,
    };
  });
};

const isGuestUser = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.isGuest === true || String(user?.role || "").toUpperCase() === "GUEST";

const getCheckoutRestaurantId = (user: ReturnType<typeof useAuthContext>["user"]) =>
  user?.restaurantId || user?.branch?.restaurantId || user?.tenantId || "";

const normalizeGuestPrivacyPolicy = (value: unknown, restaurantId: string): GuestPrivacyPolicy => {
  const record = asRecord(value);
  const title = typeof record.title === "string" && record.title.trim()
    ? record.title.trim()
    : "Privacy Policy";
  const content = typeof record.content === "string" ? record.content.trim() : "";
  const policyLink = typeof record.policyLink === "string" && record.policyLink.trim()
    ? record.policyLink.trim()
    : `/api/v1/public-content/privacy-policy?restaurantId=${encodeURIComponent(restaurantId)}`;

  return {
    title,
    content,
    policyLink,
  };
};

const trimAddress = (address: CheckoutAddressValues) => ({
  street: address.street.trim(),
  houseNumber: address.houseNumber.trim(),
  area: address.area.trim(),
  postalCode: address.postalCode.trim(),
  city: address.city.trim(),
  state: address.state.trim(),
  country: address.country.trim(),
  lat: address.lat.trim(),
  lng: address.lng.trim(),
});

const getGuestDeliveryAddressPayload = (address: CheckoutAddressValues) => {
  const trimmed = trimAddress(address);

  return {
    street: trimmed.street,
    houseNumber: trimmed.houseNumber,
    area: trimmed.houseNumber || trimmed.area,
    postalCode: trimmed.postalCode,
    city: trimmed.city,
    state: trimmed.state,
    country: trimmed.country,
    lat: trimmed.lat,
    lng: trimmed.lng,
  };
};

const hasGuestDeliveryAddress = (address: CheckoutAddressValues) => {
  const trimmed = trimAddress(address);

  return Boolean(trimmed.street && trimmed.postalCode && trimmed.city && trimmed.country);
};

const getGuestContactPayload = (
  customer: { name: string; phone: string; email: string },
  privacyPolicyAccepted: boolean
) => {
  return {
    email: customer.email.trim(),
    phone: customer.phone.trim(),
    privacyPolicyAccepted,
  };
};

const hasGuestContact = (customer: { name: string; phone: string; email: string }) => {
  return Boolean(customer.email.trim() && customer.phone.trim());
};

const getCartPreparationMinutes = (items: CartItem[]) =>
  items.reduce((total, item) => total + Math.max(0, Math.floor(toNumber(item.prepTimeMinutes, 0))), 0);

const getCheckoutQuoteSignature = ({
  activeTab,
  customerId,
  guestDeliveryAddress,
  isGuest,
  selectedAddress,
}: {
  activeTab: string;
  customerId: string;
  guestDeliveryAddress: CheckoutAddressValues;
  isGuest: boolean;
  selectedAddress: string | null;
}) => {
  const address = isGuest
    ? trimAddress(guestDeliveryAddress)
    : { selectedAddress: selectedAddress ?? "" };

  return JSON.stringify({
    activeTab,
    customerId,
    isGuest,
    address,
  });
};

function CheckoutPageContent() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const { user, token } = useAuthContext();
  const [storedCheckoutType, setStoredCheckoutType] =
    useState<CheckoutTypePreference | null>(null);
  const [hasLoadedCheckoutTypePreference, setHasLoadedCheckoutTypePreference] =
    useState(false);
  const userCheckoutType = getSelectedOrderType(user) === "TAKEAWAY" ? "pickup" : "delivery";
  const preferredCheckoutType = storedCheckoutType ?? userCheckoutType;
  const activeTab = type === "pickup" || type === "delivery" ? type : preferredCheckoutType;
  const isGuest = isGuestUser(user);
  const restaurantId = getCheckoutRestaurantId(user);

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [removingCoupon, setRemovingCoupon] = useState(false);
  const [applyingTip, setApplyingTip] = useState(false);

  const { get, patch, del, post, checkoutCustomerCart } = useCheckout(token);
  const { updateCustomerCart, updateCustomerCartOrderType, quoteCustomerCart } = useCart(token);
  const { fetchLoyalty } = useLoyalty(token);
  const checkoutBranchId = user?.branchId || user?.branch?.id || null;
  const homeQuery = useHome(
    restaurantId,
    checkoutBranchId,
    Boolean(restaurantId && checkoutBranchId)
  );
  const homeBranch = useMemo(
    () => normalizeBranch(homeQuery.data?.data.branch),
    [homeQuery.data?.data.branch]
  );

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartQuote, setCartQuote] = useState<ApiRecord | null>(null);
  const [appliedTipAmount, setAppliedTipAmount] = useState(0);
  const [loadingCart, setLoadingCart] = useState(true);
  const [backendError, setBackendError] = useState<BackendErrorState | null>(
    null
  );
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState("");
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const loadedCartCustomerIdRef = useRef<string | null>(null);
  const lastQuoteSignatureRef = useRef("");
  const totalPreparationMinutes = useMemo(
    () => getCartPreparationMinutes(cartItems),
    [cartItems]
  );

  const router = useRouter();
  const customerId = user?.id;

  const reportBackendError = (context: string, res: unknown, fallback: string) => {
    const meta = getBackendErrorMeta(res);
    const message = getBackendErrorMessage(res, fallback);

    setBackendError({
      context,
      message,
      code: getBackendErrorCode(res),
      timestamp: typeof meta?.timestamp === "string" ? meta.timestamp : undefined,
    });

    toast.error(message);
  };

  useEffect(() => {
    setStoredCheckoutType(getStoredCheckoutTypePreference());
    setHasLoadedCheckoutTypePreference(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedCheckoutTypePreference) return;

    setStoredCheckoutTypePreference(activeTab);
    setStoredCheckoutType(activeTab);
  }, [activeTab, hasLoadedCheckoutTypePreference]);

  const clearBackendError = () => {
    setBackendError(null);
  };

  const syncCartFromResponse = (res: unknown) => {
    const { items, quote } = normalizeCartResponse(res);

    if (items.length) {
      const nextItems = items.map((item) => normalizeCartItem(item));
      setCartItems((currentItems) =>
        mergeCartItemsWithExistingDetails(currentItems, nextItems)
      );
    }

    if (!quote) {
      return false;
    }

    setCartQuote(quote);
    setAppliedTipAmount((previousTipAmount) =>
      Math.max(0, toNumber(quote.tipAmount, previousTipAmount))
    );
    setCouponCode(
      typeof quote.couponCode === "string" && quote.couponCode.trim()
        ? quote.couponCode.trim()
        : ""
    );
    setCouponDiscount(Math.max(0, toNumber(quote.discountAmount, 0)));

    return true;
  };

  const applyTipToCurrentQuote = (tipAmount: number) => {
    setCartQuote((currentQuote) => {
      if (!currentQuote) return currentQuote;

      return {
        ...currentQuote,
        tipAmount,
      };
    });
  };

  const [stripePayment, setStripePayment] = useState<{ open: boolean; clientSecret: string; publishableKey: string; paymentId: string; orderId: string | number }>({
    open: false,
    clientSecret: "",
    publishableKey: "",
    paymentId: "",
    orderId: "",
  });

  const stripePromise = useMemo(() => {
    if (!stripePayment.publishableKey) return null;
    return loadStripe(stripePayment.publishableKey);
  }, [stripePayment.publishableKey]);

  const resetStripePayment = () => {
    setStripePayment({
      open: false,
      clientSecret: "",
      publishableKey: "",
      paymentId: "",
      orderId: "",
    });
  };

  const handleCloseStripePayment = async () => {
    const pendingOrderId = stripePayment.orderId;

    resetStripePayment();

    if (pendingOrderId) {
      toast.success(t("toast.orderPlaced"));
      await clearCart();
      router.push(`/order?orderId=${pendingOrderId}`);
    }
  };

  const fetchCart = async () => {
    if (!customerId) return;

    try {
      setLoadingCart(true);

      const res = await get(`/v1/cart?customerId=${customerId}`);

      if (hasBackendError(res)) {
        setCartItems([]);
        setCartQuote(null);
        reportBackendError(
          t("toast.failedFetchCart"),
          res,
          t("toast.failedFetchCart")
        );
        return;
      }

      const { items, quote } = normalizeCartResponse(res);
      const formatted = items.map((item) => normalizeCartItem(item));

      setCartItems(formatted);
      setCartQuote(quote);
      setCouponCode(
        typeof quote?.couponCode === "string" && quote.couponCode.trim()
          ? quote.couponCode.trim()
          : ""
      );
      setCouponDiscount(Math.max(0, toNumber(quote?.discountAmount, 0)));
      setAppliedTipAmount((previousTipAmount) =>
        quote ? Math.max(0, toNumber(quote.tipAmount, 0)) : previousTipAmount
      );
      clearBackendError();
    } catch (err) {
      reportBackendError(
        t("toast.failedFetchCart"),
        err,
        err instanceof Error ? err.message : t("toast.failedFetchCart")
      );
    } finally {
      setLoadingCart(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      if (loadedCartCustomerIdRef.current === customerId) return;
      loadedCartCustomerIdRef.current = customerId;
      fetchCart();
    } else {
      loadedCartCustomerIdRef.current = null;
      lastQuoteSignatureRef.current = "";
      setCartItems([]);
      setCartQuote(null);
      setAppliedTipAmount(0);
      setCouponCode("");
      setCouponDiscount(0);
      setLoadingCart(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId || isGuest || !token) {
      setLoyalty(null);
      setLoyaltyPoints("");
      setLoadingLoyalty(false);
      return;
    }

    let isMounted = true;

    const loadLoyalty = async () => {
      try {
        setLoadingLoyalty(true);
        const { loyalty: nextLoyalty } = await fetchLoyalty();

        if (!isMounted) return;

        setLoyalty(nextLoyalty);
      } catch {
        if (!isMounted) return;
        setLoyalty(null);
      } finally {
        if (isMounted) {
          setLoadingLoyalty(false);
        }
      }
    };

    void loadLoyalty();

    return () => {
      isMounted = false;
    };
  }, [customerId, fetchLoyalty, isGuest, token]);

  const [selectedAddress, setSelectedAddress] = useState<string | null>("");
  const [guestDeliveryAddress, setGuestDeliveryAddress] =
    useState<CheckoutAddressValues>(emptyGuestDeliveryAddress);
  const [note, setNote] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [guestPrivacyPolicy, setGuestPrivacyPolicy] =
    useState<GuestPrivacyPolicy | null>(null);
  const [privacyPolicyLoading, setPrivacyPolicyLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("STRIPE");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [checkoutBranch, setCheckoutBranch] = useState<BranchRecord | null>(null);
  const [scheduledDeliveryValue, setScheduledDeliveryValue] = useState("");
  const checkoutPaymentMethod =
    activeTab === "delivery" && paymentMethod === "COD" ? "STRIPE" : paymentMethod;
  const deliveryAllowed = !checkoutBranch?.settings?.allowedOrderTypes?.length || branchSupportsDelivery(checkoutBranch);
  const pickupAllowed = !checkoutBranch?.settings?.allowedOrderTypes?.length || branchSupportsPickup(checkoutBranch);

  useEffect(() => {
    if (!user) return;

    setCustomer((prev) => ({
      ...prev,
      name: `${user.profile?.firstName || ""} ${
        user.profile?.lastName || ""
      }`.trim(),
      phone: user.profile?.phone || "",
      email: user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!isGuest) {
      setGuestPrivacyPolicy(null);
      setPrivacyPolicyAccepted(false);
      return;
    }

    if (!restaurantId) return;

    let isMounted = true;

    const loadGuestPrivacyPolicy = async () => {
      try {
        setPrivacyPolicyLoading(true);

        const res = await get(
          `/v1/public-content/privacy-policy?restaurantId=${encodeURIComponent(restaurantId)}`
        );

        if (!isMounted) return;

        if (hasBackendError(res)) {
          setGuestPrivacyPolicy(
            normalizeGuestPrivacyPolicy(undefined, restaurantId)
          );
          return;
        }

        setGuestPrivacyPolicy(normalizeGuestPrivacyPolicy(res?.data, restaurantId));
      } catch (error) {
        if (!isMounted) return;
        setGuestPrivacyPolicy(normalizeGuestPrivacyPolicy(undefined, restaurantId));
      } finally {
        if (isMounted) {
          setPrivacyPolicyLoading(false);
        }
      }
    };

    void loadGuestPrivacyPolicy();

    return () => {
      isMounted = false;
    };
  }, [get, isGuest, restaurantId]);

  useEffect(() => {
    if (!customerId || loadingCart) return;

    const quoteSignature = getCheckoutQuoteSignature({
      activeTab,
      customerId,
      guestDeliveryAddress,
      isGuest,
      selectedAddress,
    });

    if (lastQuoteSignatureRef.current === quoteSignature) return;

    const quoteTimer = window.setTimeout(async () => {
      lastQuoteSignatureRef.current = quoteSignature;

      const orderType = getCheckoutOrderType(activeTab);
      const orderTypeRes = await updateCustomerCartOrderType({
        customerId,
        orderType,
      });

      if (hasBackendError(orderTypeRes)) {
        lastQuoteSignatureRef.current = "";
        reportBackendError(
          t("toast.quoteFailed"),
          orderTypeRes,
          t("toast.quoteFailed")
        );
        return;
      }

      syncCartFromResponse(orderTypeRes);

      const payload: Record<string, unknown> = {};

      if (activeTab === "delivery" && isGuest && hasGuestDeliveryAddress(guestDeliveryAddress)) {
        payload.guestDeliveryAddress = getGuestDeliveryAddressPayload(guestDeliveryAddress);
      }

      if (activeTab === "delivery" && !isGuest && selectedAddress) {
        payload.deliveryAddressId = selectedAddress;
      }

      const res = await quoteCustomerCart({
        customerId,
        payload,
      });

      if (!hasBackendError(res)) {
        if (!syncCartFromResponse(res)) {
          const quoteData = normalizeCartQuote(asRecord(res?.data));

          if (quoteData) {
            setCartQuote(quoteData);
          }
        }
      } else {
        lastQuoteSignatureRef.current = "";
      }
    }, 450);

    return () => window.clearTimeout(quoteTimer);
  }, [activeTab, customerId, guestDeliveryAddress, isGuest, loadingCart, quoteCustomerCart, selectedAddress, updateCustomerCartOrderType]);

  useEffect(() => {
    if (!checkoutBranchId) {
      setCheckoutBranch(null);
      return;
    }

    const fallbackBranch = normalizeBranch(user?.branch);

    setCheckoutBranch(homeBranch ?? fallbackBranch);
  }, [checkoutBranchId, homeBranch, user?.branch]);

  useEffect(() => {
    if (!checkoutBranch?.settings?.allowedOrderTypes?.length) return;

    if (activeTab === "delivery" && !deliveryAllowed && pickupAllowed) {
      router.replace("/checkout?type=pickup", { scroll: false });
    }

    if (activeTab === "pickup" && !pickupAllowed && deliveryAllowed) {
      router.replace("/checkout?type=delivery", { scroll: false });
    }
  }, [activeTab, checkoutBranch, deliveryAllowed, pickupAllowed, router]);

  const updateQuantity = async (id: string, type: "inc" | "dec") => {
    const currentItem = cartItems.find((item) => String(item.id) === id);
    if (!currentItem) return;

    const currentQty = Math.max(1, toNumber(currentItem.quantity, 1));

    const newQty =
      type === "inc" ? currentQty + 1 : Math.max(1, currentQty - 1);

    if (newQty === currentQty) return;

    const previousCartItems = cartItems;

    setCartItems((prev) =>
      prev.map((item) => {
        if (String(item.id) !== id) return item;

        return recalculateCartItemQuantity(item, newQty);
      })
    );

    try {
      const isDealRow = String(currentItem.type || "").toUpperCase() === "DEAL";
      const dealId = typeof currentItem.dealId === "string" ? currentItem.dealId : "";
      const endpoint = isDealRow && dealId
        ? `/v1/cart/deals/${dealId}?customerId=${customerId}`
        : `/v1/cart/items/${id}?customerId=${customerId}`;
      const res = await patch(endpoint, {
        quantity: newQty,
      });

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        reportBackendError(
          t("toast.failedUpdateQuantity"),
          res,
          t("toast.failedUpdateQuantity")
        );
        return;
      }

      await fetchCart();
    } catch (err) {
      setCartItems(previousCartItems);
      reportBackendError(
        t("toast.failedUpdateQuantity"),
        err,
        err instanceof Error ? err.message : t("toast.failedUpdateQuantity")
      );
    }
  };

  const deleteItem = async (id: string) => {
    const previousCartItems = cartItems;
    const currentItem = cartItems.find((item) => String(item.id) === id);
    const isDealRow = String(currentItem?.type || "").toUpperCase() === "DEAL";
    const dealId = typeof currentItem?.dealId === "string" ? currentItem.dealId : "";

    try {
      setCartItems((prev) => prev.filter((item) => String(item.id) !== id));

      const endpoint = isDealRow && dealId
        ? `/v1/cart/deals/${dealId}?customerId=${customerId}`
        : `/v1/cart/items/${id}?customerId=${customerId}`;
      const res = await del(endpoint);

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        reportBackendError(
          t("toast.failedRemoveItem"),
          res,
          t("toast.failedRemoveItem")
        );
        return;
      }

      await fetchCart();
      toast.success(t("toast.itemRemoved"));
    } catch (err) {
      setCartItems(previousCartItems);
      reportBackendError(
        t("toast.failedRemoveItem"),
        err,
        err instanceof Error ? err.message : t("toast.failedRemoveItem")
      );
    }
  };

  const clearCart = async () => {
    const previousCartItems = cartItems;
    const previousCartQuote = cartQuote;
    const previousAppliedTipAmount = appliedTipAmount;
    const previousCouponCode = couponCode;
    const previousCouponDiscount = couponDiscount;

    try {
      setCartItems([]);
      setCartQuote(null);
      setAppliedTipAmount(0);
      setCouponCode("");
      setCouponDiscount(0);

      const res = await del(`/v1/cart?customerId=${customerId}`);

      if (hasBackendError(res)) {
        setCartItems(previousCartItems);
        setCartQuote(previousCartQuote);
        setAppliedTipAmount(previousAppliedTipAmount);
        setCouponCode(previousCouponCode);
        setCouponDiscount(previousCouponDiscount);
        reportBackendError(
          t("toast.failedClearCart"),
          res,
          t("toast.failedClearCart")
        );
        return false;
      }

      clearBackendError();
      dispatchCartChanged();
      return true;
    } catch (err) {
      setCartItems(previousCartItems);
      setCartQuote(previousCartQuote);
      setAppliedTipAmount(previousAppliedTipAmount);
      setCouponCode(previousCouponCode);
      setCouponDiscount(previousCouponDiscount);
      reportBackendError(
        t("toast.failedClearCart"),
        err,
        err instanceof Error ? err.message : t("toast.failedClearCart")
      );
      return false;
    }
  };

  const setCartAddress = async () => {
    if (activeTab !== "delivery") return true;
    if (isGuest) return true;

    try {
      const res = await patch(`/v1/cart/address?customerId=${customerId}`, {
        deliveryAddressId: selectedAddress,
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.failedSetAddress"),
          res,
          t("toast.failedSetAddress")
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err) {
      reportBackendError(
        t("toast.failedSetAddress"),
        err,
        err instanceof Error ? err.message : t("toast.failedSetAddress")
      );
      return false;
    }
  };

  const getOrderTime = () => {
    if (!pickupDate || !pickupTime) return undefined;

    try {
      const date = new Date(pickupDate);
      const dateValue = getDateValue(date);

      if (isPastDateValue(dateValue)) {
        return null;
      }

      if (pickupTime === "ASAP") {
        return new Date().toISOString();
      }

      const [time, modifier] = pickupTime.includes(" ")
        ? pickupTime.split(" ")
        : [pickupTime, ""];
      let [hours, minutes] = time.split(":").map(Number);

      if (modifier === "PM" && hours !== 12) {
        hours += 12;
      }

      if (modifier === "AM" && hours === 12) {
        hours = 0;
      }

      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      date.setMilliseconds(0);

      return date.toISOString();
    } catch (err) {
      return null;
    }
  };

  const getScheduledDeliveryAt = () => {
    if (activeTab === "pickup") {
      return getOrderTime();
    }

    const trimmedValue = scheduledDeliveryValue.trim();

    if (!trimmedValue) return undefined;

    const scheduledDate = getScheduledDateTime(trimmedValue);

    if (!scheduledDate) return null;

    const dateValue = getDateValue(scheduledDate);

    if (isPastDateValue(dateValue)) {
      return null;
    }

    if (checkoutBranch) {
      const timeValue = trimmedValue.split("T")[1]?.slice(0, 5) || "";
      const availableSlots = buildDeliveryTimeSlots({
        branch: checkoutBranch,
        dateValue,
      });
      const scheduleState = getBranchScheduleForDate({
        branch: checkoutBranch,
        dateValue,
        scheduleType: "delivery",
      });

      if (
        scheduleState.hasOpeningHours &&
        !availableSlots.some((slot) => slot.value === timeValue)
      ) {
        return null;
      }
    }

    const deliveryDate = addPreparationMinutesToScheduledDelivery({
      scheduledDeliveryValue: trimmedValue,
      preparationMinutes: totalPreparationMinutes,
    });

    return (deliveryDate || scheduledDate).toISOString();
  };

  const setCartSchedule = async (scheduledDeliveryAt?: string | null) => {
    if (!customerId || scheduledDeliveryAt === undefined) return true;

    try {
      const res = await updateCustomerCart({
        customerId,
        payload: {
          orderTime: scheduledDeliveryAt,
        },
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.failedSetSchedule"),
          res,
          t("toast.failedSetSchedule")
        );
        return false;
      }

      clearBackendError();
      return true;
    } catch (err) {
      reportBackendError(
        t("toast.failedSetSchedule"),
        err,
        err instanceof Error ? err.message : t("toast.failedSetSchedule")
      );
      return false;
    }
  };

  const applyTip = async (tipAmount: number) => {
    if (!customerId) return;

    const normalizedTip = normalizeCheckoutTipAmount(tipAmount);

    if (normalizedTip === null) return;

    try {
      setApplyingTip(true);

      const res = await updateCustomerCart({
        customerId,
        payload: {
          tipAmount: normalizedTip,
        },
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.failedSetTip"),
          res,
          t("toast.failedSetTip")
        );
        return;
      }

      await fetchCart();
      setAppliedTipAmount(normalizedTip);
      applyTipToCurrentQuote(normalizedTip);
      clearBackendError();
      toast.success(
        normalizedTip > 0 ? t("toast.tipApplied") : t("toast.tipRemoved")
      );
    } catch (err) {
      reportBackendError(
        t("toast.failedSetTip"),
        err,
        err instanceof Error ? err.message : t("toast.failedSetTip")
      );
    } finally {
      setApplyingTip(false);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      setPlacingOrder(true);

      if (!cartItems.length) {
        toast.error(t("toast.cartEmpty"));
        return;
      }

      if (!customerId) {
        toast.error(t("toast.checkoutFailed"));
        return;
      }

      if (isGuest && !hasGuestContact(customer)) {
        toast.error(t("toast.enterGuestContact"));
        return;
      }

      if (isGuest && !privacyPolicyAccepted) {
        toast.error(t("toast.acceptGuestPrivacyPolicy"));
        return;
      }

      if (activeTab === "delivery" && !deliveryAllowed) {
        toast.error(t("toast.deliveryUnavailable"));
        return;
      }

      if (activeTab === "pickup" && !pickupAllowed) {
        toast.error(t("toast.pickupUnavailable"));
        return;
      }

      if (activeTab === "delivery" && isGuest && !hasGuestDeliveryAddress(guestDeliveryAddress)) {
        toast.error(t("toast.enterGuestDeliveryAddress"));
        return;
      }

      if (activeTab === "delivery" && !isGuest && !selectedAddress) {
        toast.error(t("toast.selectAddress"));
        return;
      }

      const addressUpdated = await setCartAddress();
      if (!addressUpdated) return;

      const scheduledDeliveryAt = getScheduledDeliveryAt();

      if (scheduledDeliveryAt === null) {
        toast.error(
          activeTab === "delivery"
            ? t("toast.invalidScheduledDelivery")
            : t("toast.invalidOrderTime")
        );
        return;
      }

      const cartOrderTime =
        activeTab === "pickup" && scheduledDeliveryAt === undefined
          ? null
          : scheduledDeliveryAt;
      const scheduleUpdated = await setCartSchedule(cartOrderTime);
      if (!scheduleUpdated) return;

      const checkoutTipAmount = Math.max(
        0,
        toNumber(cartQuote?.tipAmount, appliedTipAmount)
      );
      const checkoutLoyaltyPoints = Math.max(0, Math.floor(toNumber(loyaltyPoints, 0)));

      if (checkoutLoyaltyPoints > 0) {
        if (!loyalty) {
          toast.error(t("toast.loyaltyUnavailable"));
          return;
        }

        if (checkoutLoyaltyPoints < loyalty.minimumRedeemPoints) {
          toast.error(t("toast.minimumLoyaltyPoints", { points: loyalty.minimumRedeemPoints }));
          return;
        }

        if (checkoutLoyaltyPoints > loyalty.availablePoints) {
          toast.error(t("toast.insufficientLoyaltyPoints"));
          return;
        }
      }

      const res = await checkoutCustomerCart({
        customerId,
        payload: {
          ...(cartOrderTime !== undefined ? { orderTime: cartOrderTime } : {}),
          ...(checkoutTipAmount > 0 ? { tipAmount: checkoutTipAmount } : {}),
          ...(checkoutLoyaltyPoints > 0 ? { loyaltyPoints: checkoutLoyaltyPoints } : {}),
          ...(isGuest
            ? { guestContact: getGuestContactPayload(customer, privacyPolicyAccepted) }
            : {}),
          ...(isGuest && activeTab === "delivery"
            ? { guestDeliveryAddress: getGuestDeliveryAddressPayload(guestDeliveryAddress) }
            : {}),
          paymentMethod: checkoutPaymentMethod,
          customerNote: note,
        },
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.checkoutFailed"),
          res,
          t("toast.checkoutFailed")
        );
        return;
      }

      const orderData = asRecord(res?.data);
      const orderId = typeof orderData.id === "string" || typeof orderData.id === "number" ? orderData.id : "";

      if (!orderId) {
        reportBackendError(
          t("toast.invalidOrderResponse"),
          res,
          t("toast.invalidOrderResponse")
        );
        return;
      }

      clearBackendError();

      if (checkoutPaymentMethod === "STRIPE") {
        const attemptRes = await post(`/v1/payments/orders/${orderId}/attempts`, {
          paymentMethod: "STRIPE",
          currency: "USD",
          note: "Order payment",
        });

        if (hasBackendError(attemptRes) || !attemptRes?.success) {
          reportBackendError(
            t("toast.failedInitiatePayment"),
            attemptRes,
            t("toast.failedInitiatePayment")
          );
          return;
        }

        const payment = asRecord(attemptRes?.data);
        const paymentSession = asRecord(attemptRes?.paymentSession);
        const providerData = asRecord(payment.providerData);
        const clientSecret =
          typeof paymentSession.clientSecret === "string"
            ? paymentSession.clientSecret
            : typeof providerData.clientSecret === "string"
              ? providerData.clientSecret
              : "";
        const publishableKey =
          typeof paymentSession.publishableKey === "string"
            ? paymentSession.publishableKey
            : typeof providerData.publishableKey === "string"
              ? providerData.publishableKey
              : "";

        setStripePayment({
          open: true,
          clientSecret,
          publishableKey,
          paymentId: typeof payment.id === "string" ? payment.id : String(payment.id ?? ""),
          orderId,
        });

        return;
      }

      toast.success(t("toast.orderPlaced"));

      window.dispatchEvent(new Event("loyalty-updated"));
      await clearCart();
      router.push(`/order?success=true&orderId=${orderId}`);
    } catch (err) {
      reportBackendError(
        t("toast.orderFailed"),
        err,
        err instanceof Error ? err.message : t("toast.orderFailed")
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error(t("toast.enterCouponCode"));
      return;
    }

    try {
      setValidatingCoupon(true);

      const res = await patch(`/v1/cart/coupon`, {
        couponCode: couponCode.trim(),
      });

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.invalidCoupon"),
          res,
          t("toast.invalidCoupon")
        );
        return;
      }

      const synced = syncCartFromResponse(res);
      if (!synced) {
        await fetchCart();
      }

      clearBackendError();
      toast.success(t("toast.couponApplied"));
    } catch (err) {
      reportBackendError(
        t("toast.couponValidationFailed"),
        err,
        err instanceof Error ? err.message : t("toast.couponValidationFailed")
      );
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = async () => {
    try {
      setRemovingCoupon(true);

      const res = await del(`/v1/cart/coupon`);

      if (hasBackendError(res)) {
        reportBackendError(
          t("toast.couponRemoveFailed"),
          res,
          t("toast.couponRemoveFailed")
        );
        return;
      }

      setCouponCode("");
      setCouponDiscount(0);

      const synced = syncCartFromResponse(res);
      if (!synced) {
        await fetchCart();
      }

      clearBackendError();
      toast.success(t("toast.couponRemoved"));
    } catch (err) {
      reportBackendError(
        t("toast.couponRemoveFailed"),
        err,
        err instanceof Error ? err.message : t("toast.couponRemoveFailed")
      );
    } finally {
      setRemovingCoupon(false);
    }
  };

  return (
    <div className="mx-auto mb-[113px] mt-[63px] max-w-[1400px] px-4 md:px-30">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="space-y-[38px] lg:col-span-7">
          <Tabs
            activeTab={activeTab}
            canShowDelivery={deliveryAllowed}
            canShowPickup={pickupAllowed}
          />

          {activeTab === "delivery" ? (
            <DeliverySection
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              note={note}
              setNote={setNote}
              customer={customer}
              setCustomer={setCustomer}
              isGuest={isGuest}
              privacyPolicyAccepted={privacyPolicyAccepted}
              setPrivacyPolicyAccepted={setPrivacyPolicyAccepted}
              privacyPolicy={guestPrivacyPolicy}
              privacyPolicyLoading={privacyPolicyLoading}
              guestDeliveryAddress={guestDeliveryAddress}
              setGuestDeliveryAddress={setGuestDeliveryAddress}
              paymentMethod={checkoutPaymentMethod}
              setPaymentMethod={setPaymentMethod}
              scheduledDeliveryValue={scheduledDeliveryValue}
              setScheduledDeliveryValue={setScheduledDeliveryValue}
              selectedBranch={checkoutBranch}
              totalPreparationMinutes={totalPreparationMinutes}
            />
          ) : (
            <PickupSection
              selectedAddress={selectedAddress}
              setSelectedAddress={setSelectedAddress}
              note={note}
              setNote={setNote}
              customer={customer}
              setCustomer={setCustomer}
              isGuest={isGuest}
              privacyPolicyAccepted={privacyPolicyAccepted}
              setPrivacyPolicyAccepted={setPrivacyPolicyAccepted}
              privacyPolicy={guestPrivacyPolicy}
              privacyPolicyLoading={privacyPolicyLoading}
              paymentMethod={checkoutPaymentMethod}
              setPaymentMethod={setPaymentMethod}
              pickupDate={pickupDate}
              setPickupDate={setPickupDate}
              pickupTime={pickupTime}
              setPickupTime={setPickupTime}
              selectedBranch={checkoutBranch}
            />
          )}
        </div>

        <div className="lg:col-span-5">
          <CartSummarySection
            cartItems={cartItems}
            quote={cartQuote}
            appliedTipAmount={appliedTipAmount}
            updateQuantity={updateQuantity}
            deleteItem={deleteItem}
            clearCart={clearCart}
            backendError={backendError}
            checkoutType={activeTab}
            onPlaceOrder={handlePlaceOrder}
            placingOrder={placingOrder || loadingCart}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={removeCoupon}
            couponDiscount={couponDiscount}
            validatingCoupon={validatingCoupon}
            removingCoupon={removingCoupon}
            loadingCart={loadingCart}
            onApplyTip={applyTip}
            applyingTip={applyingTip}
            loyalty={loyalty}
            loyaltyPoints={loyaltyPoints}
            setLoyaltyPoints={setLoyaltyPoints}
            loadingLoyalty={loadingLoyalty}
            isGuest={isGuest}
          />
        </div>
      </div>

      {stripePayment.open && stripePromise && stripePayment.clientSecret ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative max-h-[90vh] w-[min(420px,calc(100vw-32px))] overflow-auto rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
            <button
              type="button"
              onClick={handleCloseStripePayment}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
              aria-label="Close payment popup"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="mb-2 pr-10 text-lg font-semibold">{t("completePayment")}</h2>
            <p className="mb-5 text-sm leading-6 text-gray-500">
              You can close this and continue payment later from your order details.
            </p>

            <Elements
              stripe={stripePromise}
              options={{ clientSecret: stripePayment.clientSecret }}
            >
              <OrderStripeCheckout
                onSuccess={async () => {
                  const paidOrderId = stripePayment.orderId;

                  resetStripePayment();

                  window.dispatchEvent(new Event("loyalty-updated"));
                  await clearCart();
                  router.push(`/order?success=true&orderId=${paidOrderId}`);
                }}
              />
            </Elements>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const OrderStripeCheckout = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const t = useTranslations("checkout");
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    try {
      setLoading(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || t("toast.paymentFailed"));
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        toast.success(t("toast.paymentSuccessful"));
        onSuccess();
        return;
      }

      toast.error(t("toast.paymentNotCompleted"));
    } catch (err) {
      toast.error(t("toast.paymentFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentElement />

      <button
        type="button"
        onClick={handlePay}
        disabled={loading || !stripe || !elements}
        className="h-11 w-full rounded-xl text-white disabled:opacity-60"
        style={{ background: "var(--primary)" }}
      >
        {loading ? t("processing") : t("payNow")}
      </button>
    </div>
  );
};

export function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F8F8]" />}>
      <CheckoutPageContent />
    </Suspense>
  );
}
